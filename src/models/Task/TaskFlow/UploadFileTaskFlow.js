const AOS = require('../../AOS')
const Hypervisor = require('../../Hypervisor')
const TaskFlow = require('./TaskFlowBase')

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
  UploadAosTaskFlow,
  UploadHypervisorTaskFlow
}
