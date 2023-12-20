module.exports = {
  ...require('./DiscoveryTasks'),
  ...require('./UploadTasks'),
  ...require('./TaskFlow'),
  ...require('./TaskFlowFactory'),
  TaskFlowFactory: {
    ...require('./TaskFlowFactory')
  }
}
