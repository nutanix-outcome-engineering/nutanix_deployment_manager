const { Site }  = require('../models')

module.exports = {
  getAll: async (req, res, next) => {
    const sites = await Site.getAll()
    res.json(sites.map(site => site.toJSON()))
  },
  get: async (req, res, next) => {
    const site = await Site.getByID(req.params.id)
    res.json(site.toJSON())
  },
  add: async (req, res, next) => {
    const site = new Site(req.body)
    const added = await site.create()
    res.status(201).json(added.toJSON())
  },
  update: async(req, res, next) => {
    const existing = await Site.getByID(req.params.id)
    existing.name = req.body.name
    existing.dnsServers = req.body.dnsServers
    existing.ntpServers = req.body.ntpServers
    existing.infraCluster = req.body.infraCluster
    const resp = await existing.update()
    res.status(200).json(existing.toJSON())
  }
}
