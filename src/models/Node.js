const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'node'

class Node {
  constructor(node) {
    this.serial = node.serial
    this.chassisSerial = node.chassisSerial

    this.ipmiIP = node.ipmiIP
    this.ipmiHostname = node.ipmiHostname

    this.hostIP = node.hostIP
    this.hostHostname = node.hostHostname

    this.cvmIP = node.cvmIP
    this.cvmHostname = node.cvmHostname
    this.clusterID = node.clusterID


    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }


  static fromDB(record) {
    let node = new Node(record)
    node._record = record

    return node
  }

  static async massInsert(data, chunkSize=100) {
    let serialized = data.map(record => {
     return record.serialize()
   })
   return await db.batchInsert(TABLE, serialized, chunkSize)
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

  serialize() {
    return {
      serial: this.serial,
      chassisSerial: this.chassisSerial,

      ipmiIP: this.ipmiIP,
      ipmiHostname: this.ipmiHostname,

      hostIP: this.hostIP,
      hostHostname: this.hostHostname,

      cvmIP: this.cvmIP,
      cvmHostname: this.cvmHostname,
      clusterID: this.clusterID,
    }
  }

  toJSON() {
    return {
      serial: this.serial,
      chassisSerial: this.chassisSerial,

      ipmiIP: this.ipmiIP,
      ipmiHostname: this.ipmiHostname,

      hostIP: this.hostIP,
      hostHostname: this.hostHostname,

      cvmIP: this.cvmIP,
      cvmHostname: this.cvmHostname,
      clusterID: this.clusterID,
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
    }
    let q = db(TABLE).where({serial: this.serial}).update(sparseCommit)
    return await q
  }

  async create() {
    return await db(TABLE).insert({
      serial: this.serial,
      rawCSVAsJSON: JSON.stringify(this.rawCSVAsJSON)
    })
  }
}

module.exports = Node
