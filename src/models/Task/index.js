module.exports = {
  ...require('./DiscoveryTasks'),
  ...require('./TaskFlow'),
  ...require('./TaskFlowFactory'),
  TaskFlowFactory: {
    ...require('./TaskFlowFactory')
  }
}
