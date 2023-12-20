const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')
const PrismCentral = require('./PrismCentral.js')
const vCenter = require('./vCenter.js')
const AOS = require('./AOS.js')

const TABLE = 'site'

class Site {
  constructor(site) {
    this.id = site.id
    this.name = site.name
    this.infraCluster = site.infraCluster
    this.ntpServers = typeof site.ntpServers == 'string' ? JSON.parse(site.ntpServers) : site.ntpServers
    this.dnsServers = typeof site.dnsServers == 'string' ? JSON.parse(site.dnsServers) : site.dnsServers

    this.pcServers = site.pcServers || []
    this.vCenterServers = site.vCenterServers || []

    this.aosList = site.aosList || []

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
      aosList: JSON.stringify(this.aosList.map(aos => aos.uuid))
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
      aosList: this.aosList.map(aos => aos.toJSON())
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
    let site = new Site({...record, pcServers, vCenterServers, aosList})
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
