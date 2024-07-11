const IngestData = require('../../IngestData')
const TaskFlow = require('./TaskFlowBase')

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
  DiscoverNodeTaskFlow
}
