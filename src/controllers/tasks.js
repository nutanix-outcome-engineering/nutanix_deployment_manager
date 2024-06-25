const { TaskFlowFactory } = require('../models')

module.exports = {
  getAll: async (req, res, next) => {
    const tasks = await TaskFlowFactory.getAll()

    res.json(tasks.map(t => t.toJSON()))
  },
  task: async (req, res, next) => {
    let taskId = req.params.taskId

    let taskFlow = await TaskFlowFactory.getByID(taskId)

    res.json(taskFlow.toJSON())
  }
}
