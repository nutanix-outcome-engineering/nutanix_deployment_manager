const db = require('../database')
const { Site, Foundation }  = require('../models')
const log = require('../lib/logger.js')

module.exports = {
  getAll: async (req, res, next) => {
    const fvms = await Foundation.getAll()

    res.status(200).json(fvms.map(fvm => fvm.toJSON()))
  },
  get: async (req, res, next) => {
    next('Not implemented')
  },
  create: async (req, res, next) => {
    let transaction = await db.transaction()
    try {
      let siteId = req.body.site.id
      const site = await Site.getByID(siteId)
      const fvm = new Foundation({ip: req.body.ip, siteId: siteId})

      await fvm.create(transaction)
      await fvm.setup(req.body.credentials, site.nfsServer)
      await transaction.commit()

      res.status(201).json(fvm.toJSON())
    } catch (err) {
      transaction.rollback()
      log.error(`Error creating foundation server ${err}`)
      next(`Error creating foundation server`)
    }
  },
  update: async (req, res, next) => {
    next('Not implemented')
  },
  delete: async (req, res, next) => {
    const fvm = Foundation.getById(req.params.fvmId)

    await fvm.delete()
    res.status(204).send()
  }
}
