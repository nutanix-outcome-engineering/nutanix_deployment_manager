const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'switch'

class Switch {
  constructor(sw) {
    this.id = sw.id
    this.type = sw.type
    this.rackID = sw.rackID
    this.ip = sw.ip
    this.name = sw.name
    this.rackUnit = sw.rackUnit

    /** @private */
    this._record = null
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      rackID: this.rackID,
      ip: this.ip,
      name: this.name,
      rackUnit: this.rackUnit
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      rackID: this.rackID,
      ip: this.ip,
      name: this.name,
      rackUnit: this.rackUnit
    }
  }

  async update() {
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
      return await q
    }
  }

  async create() {
    let insertedID = (await db(TABLE).insert(this.serialize()))[0]
    let addedSwitch = await Switch.getByID(insertedID)
    return addedSwitch
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
    let sw = new Switch(record)
    sw._record = record
    return sw
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

module.exports = Switch
