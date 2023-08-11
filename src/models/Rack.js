const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'rack'

class Rack {
  constructor(rack) {
    this.id = rack.id
    this.siteID = rack.siteID
    this.name = rack.name
    this.row = rack.row
    this.column = rack.column
    this.datahall = rack.datahall

    /** @private */
    this._record = null
  }

  serialize() {
    return {
      id: this.id,
      siteID: this.siteID,
      name: this.name,
      row: this.row,
      column: this.column,
      datahall: this.datahall
    }
  }

  toJSON() {
    return {
      id: this.id,
      siteID: this.siteID,
      name: this.name,
      row: this.row,
      column: this.column,
      datahall: this.datahall
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
    let addedRack = await Rack.getByID(insertedID)
    return addedRack
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
    let rack = new Rack(record)
    rack._record = record
    return rack
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

module.exports = Rack
