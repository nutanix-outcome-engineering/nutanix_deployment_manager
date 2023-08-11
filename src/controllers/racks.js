const { Rack }  = require('../models')

module.exports = {
  getAll: async (req, res, next) => {
    const racks = await Rack.getAll()
    res.json(racks.map(rack => rack.toJSON()))
  },
  get: async (req, res, next) => {
    const rack = await Rack.getByID(req.params.id)
    res.json(rack.toJSON())
  },
  add: async (req, res, next) => {
    const rack = new Rack(req.body)
    const added = await rack.create()
    res.status(201).json(added.toJSON())
  },
  update: async(req, res, next) => {
    const existing = await Rack.getByID(req.params.id)
    existing.siteID = req.body.siteID || existing.siteID
    existing.name = req.body.name || existing.name
    existing.row = req.body.row || existing.row
    existing.column = req.body.column || existing.column
    existing.datahall = req.body.datahall || existing.datahall
    const resp = await existing.update()
    res.status(200).json(existing.toJSON())
  }
}
