let db = require('../database')
const crypto = require('../lib/crypto-utils.js')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'vCenter'

class vCenter {
  constructor(vcsa) {
    this.id = vcsa.id
    this.displayName = vcsa.displayName
    this.hostnameOrIP = vcsa.hostnameOrIP

    this.credentials = typeof vcsa.credentials == 'string' ? crypto.decrypt(vcsa.credentials) : vcsa.credentials
    this.default = Boolean(vcsa.default) || Boolean(vcsa.siteDefault)

    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static fromDB(record) {
    let vcsa = new vCenter(record)
    vcsa._record = record

    return vcsa
  }

  static async query(callback = async knex => knex) {
    const query = db(TABLE)

    await callback(query)

    const records = await query

    return records.map(this.fromDB)
  }

  static async getByIds(ids, transaction) {
    const builder = this.query(q => {
      q.whereIn('id', ids)
      if (transaction) { q.transacting(transaction) }
      return q
    })

    let vCenterServers = await builder

    return vCenterServers || []
  }

  serialize() {
    return {
      id: this.id,
      displayName: this.displayName,
      hostnameOrIP: this.hostnameOrIP,
      credentials: crypto.encrypt(this.credentials),
      siteDefault: this.default,

      createDate: this.createDate,
      lastModified: this.lastModified
    }
  }

  toJSON() {
    return {
      id: this.id,
      displayName: this.displayName,
      hostnameOrIP: this.hostnameOrIP,
      default: this.default,

      // Leave structure there but they are write only in the API
      credentials: {
        username: '',
        password: ''
      },

      createDate: this.createDate,
      lastModified: this.lastModified
    }
  }

  async update(transaction) {
    let serialized = this.serialize()
    let changes = jsondiffpatch.diff(serialized, this._record)
    let sparseCommit = {}
    for (let key in changes) {
      sparseCommit[key] = serialized[key]
      sparseCommit.lastModified = new Date()
    }
    if (Object.keys(sparseCommit).length === 0) {
      return 0
    }
    let q = db(TABLE).where({id: this.id}).update(sparseCommit)
    if (transaction) { q.transacting(transaction)}
    return await q
  }

  async create(transaction) {
    this.createDate = new Date()
    this.lastModified = this.createDate
    let serialized = this.serialize()
    let insert = db(TABLE).insert(serialized)
    if (transaction) {
      insert.transacting(transaction)
    }
    this.id = (await insert)[0]

    return this
  }

  async delete(transaction) {
    let deleteQuery = db(TABLE).where({id: this.id}).delete()
    if (transaction) {
      insert.transacting(transaction)
    }
    return await deleteQuery
  }

}

module.exports = vCenter
