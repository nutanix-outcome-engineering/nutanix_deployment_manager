const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'node'

class Node {
  constructor(node) {
    this.serial = node.serial
    this.chassisSerial = node.chassisSerial

    if (node.ipmi) {
      this.ipmiIP = node.ipmi.ip
      this.ipmiHostname = node.ipmi.hostname
      this.ipmiGateway = node.ipmi.gateway
      this.ipmiSubnet = node.ipmi.subnet
    } else {
      this.ipmiIP = node.ipmiIP
      this.ipmiHostname = node.ipmiHostname
      this.ipmiGateway = node.ipmiGateway
      this.ipmiSubnet = node.ipmiSubnet
    }

    if (node.host) {
      this.hostIP = node.host.ip
      this.hostHostname = node.host.hostname
      this.hostGateway = node.host.gateway
      this.hostSubnet = node.host.subnet
    } else {
      this.hostIP = node.hostIP
      this.hostHostname = node.hostHostname
      this.hostGateway = node.hostGateway
      this.hostSubnet = node.hostSubnet

    }

    if (node.cvm) {
      this.cvmIP = node.cvm.ip
      this.cvmHostname = node.cvm.hostname
      this.cvmGateway = node.cvm.gateway
      this.cvmSubnet = node.cvm.subnet
    } else {
      this.cvmIP = node.cvmIP
      this.cvmHostname = node.cvmHostname
      this.cvmGateway = node.cvmGateway
      this.cvmSubnet = node.cvmSubnet
    }

    this.clusterID = node.clusterID

    this.rackID = node.rackID
    this.rackUnit = node.rackUnit


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

  static async getBySerial(serial) {
    const builder = this.query(q => {
      q.where({serial: serial})
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
      ipmiGateway: this.ipmiGateway,
      ipmiSubnet: this.ipmiSubnet,

      hostIP: this.hostIP,
      hostHostname: this.hostHostname,
      hostGateway: this.hostGateway,
      hostSubnet: this.hostSubnet,

      cvmIP: this.cvmIP,
      cvmHostname: this.cvmHostname,
      cvmGateway: this.cvmGateway,
      cvmSubnet: this.cvmSubnet,
      clusterID: this.clusterID
    }
  }

  toJSON() {
    return {
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
