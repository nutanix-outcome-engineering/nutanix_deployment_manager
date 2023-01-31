const { Graph } = require('graphology')
const { willCreateCycle } = require('graphology-dag')
const { v4: uuid} = require('uuid')

const TaskState = {
  Pending: 'pending',
  Scheduled: 'scheduled',
  Completed: 'completed',
  Failed: 'failed'
}

class TaskFlow {
  constructor(graph, id) {
    this.id = id || uuid()
    this.version = null

    /** @type {Graph} */
    this.graph = graph
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

  static fromJSONDefinition(definition) {
    const graph = this.graphFromJSONDefinition(definition)

    return new TaskFlow(graph)
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

  schedule(task, jobId) {
    this.graph.mergeNodeAttributes(task.name, { state: TaskState.Scheduled, jobId })
  }

  complete(task, results) {
    this.graph.mergeNodeAttributes(task.name, { state: TaskState.Completed, results })
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

}

class DiscoverNodeTaskFlow extends TaskFlow {
  constructor(id, inputData) {
    super(undefined, id)
    let taskDefinition = {
      tasks: [
        {
          name: 'DiscoverBMC'
        },
        {
          name: 'DiscoverCVMDirect',
          needs: ['DiscoverBMC']
          //onFailure: 'DiscoverCVMThroughBMC'
        },
        // {
        //   name: 'DiscoverCVMThroughBMC',
        //   needs: ['DiscoverBMC']
        // },
        {
          name: 'IngestNode',
          needs:[
            'DiscoverBMC',
            'DiscoverCVMDirect',
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

    taskDefinition.tasks.forEach(task => {
      if (!task.needs) {
        task.data = inputData
      }
    })

    this.graph = this.constructor.graphFromJSONDefinition(taskDefinition)
  }

}

module.exports = {
  TaskFlow,
  DiscoverNodeTaskFlow,
}
