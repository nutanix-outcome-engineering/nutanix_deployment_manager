module.exports = {
  ...require('./DiscoveryTasks'),
  ...require('./ClusterBuildTasks'),
  ...require('./UploadTasks'),
  ...require('./TaskFlow'),
  ...require('./TaskFlowFactory'),
  TaskFlowFactory: {
    ...require('./TaskFlowFactory')
  }
}
