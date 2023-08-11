const { Switch }  = require('../models')

module.exports = {
  getAll: async (req, res, next) => {
    const switches = await Switch.getAll()
    res.json(switches.map(sw => sw.toJSON()))
  },
  get: async (req, res, next) => {
    const sw = await Switch.getByID(req.params.id)
    res.json(sw.toJSON())
  },
  add: async (req, res, next) => {
    const sw = new Switch(req.body)
    const added = await sw.create()
    res.status(201).json(added.toJSON())
  },
  update: async(req, res, next) => {
    const existing = await Switch.getByID(req.params.id)
    existing.type = req.body.type || existing.type
    existing.rackID = req.body.rackID || existing.rackID
    existing.ip = req.body.ip || existing.ip
    existing.name = req.body.name || existing.name
    existing.rackUnit = req.body.rackUnit || existing.rackUnit
    const resp = await existing.update()
    res.status(200).json(existing.toJSON())
  }
}
