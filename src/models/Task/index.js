module.exports = {
  ...require('./Task'),
  ...require('./TaskFlow'),
  ...require('./TaskFlowFactory'),
  TaskFlowFactory: {
    ...require('./TaskFlowFactory')
  }
}
