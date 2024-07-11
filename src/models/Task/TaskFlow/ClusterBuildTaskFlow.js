const TaskFlow = require('./TaskFlowBase')

class ClusterBuildTaskFlow extends TaskFlow {
  constructor(graph, id, inputData) {
    super(graph, id)
    this.type = 'ClusterBuildTaskFlow'
    this.ref = `ClusterBuild:${inputData?.cluster.id}`
    let taskDefinition = {
      tasks: [
        {
          name: 'ClusterBuild'
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

  async onFailure(job) {
  }
}


module.exports = {
  ClusterBuildTaskFlow
}
