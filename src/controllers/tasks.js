const { TaskFlow } = require('../models')

module.exports = {
  task: async (req, res, next) => {
    let taskId = req.params.taskId

    let taskFlow = await TaskFlow.getByID(taskId)

    res.json(taskFlow.toJSON())
  }
}
