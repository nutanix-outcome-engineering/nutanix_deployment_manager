const { Site, PrismCentral, vCenter, AOS, Hypervisor }  = require('../models')
const db = require('../database')
const config = require('../lib/config')
const { extractKeyDetails } = require('../lib/crypto-utils')
const { v4: uuid} = require('uuid')
const { mkdir } = require('fs/promises')
const { resolve } = require('path')
const log = require('../lib/logger.js')

function validateBody(body) {
  const uniquePCHostnameOrIPs = new Set(body.pcServers.map(pc => pc.hostnameOrIP))
  const uniquePCDisplayNames = new Set(body.pcServers.map(pc => pc.displayName.toLowerCase()))
  const uniquevCenterHostnameOrIPs = new Set(body.vCenterServers.map(vcsa => vcsa.hostnameOrIP))
  const uniquevCenterDisplayNames = new Set(body.vCenterServers.map(vcsa => vcsa.displayName.toLowerCase()))
  const defaultPC = body.pcServers.filter(pc => pc.default)
  const defaultvCenter = body.vCenterServers.filter(vcsa => vcsa.default)
  if (uniquePCHostnameOrIPs.size != body.pcServers.length) {
    let err = new Error('Duplicate PC hostname or IP detected.')
    err.status = 400
    throw err
  }
  if (uniquePCDisplayNames.size != body.pcServers.length) {
    let err = new Error('Duplicate PC display name detected.')
    err.status = 400
    throw err
  }
  if (uniquevCenterHostnameOrIPs.size != body.vCenterServers.length) {
    let err = new Error('Duplicate vCenter hostname or IP detected.')
    err.status = 400
    throw err
  }
  if (uniquevCenterDisplayNames.size != body.vCenterServers.length) {
    let err = new Error('Duplicate vCenter display name detected.')
    err.status = 400
    throw err
  }
  if (defaultPC.length > 1) {
    let err = new Error('Multiple default PCs detected')
    err.status = 400
    throw err
  }
  if (defaultvCenter.length > 1) {
    let err = new Error('Multiple default vCenters detected')
    err.status = 400
    throw err
  }
}

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
    validateBody(req.body)

    let transaction = await db.transaction()
    try {
      const site = new Site(req.body)
      if (req.body.pcServers.length > 0) {
        let pcServers = req.body.pcServers.map(pc => new PrismCentral(pc))
        pcServers = await Promise.all(pcServers.map(pc => pc.create(transaction)))
        site.pcServers = pcServers
      }
      if (req.body.vCenterServers.length > 0) {
        let vCenterServers = req.body.vCenterServers.map(vcsa => new vCenter(vcsa))
        vCenterServers = await Promise.all(vCenterServers.map(vcsa => vcsa.create(transaction)))
        site.vCenterServers = vCenterServers
      }
      const added = await site.create(transaction)
      if (config.filestore.local) {
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`), {recursive: true})
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`, 'aos'), {recursive: true})
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`, 'hypervisor'), {recursive: true})
      } else {
        //TODO: do something different here. Probably mount the NFS server in $tusBase/$exportDirectory/$siteId
        // For now when in dev and the NFS server is remote make sure it is mounted at $tusBase/$exportDirectory
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`), {recursive: true})
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`, 'aos'), {recursive: true})
        await mkdir(resolve(config.filestore.tusBase, config.filestore.exportDirectory, `${added.id}`, 'hypervisor'), {recursive: true})
      }
      await transaction.commit()
      res.status(201).json(added.toJSON())
    } catch (err) {
      log.error(`Error creating site with name ${req.body.name}: ${err}`)
      await transaction.rollback()
      next(err)
    }
  },
  update: async(req, res, next) => {
    validateBody(req.body)

    let transaction = await db.transaction()
    try {
      const existing = await Site.getByID(req.params.id)
      existing.name = req.body.name || existing.name
      existing.dnsServers = req.body.dnsServers || existing.dnsServers
      existing.ntpServers = req.body.ntpServers || existing.ntpServers
      existing.infraCluster = req.body.infraCluster || existing.infraCluster
      existing.smtp = {
        address: req.body.smtp.address || existing.smtp.address,
        fromAddress: req.body.smtp.fromAddress || existing.smtp.fromAddress,
        port: req.body.smtp.port || existing.smtp.port,
        securityMode: req.body.smtp.port || existing.smtp.port,
        credentials: {
          username: req.body.smtp.credentials.username || existing.smtp.credentials.username,
          password: req.body.smtp.credentials.password || existing.smtp.credentials.password,
        }
      }
      existing.lcmDarksiteUrl = req.body.lcmDarksiteUrl || existing.lcmDarksiteUrl

      existing.ldap = {
        directoryName: req.body.ldap.directoryName || existing.ldap.directoryName,
        directoryUrl: req.body.ldap.directoryUrl || existing.ldap.directoryUrl,
        credentials: {
          username: req.body.ldap.credentials.username || existing.ldap.credentials.username,
          password: req.body.ldap.credentials.password || existing.ldap.credentials.password,
        }
      }

      if (req.body.prism.caChain) {
        existing.prism.caChain = req.body.prism.caChain
      }
      if (req.body.prism.certificate) {
        existing.prism.certificate = req.body.prism.certificate
      }
      if (req.body.prism.key) {
        existing.prism.key = req.body.prism.key
        const keyDetails = extractKeyDetails(req.body.prism.key)
        existing.prism.keyType = `${keyDetails.type.toUpperCase()}_${keyDetails.length}`
      }

      // Site PC management code
      let newPCServers = []
      // Handle Updates
      let updatedPCServers = await PrismCentral.getByIds(req.body.pcServers.filter(pc => pc.id).map(pc => pc.id), transaction)
      updatedPCServers.forEach(pc => {
        let updates = req.body.pcServers.find(uPC => uPC.id === pc.id)
        pc.displayName = updates.displayName || pc.displayName
        pc.hostnameOrIP = updates.hostnameOrIP || pc.hostnameOrIP
        pc.default  = updates.default ?? pc.default // Use nullish coalescing here so that we catch a change to false
        pc.credentials.username = updates.credentials?.username || pc.credentials.username
        pc.credentials.password = updates.credentials?.password || pc.credentials.password
      })
      await Promise.all(updatedPCServers.map(pc => pc.update(transaction)))
      // Handle additions and removes
      if (existing.pcServers.length != req.body.pcServers.length) {
        newPCServers = req.body.pcServers.filter(pc => !pc.id).map(pc => new PrismCentral(pc))

        let needToRemove = existing.pcServers.filter(pc => updatedPCServers.findIndex(uPC => uPC.id == pc.id) == -1)
        await Promise.all(needToRemove.map(pc => pc.delete(transaction)))

        newPCServers = await Promise.all(newPCServers.map(pc => pc.create(transaction)))
      }
      existing.pcServers = [...newPCServers, ...updatedPCServers]

      // Site vCenter management code
      let newvCenterServers = []
      // Handle Updates
      let updatedvCenterServers = await vCenter.getByIds(req.body.vCenterServers.filter(vcsa => vcsa.id).map(vcsa => vcsa.id), transaction)
      updatedvCenterServers.forEach(vcsa => {
        let updates = req.body.vCenterServers.find(uVCSA => uVCSA.id === vcsa.id)
        vcsa.displayName = updates.displayName || vcsa.displayName
        vcsa.hostnameOrIP = updates.hostnameOrIP || vcsa.hostnameOrIP
        vcsa.default  = updates.default ?? vcsa.default // Use nullish coalescing here so that we catch a change to false
        vcsa.credentials.username = updates.credentials?.username || vcsa.credentials.username
        vcsa.credentials.password = updates.credentials?.password || vcsa.credentials.password
      })
      await Promise.all(updatedvCenterServers.map(vcsa => vcsa.update(transaction)))
      // Handle additions and removes
      if (existing.vCenterServers.length != req.body.vCenterServers.length) {
        newvCenterServers = req.body.vCenterServers.filter(vcsa => !vcsa.id).map(vcsa => new vCenter(vcsa))

        let needToRemove = existing.vCenterServers.filter(vcsa => updatedvCenterServers.findIndex(uVCSA => uVCSA.id == vcsa.id) == -1)
        await Promise.all(needToRemove.map(vcsa => vcsa.delete(transaction)))

        newvCenterServers = await Promise.all(newvCenterServers.map(vcsa => vcsa.create(transaction)))
      }
      existing.vCenterServers = [...newvCenterServers, ...updatedvCenterServers]

      const resp = await existing.update(transaction)
      await transaction.commit()
      res.status(200).json(existing.toJSON())
    } catch (err) {
      transaction.rollback()
      next(err)
    }
  },
  aos: {
    add: async (req, res, next) => {
      let transaction = await db.transaction()
      try {
        let aos = new AOS({...req.body, site: req.params.id, uuid: uuid()})
        let site = await Site.getByID(req.params.id)
        site.aosList.push(aos)
        await site.update(transaction)
        await aos.create(transaction)
        await transaction.commit()
        res.status(201).json(aos.toJSON())
      } catch (err) {
        transaction.rollback()
        next(err)
      }

    },
    update: async (req, res, next) => {
      const existing = await AOS.getById(req.params.aosId)

      existing.name = req.body.name || existing.name
      existing.version = req.body.version || existing.version
      existing.status = req.body.status || existing.status
      await existing.update()

      res.status(200).json(existing.toJSON())
    }
  },
  hypervisor: {
    add: async (req, res, next) => {
      let transaction = await db.transaction()
      try {
        let hypervisor = new Hypervisor({...req.body, site: req.params.id, uuid: uuid()})
        let site = await Site.getByID(req.params.id)
        site.hypervisorList.push(hypervisor)
        await site.update(transaction)
        await hypervisor.create(transaction)
        await transaction.commit()
        res.status(201).json(hypervisor.toJSON())
      } catch (err) {
        transaction.rollback()
        next(err)
      }

    },
    update: async (req, res, next) => {
      const existing = await Hypervisor.getById(req.params.hypervisorId)

      existing.name = req.body.name || existing.name
      existing.version = req.body.version || existing.version
      existing.status = req.body.status || existing.status
      await existing.update()

      res.status(200).json(existing.toJSON())
    }
  }
}
