let db = require('../database')
const crypto = require('../lib/crypto-utils.js')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'ingestData'

class IngestData {
  constructor(ingestData) {
    this.id = ingestData.id
    this.ingestTaskUUID = ingestData.ingestTaskUUID
    this.serial = ingestData.serial
    this.chassisSerial = ingestData.chassisSerial

    this.ipmiIP = ingestData.ipmiIP
    this.ipmiHostname = ingestData.ipmiHostname
    this.ipmiGateway = ingestData.ipmiGateway
    this.ipmiSubnet = ingestData.ipmiSubnet

    this.credentials = typeof ingestData.credentials == 'string' ? crypto.decrypt(ingestData.credentials) : ingestData.credentials

    this.hostIP = ingestData.hostIP
    this.hostHostname = ingestData.hostHostname
    this.hostGateway = ingestData.hostGateway
    this.hostSubnet = ingestData.hostSubnet

    this.cvmIP = ingestData.cvmIP
    this.cvmHostname = ingestData.cvmHostname
    this.cvmGateway = ingestData.cvmGateway
    this.cvmSubnet = ingestData.cvmSubnet
    this.clusterVIP = ingestData.clusterVIP
    this.clusterHostname = ingestData.clusterHostname

    this.ingestState = ingestData.ingestState
    this.failureReason = ingestData.failureReason

    if (typeof ingestData.rawCSVAsJSON == 'string') {
      this.rawCSVAsJSON = JSON.parse(ingestData.rawCSVAsJSON)
    } else {
      this.rawCSVAsJSON = ingestData.rawCSVAsJSON
    }

    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static fromCSVRecord(ingestData) {
    let record = ingestData.record
    record.rawCSVAsJSON = record
    record.ingestState = 'pending'
    record.failureReason = null

    return new IngestData(record)
  }

  static fromDB(record) {
    let ingestData = new IngestData(record)
    ingestData._record = record

    return ingestData
  }

  static async massInsert(data, chunkSize=100) {
     let serialized = data.map(record => {
      return record.serialize()
    })
    return await db.batchInsert(TABLE, serialized, chunkSize)
  }

  static async getAllWithStage(stage) {
    const builder = this.query(q => {
      q.where('ingestState', '=', stage)
      return q
    })

    return await builder
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

  static async getByIngestTaskUUID(id) {
    const builder = this.query(q => {
      q.where({ingestTaskUUID: id})
      return q
    })

    return (await builder)[0]
  }

  static async retryDiscovery(ids) {
    return await db(TABLE)
      .whereIn('id', ids)
      .update({
        ingestTaskUUID: null,
        ingestState: 'pending',
        failureReason: null
      })
  }

  serialize() {
    return {
      id: this.id,
      ingestTaskUUID: this.ingestTaskUUID,
      serial: this.serial,
      chassisSerial: this.chassisSerial,

      ipmiIP: this.ipmiIP,
      ipmiHostname: this.ipmiHostname,
      ipmiGateway: this.ipmiGateway,
      ipmiSubnet: this.ipmiSubnet,

      credentials: crypto.encrypt(this.credentials),

      hostIP: this.hostIP,
      hostHostname: this.hostHostname,
      hostGateway: this.hostGateway,
      hostSubnet: this.hostSubnet,

      cvmIP: this.cvmIP,
      cvmHostname: this.cvmHostname,
      cvmGateway: this.cvmGateway,
      cvmSubnet: this.cvmSubnet,
      clusterVIP: this.clusterVIP,
      clusterHostname: this.clusterHostname,

      ingestState: this.ingestState,
      failureReason: this.failureReason,

      rawCSVAsJSON: JSON.stringify(this.rawCSVAsJSON)
    }
  }

  toJSON() {
    return {
      id: this.id,
      ingestTaskUUID: this.ingestTaskUUID,
      serial: this.serial,
      chassisSerial: this.chassisSerial,

      ipmi: {
        ip: this.ipmiIP,
        hostname: this.ipmiHostname,
        gateway: this.ipmiGateway,
        subnet: this.ipmiSubnet
      },

      host: {
        ip: this.hostIP,
        hostname: this.hostHostname,
        gateway: this.hostGateway,
        subnet: this.hostSubnet
      },

      cvm: {
        ip: this.cvmIP,
        hostname: this.cvmHostname,
        gateway: this.cvmGateway,
        subnet: this.cvmSubnet
      },

      ingestState: this.ingestState,
      failureReason: this.failureReason,
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
    if (Object.keys(sparseCommit).length === 0) {
      return 0
    }
    let q = db(TABLE).where({id: this.id}).update(sparseCommit)
    return await q
  }

  async create() {
    return await db(TABLE).insert(this.serialize())
  }

  async delete() {
    return await db(TABLE).where({id: this.id}).delete()
  }
}

module.exports = IngestData
