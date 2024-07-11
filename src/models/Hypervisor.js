const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')
const { execSync } = require('child_process')

const TABLE = 'hypervisor'

class Hypervisor {
  constructor(hypervisor) {

    this.uuid = hypervisor.uuid
    this.name = hypervisor.name

    this.version = hypervisor.version,
    this.type = hypervisor.type,

    this.filename = hypervisor.filename
    this.status = hypervisor.status
    this.transferStatus = hypervisor.transferStatus || 'notStarted'

    this.createdDate = hypervisor.createdDate || null
    this.lastModified = hypervisor.lastModified || this.createdDate
    this.site = hypervisor.site

    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static fromDB(record) {
    let hypervisor = new Hypervisor({
      uuid: record.uuid,
      name: record.name,
      version: record.version,
      type: record.type,
      filename: record.filename,
      status: record.status,
      transferStatus: record.transferStatus,
      createdDate: record.createdDate,
      lastModified: record.lastModified,
      site: record.site
    })
    hypervisor._record = record

    return hypervisor
  }

  static async getAll(includeForeign=false) {
    const hypervisorList = await this.query()

    return hypervisorList
  }

  static async getById(id, includeForeign=false) {
    const builder = this.query(q => {
      q.where({uuid: id})
      return q
    })
    const hypervisor = (await builder)[0]

    return hypervisor
  }
  static async getByIds(ids, transaction) {
    const builder = this.query(q => {
      q.whereIn('uuid', ids)
      if (transaction) { q.transacting(transaction) }
      return q
    })
    let hypervisorList = await builder

    return hypervisorList || []
  }

  serialize() {
    return {
      uuid: this.uuid,
      name: this.name,
      version: this.version,
      type: this.type,
      filename: this.filename,
      status: this.status,
      transferStatus: this.transferStatus,
      site: this.site,

      createdDate: this.createdDate,
      lastModified: this.lastModified
    }
  }

  toJSON() {
    return {
      uuid: this.uuid,

      name: this.name,
      version: this.version,
      type: this.type,
      filename: this.filename,
      status: this.status,
      transferStatus: this.transferStatus,

      createdDate: this.createdDate,
      lastModified: this.lastModified
    }
  }

  static async query(callback = async knex => knex) {
    const query = db(TABLE)

    await callback(query)

    const records = await query

    return records.map(this.fromDB)
  }

  async update() {
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
    let q = db(TABLE).where({uuid: this.uuid}).update(sparseCommit)
    return await q
  }

  async create(transaction) {
    this.createdDate = new Date()
    this.lastModified = this.createdDate
    let serialized = this.serialize()
    let insert = db(TABLE).insert(serialized)
    if (transaction) {
      insert.transacting(transaction)
    }
    await insert

    return this
  }

  async moveToFinalDestination(fileDownloaded, destinationBase) {
    let finalDestination = `${destinationBase}/${this.site}/hypervisor/${this.uuid}.iso`
    try {
      execSync('cp', [`${fileDownloaded}`, `${finalDestination}`])
      execSync('rm', [`${fileDownloaded}`, `${fileDownloaded}.json`])
    } catch (err) {
      throw err
    }
  }
}

module.exports = Hypervisor
