const { Graph } = require('graphology')
const { willCreateCycle, topologicalSort } = require('graphology-dag')
const { v4: uuid} = require('uuid')
const Task = require('.')
const IngestData = require('../IngestData')
const db = require('../../database')

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
    this.status = null
    this.type = 'TaskFlow'

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

  complete(task, results) {
    if (task) {
      this.graph.mergeNodeAttributes(task.name, { state: TaskState.Completed, results })
    } else {
      if (this.graph.everyNode((node, attributes) => attributes.state == TaskState.Completed)) {
        this.status = 'complete'
      } else if (this.graph.someNode((node, attributes) => attributes.state == TaskState.Failed)) {
        this.status = 'failed'
      }
    }
  }

  fail(task, failedReason) {
    this.graph.mergeNodeAttributes(task.name, { state: TaskState.Failed, failedReason })
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
      graph: JSON.stringify(this.graph.export())
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
      failureReason: this.getFailureReason(),
      rawResults: rawResults,
      statistics: {
        completedTasks: completedTasks.length,
        failedTasks: failedTasks.length,
        totalTask: this.graph.order
      }
    }
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

module.exports = {
  TaskFlow,
  DiscoverNodeTaskFlow,
}
