const { Graph } = require('graphology')
const { willCreateCycle, topologicalSort } = require('graphology-dag')
const { v4: uuid} = require('uuid')
const IngestData = require('../IngestData')
const AOS = require('../AOS')
const Hypervisor = require('../Hypervisor')
const db = require('../../database')
const { getQueueByName } = require('../../lib/queues.js')

const TABLE = 'taskFlow'
const TaskState = {
  Pending: 'pending',
  Scheduled: 'scheduled',
  Completed: 'completed',
  Failed: 'failed'
}

class TaskFlow {
  constructor(graph, id) {
    this.id = id || uuid()
    this.status = 'pending'
    this.type = 'TaskFlow'
    this.ref = null
    this.startDate = new Date()
    this.stopDate = null

    /** @type {Graph} */
    this.graph = graph

    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static graphFromJSONDefinition(definition) {
    // Guard that task names are unique.
    const uniqueTasks = [...new Set(definition.tasks.map(task => task.name))].length
    if (uniqueTasks !== definition.tasks.length) {
      throw new Error(`Task names must be unique.`)
    }

    // Create a directed, acyclic graph that does not allow self loops.
    const graph = new Graph({ allowSelfLoops: false, type: 'directed' })

    definition.tasks.forEach((task) => {
      graph.addNode(task.name, {state: TaskState.Pending, data: task.data})
    })
    definition.tasks.forEach((task) => {
      if (task.needs && task.needs.length > 0) {
        // Dependencies are explicitly declared in process definition
        task.needs.forEach(name => {
          if (graph.hasNode(name) === false) {
            throw new Error(`"${task.name}" references non-existent "${name}" task.`)
          }

          if (willCreateCycle(graph, name, task.name)) {
            throw new Error(`Loops in the process definition are not allowed.`)
          }

          graph.addDirectedEdgeWithKey(`${name}->${task.name}`, name, task.name)
        })
      }
    })

    return graph
  }


  async create() {
    return await db(TABLE).insert(this.serialize())
  }

  async update() {
    // let serialized = this.serialize()
    // let changes = jsondiffpatch.diff(serialized, this._record)
    // let sparseCommit = {}
    // for (let key in changes) {
    //   sparseCommit[key] = serialized[key]
    // }
    let q = db(TABLE).where({id: this.id}).update(this.serialize())
    return await q
  }

  async fromRecord(record) {
    this._record = record
    this.status = record.status
    this.type = record.type

    this.startDate = record.startDate,
    this.stopDate = record.stopDate
    this.ref = record.ref

    await this.getProgress()

    return this
  }

  getPendingSubtasks() {
    return this.graph.reduceNodes((nodes, name, attributes) => {
      if (this.graph.inboundNeighbors(name).length === 0 && attributes.state === TaskState.Pending) {
        // The node has no dependencies and is not complete.
        nodes.push({
          pid: this.id,
          name,
          attributes
        })
      } else if (this.graph.everyInNeighbor(name, (name, attributes) => attributes.state === TaskState.Completed) && attributes.state === TaskState.Pending) {
        // All dependencies of the node are complete and the node is not complete.
        nodes.push({
          pid: this.id,
          name,
          attributes
        })
      }

      return nodes
    }, [])
  }

  getActiveSubtasks() {
    return this.graph.reduceNodes((nodes, name, attributes) => {
      if (attributes.state === TaskState.Scheduled) {
        // The node has no dependencies and is not complete.
        nodes.push({
          pid: this.id,
          name,
          attributes
        })
      }

      return nodes
    }, [])
  }

  getAllActivePendingSubtasks() {
    return this.graph.reduceNodes((nodes, name, attributes) => {
      if (attributes.state === TaskState.Scheduled || attributes.state === TaskState.Pending) {
        nodes.push({
          pid: this.id,
          name,
          attributes
        })
      }
      return nodes
    }, [])
  }

  getDependencieResults(task) {
    let dependencies = this.graph.reduceInNeighbors(task.name, (results, name, attributes) => {
      return {
        ...results,
        ...attributes.results
      }
    }, {})

    return dependencies
  }

  getFailureReason() {
    let failureReasons = this.graph.reduceNodes((reasons, node, attributes) => {
      if (attributes.failedReason) {
        reasons.push(attributes.failedReason)
      }
      return reasons
    }, [])

    return failureReasons.join(', ')
  }

  getFinalResult() {
    let finalTask = topologicalSort(this.graph)[this.graph.order - 1]

    return this.graph.getNodeAttribute(finalTask, 'results')
  }

  schedule(task, jobId) {
    this.graph.mergeNodeAttributes(task.name, { state: TaskState.Scheduled, jobId })
  }

  updateProgress(task, progress) {
    this.graph.mergeNodeAttributes(task.name, { progress })
  }

  complete(task, results) {
    if (task) {
      this.graph.mergeNodeAttributes(task.name, { state: TaskState.Completed, results })
    } else {
      if (this.graph.everyNode((node, attributes) => attributes.state == TaskState.Completed)) {
        this.status = 'complete'
      } else if (this.graph.someNode((node, attributes) => attributes.state == TaskState.Failed)) {
        this.status = 'failed'
      }
      this.stopDate = new Date()
    }
  }

  fail(task, failedReason) {
    let failureReason = this.graph.getNodeAttribute(task.name, 'failedReason')
    if (failureReason) {
      failureReason = `${failedReason}, ${failedReason}`
    } else {
      failedReason = failedReason
    }
    this.graph.mergeNodeAttributes(task.name, { state: TaskState.Failed, failedReason: failureReason})
  }

  async finalize(queue) {
    await Promise.all(this.graph.mapNodes(async (node, attributes) => {
      const job = await queue.getJob(attributes.jobId)
      const jobState = await job.getState()
      if (jobState == 'completed') {
        this.complete({name: job.data.taskType}, job.returnvalue)
      } else if (jobState == 'failed') {
        this.fail({name: job.data.taskType}, job.failedReason)
      }
    }))
    this.complete()
  }

  async getProgress() {
    const progressList = await Promise.all(this.graph.mapNodes(async (node, attributes) => {
      const { jobId, queueName } = attributes
      const progress = {
        name: node,
        state: attributes.state
      }
      if (jobId && queueName) {
        const queue = getQueueByName(queueName)
        const job = await queue.getJob(jobId)
        progress.progress = new Number(job.progress)
        progress.status = await job.getState()
      } else {
        progress.status = attributes.state
        progress.progress = 0
      }
      return progress
    }))
    this.progress = {
      progress: progressList.reduce((sum, subTask) => {return sum + subTask.progress}, 0) / progressList.length,
      subTasks: progressList
    }
  }

  isSubTaskPending(name) {
    let taskState =  this.graph.getNodeAttribute(name, 'state')
    return taskState == TaskState.Pending
  }

  isComplete() {
    let completedCount = 0
    let failedCount = 0
    this.graph.forEachNode((node, attributes) => {
      if (TaskState.Completed === attributes.state) {
        completedCount++
      } else if (TaskState.Failed === attributes.state) {
        failedCount++
      }
    })
    let doneCount = completedCount + failedCount

    return doneCount == this.graph.nodes().length || failedCount > 0
  }

  hasFailed() {
    return this.status === 'failed'
  }

  serialize() {
    return {
      id: this.id,
      status: this.status,
      type: this.type,
      graph: JSON.stringify(this.graph.export()),
      startDate: this.startDate,
      stopDate: this.stopDate,
      ref: this.ref
    }
  }

  toJSON() {
    let completedTasks = this.graph.filterNodes((node, attributes) => attributes.state == TaskState.Completed)
    let failedTasks = this.graph.filterNodes((node, attributes) => attributes.state == TaskState.Failed)
    const rawResults = this.getFinalResult()
    return {
      id: this.id,
      status: this.status,
      type: this.type,
      startDate: this.startDate,
      stopDate: this.stopDate,
      failureReason: this.getFailureReason(),
      rawResults: rawResults,
      statistics: {
        completedTasks: completedTasks.length,
        failedTasks: failedTasks.length,
        totalTasks: this.graph.order
      },
      progress: this.progress
    }
  }

  /**
   * Failure in child fails parent
   *
   * Don't use this for complex dependency chains, it probably won't work as expected
   * Example: two tasks have the same dependent task
   * Also won't work if there isn't a single last task
   * Example: the process has two tasks that can run in parallel
   * TODO: fix for the above
   *
   */
  generateJobsForQueue(queueName) {
    let tasksInOrder = topologicalSort(this.graph).reverse()
    let jobChain = {
      name: `${tasksInOrder[0]}Task`,
      queueName: queueName,
      data: {
        taskFlowId: this.id,
        taskType: `${tasksInOrder[0]}`,
        ...this.graph.getNodeAttribute(tasksInOrder[0], 'data')
      },
      children: []
    }
    function generateChildTasks(parentTask, parentJob) {
      let dependencies = this.graph.inNeighbors(parentTask)
      if (dependencies.length > 0) {
        for (let task of dependencies) {
          let job = {
            name: `${task}Task`,
            queueName: queueName,
            data: {
              taskFlowId: this.id,
              taskType: task,
              ...this.graph.getNodeAttribute(task, 'data')
            },
            opts: {failParentOnFailure: true},
            children: []
          }
          generateChildTasks.bind(this)(task, job)
          parentJob.children.push(job)
        }
      } else {
        delete parentJob.children
      }
    }
    generateChildTasks.bind(this)(tasksInOrder[0], jobChain)

    return jobChain
  }

  addJobIdsToTasks(jobTree) {
    function parseJobTree(jobTree, job=jobTree.job, jobList=[]) {
      jobList.push([job.data.taskType, job.id, job.queueName])
      if (jobTree.children) {
        jobTree.children.forEach(child => parseJobTree(child, child.job, jobList))
      }
      return jobList
    }

    let idList = parseJobTree(jobTree)
    idList.forEach(job => {
      let [ name, jobId, queueName ] = job
      this.graph.mergeNodeAttributes(name, {jobId, queueName})
    }, this)
  }

}

class DiscoverNodeTaskFlow extends TaskFlow {
  constructor(graph, id, inputData) {
    super(graph, id)
    this.type = 'DiscoverNodeTaskFlow'
    let taskDefinition = {
      tasks: [
        {
          name: 'DiscoverBMC'
        },
        {// TODO: add how to do retries here
          name: 'DiscoverCVMDirect',
          needs: ['DiscoverBMC']
          //onFailure: 'DiscoverCVMThroughBMC'
        },
        {
          name: 'FetchLLDP',
          needs: ['DiscoverCVMDirect']
        },
        {
          name: 'IngestNode',
          needs:[
            'DiscoverBMC',
            'DiscoverCVMDirect',
            'FetchLLDP'
            // 'DiscoverCVMThroughBMC'
          ]/** {
            'oneOf': [
              'DiscoverCVMDirect',
              'DiscoverCVMThroughBMC'
            ]
          }*/
        },
      ]
    }

    if (!graph) {
      taskDefinition.tasks.forEach(task => {
        if (!task.needs) {
          task.data = inputData
        }
      })

      this.graph = this.constructor.graphFromJSONDefinition(taskDefinition)
    }
  }

  // TODO: maybe handle partial ingest based on what succeeded?
  async onFailure() {
    let node = await IngestData.getByIngestTaskUUID(this.id)

    node.ingestState = 'failed'

    await node.update()
  }
}

class UploadAosTaskFlow extends TaskFlow {
  constructor(graph, id, inputData) {
    super(graph, id)
    this.type = 'UploadAosTaskFlow'
    this.ref = `AOS:${inputData?.aosUUID}`
    let taskDefinition = {
      tasks: [
        {
          name: 'UploadAOS'
        },
        {
          name: 'PostUploadAOS',
          needs: ['UploadAOS']
        }
      ]
    }

    if (!graph) {
      taskDefinition.tasks.forEach(task => {
        if (!task.needs) {
          task.data = inputData
        }
      })

      this.graph = this.constructor.graphFromJSONDefinition(taskDefinition)
    }
  }

  async onFailure() {
    let uuid = this.graph.getNodeAttribute('UploadAOS', 'data').aosUUID
    let aos = await AOS.getById(uuid)
    aos.transferStatus = 'failed'

    await aos.update()
  }
}

class UploadHypervisorTaskFlow extends TaskFlow {
  constructor(graph, id, inputData) {
    super(graph, id)
    this.type = 'UploadHypervisorTaskFlow'
    this.ref = `Hypervisor:${inputData?.hypervisorUUID}`
    let taskDefinition = {
      tasks: [
        {
          name: 'UploadHypervisor'
        },
        {
          name: 'PostUploadHypervisor',
          needs: ['UploadHypervisor']
        }
      ]
    }

    if (!graph) {
      taskDefinition.tasks.forEach(task => {
        if (!task.needs) {
          task.data = inputData
        }
      })

      this.graph = this.constructor.graphFromJSONDefinition(taskDefinition)
    }
  }

  async onFailure() {
    let uuid = this.graph.getNodeAttribute('UploadHypervisor', 'data').hypervisorUUID
    let hypervisor = await Hypervisor.getById(uuid)
    hypervisor.transferStatus = 'failed'

    await hypervisor.update()
  }
}

module.exports = {
  TaskFlow,
  DiscoverNodeTaskFlow,
  UploadAosTaskFlow,
  UploadHypervisorTaskFlow
}
