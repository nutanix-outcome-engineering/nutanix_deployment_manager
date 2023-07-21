const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'site'

class Site {
  constructor(site) {
    this.id = site.id
    this.name = site.name
    this.infraCluster = site.infraCluster
    this.ntpServers = typeof site.ntpServers == 'string' ? JSON.parse(site.ntpServers) : site.ntpServers
    this.dnsServers = typeof site.dnsServers == 'string' ? JSON.parse(site.dnsServers) : site.dnsServers

    /** @private */
    this._record = null
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      infraCluster: this.infraCluster,
      ntpServers: JSON.stringify(this.ntpServers),
      dnsServers: JSON.stringify(this.dnsServers)
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      infraCluster: this.infraCluster,
      ntpServers: this.ntpServers,
      dnsServers: this.dnsServers
    }
  }

  async update() {
    let serialized = this.serialize()
    let changes = jsondiffpatch.diff(serialized, this._record)
    let sparseCommit = {}
    for (let key in changes) {
      sparseCommit[key] = serialized[key]
    }
    let q = db(TABLE).where({id: this.id}).update(sparseCommit)
    return await q
  }

  async create() {
    let insertedID =  (await db(TABLE).insert(this.serialize()))[0]
    let addedSite =  await Site.getByID(insertedID)
    return addedSite
  }

  static async query(callback = async knex => knex) {
    const query = db(TABLE)

    await callback(query)

    const records = await query

    return records.map(this.fromDB)
  }

  static get dbTable() {
    return TABLE
  }

  static fromDB(record) {
    let site = new Site(record)
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
