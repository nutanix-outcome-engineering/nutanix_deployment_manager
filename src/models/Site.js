const db = require('../database')
const config = require('../lib/config')
const jsondiffpatch = require('jsondiffpatch')
const crypto = require('../lib/crypto-utils.js')
const PrismCentral = require('./PrismCentral.js')
const vCenter = require('./vCenter.js')
const AOS = require('./AOS.js')
const Hypervisor = require('./Hypervisor.js')

const TABLE = 'site'

class Site {
  constructor(site) {
    this.id = site.id
    this.name = site.name
    this.infraCluster = site.infraCluster
    this.ntpServers = typeof site.ntpServers == 'string' ? JSON.parse(site.ntpServers) : site.ntpServers
    this.dnsServers = typeof site.dnsServers == 'string' ? JSON.parse(site.dnsServers) : site.dnsServers

    this.smtp = typeof site.smtp == 'object' ? site.smtp : {
      address: site.smtpServerAddress,
      fromAddress: site.smtpServerFromAddress,
      port: site.smtpServerPort,
      securityMode: site.smtpServerSecurityMode,
      credentials: typeof site.smtpServerCredentials == 'string' ? crypto.decrypt(site.smtpServerCredentials) : site.smtpServerCredentials || {}
    }

    this.ldap = typeof site.ldap == 'object' ? site.ldap : {
      directoryName: site.ldapDirectoryName,
      directoryUrl: site.ldapDirectoryURL,
      credentials: typeof site.ldapCredentials == 'string' ? crypto.decrypt(site.ldapCredentials) : site.ldapCredentials || {}
    }

    this.prism = typeof site.prism == 'object' ? site.prism : {
      certificate: site.prismCert,
      caChain: site.prismCAChain,
      key: Buffer.isBuffer(site.prismKey) ? crypto.decrypt(site.prismKey) : site.prismKey || [],
      keyType: site.prismKeyType
    }

    this.lcmDarksiteUrl = site.lcmDarksiteUrl

    this.pcServers = site.pcServers || []
    this.vCenterServers = site.vCenterServers || []

    this.aosList = site.aosList || []
    this.hypervisorList = site.hypervisorList || []

    this.nfsServer = site.nfsServer || config.nfsServer

    /** @private */
    this._record = null
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      infraCluster: this.infraCluster,
      ntpServers: JSON.stringify(this.ntpServers),
      dnsServers: JSON.stringify(this.dnsServers),
      pcServers: JSON.stringify(this.pcServers.map(pc => pc.id)),
      vCenterServers: JSON.stringify(this.vCenterServers.map(vcsa => vcsa.id)),
      aosList: JSON.stringify(this.aosList.map(aos => aos.uuid)),
      hypervisorList: JSON.stringify(this.hypervisorList.map(hypervisor => hypervisor.uuid)),

      smtpServerAddress: this.smtp.address,
      smtpServerFromAddress: this.smtp.fromAddress,
      smtpServerPort: this.smtp.port,
      smtpServerSecurityMode: this.smtp.securityMode,
      smtpServerCredentials: crypto.encrypt(this.smtp.credentials),

      lcmDarksiteUrl: this.lcmDarksiteUrl,

      prismCert: this.prism.certificate,
      prismCAChain: this.prism.caChain,
      prismKey: crypto.encrypt(this.prism.key, false),
      prismKeyType: this.prism.keyType,

      ldapDirectoryName: this.ldap.directoryName,
      ldapDirectoryURL: this.ldap.directoryUrl,
      ldapCredentials: crypto.encrypt(this.ldap.credentials)
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      infraCluster: this.infraCluster,
      ntpServers: this.ntpServers,
      dnsServers: this.dnsServers,
      pcServers: this.pcServers.map(pc => pc.toJSON()),
      vCenterServers: this.vCenterServers.map(vcsa => vcsa.toJSON()),
      aosList: this.aosList.map(aos => aos.toJSON()),
      hypervisorList: this.hypervisorList.map(hypervisor => hypervisor.toJSON()),
      smtp: this.smtp,
      //TODO: strip creds and crypto from this
      ldap: this.ldap,
      // prism: this.prism,
      lcmDarksiteUrl: this.lcmDarksiteUrl,
    }
  }

  async update(transaction) {
    let serialized = this.serialize()
    let changes = jsondiffpatch.diff(serialized, this._record)
    let sparseCommit = {}
    for (let key in changes) {
      sparseCommit[key] = serialized[key]
    }
    if(!Object.keys(sparseCommit).length) {
      return this.id
    }
    else {
      let q = db(TABLE).where({id: this.id}).update(sparseCommit)
      if (transaction) { q.transacting(transaction)}
      return await q
    }
  }

  async create(transaction) {
    let insert = db(TABLE).insert(this.serialize())
    if (transaction) {
      insert.transacting(transaction)
    }
    let insertedID = (await insert)[0]
    this.id = insertedID
    return this
  }

  static async query(callback = async knex => knex) {
    const query = db(TABLE)

    await callback(query)

    const records = await query

    return await Promise.all(records.map(this.fromDB))
  }

  static get dbTable() {
    return TABLE
  }

  static async fromDB(record) {
    let pcServers = await PrismCentral.getByIds(JSON.parse(record.pcServers))
    let vCenterServers = await vCenter.getByIds(JSON.parse(record.vCenterServers))
    let aosList = await AOS.getByIds(JSON.parse(record.aosList))
    let hypervisorList = await Hypervisor.getByIds(JSON.parse(record.hypervisorList))
    let site = new Site({...record, pcServers, vCenterServers, aosList, hypervisorList})
    // reiview TODO: couldn't this be in the constructor as a permutation of this._record = site?
    site._record = record
    return site
  }

  static async getAll() {
    return await this.query()
  }

  static async getByID(id) {
    const builder = this.query(q => {
      q.where({id: id})
      return q
    })

    return (await builder)[0]
  }
}

module.exports = Site
