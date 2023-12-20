const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')
const { execSync } = require('child_process')

const TABLE = 'aos'

class AOS {
  constructor(aos) {

    this.uuid = aos.uuid
    this.name = aos.name

    this.version = aos.version,

    this.filename = aos.filename
    this.status = aos.status
    this.transferStatus = aos.transferStatus || 'notStarted'

    this.createdDate = aos.createdDate || null
    this.lastModified = aos.lastModified || this.createdDate
    this.site = aos.site

    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static fromDB(record) {
    let aos = new AOS({
      uuid: record.uuid,
      name: record.name,
      version: record.version,
      filename: record.filename,
      status: record.status,
      transferStatus: record.transferStatus,
      createdDate: record.createdDate,
      lastModified: record.lastModified,
      site: record.site
    })
    aos._record = record

    return aos
  }

  static async getAll(includeForeign=false) {
    const aosList = await this.query()

    return aosList
  }

  static async getById(id, includeForeign=false) {
    const builder = this.query(q => {
      q.where({uuid: id})
      return q
    })
    const aos = (await builder)[0]

    return aos
  }
  static async getByIds(ids, transaction) {
    const builder = this.query(q => {
      q.whereIn('uuid', ids)
      if (transaction) { q.transacting(transaction) }
      return q
    })
    let aosList = await builder

    return aosList || []
  }

  serialize() {
    return {
      uuid: this.uuid,
      name: this.name,
      version: this.version,
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

  async extractAndMove(fileDownloaded, destinationBase) {
    let unzipFilename = `${destinationBase}/${this.site}/aos/${this.uuid}.tar`
    let bundlePattern = 'nutanix_installer_package-release-.*\\.tar\\.gz'
    let xtractPattern = 'nutanix_installer_package-release-*\\.tar\\.gz'
    let commands = [
      `if $(tar -tf ${fileDownloaded} | grep -q ${bundlePattern})`,
      `then tar -xf ${fileDownloaded} --wildcards --no-anchored '${xtractPattern}' --transform='s/.*\\///' -O | gunzip > ${unzipFilename}`,
      `else gunzip < ${fileDownloaded} > ${unzipFilename}`,
      `fi && rm ${fileDownloaded} ${fileDownloaded}.json`
    ]
    execSync(commands.join(';'))
  }
}

module.exports = AOS
