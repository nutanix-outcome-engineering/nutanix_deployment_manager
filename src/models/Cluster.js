const db = require('../database')
const jsondiffpatch = require('jsondiffpatch')
const Node = require('./Node.js')
const Site = require('./Site.js')

const TABLE = 'cluster'

class Cluster {
  constructor(cluster) {

    this.id = cluster.id
    this.name = cluster.name

    this.cluster = cluster.cluster,

    this.vcenter = cluster.vcenter,

    this.prismCentral = cluster.prismCentral

    this.hypervisor = cluster.hypervisor
    this.aos = cluster.aos

    this.nodes = cluster.nodes || []
    this.site = cluster.site || {}


    /** @private */
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }


  static fromDB(record) {
    let cluster = new Cluster({
      id: record.id,
      name: record.name,
      cluster: {
        ip: record.clusterVIP,
        hostname: record.clusterHostname,
        gateway: record.clusterGateway,
        subnet: record.clusterSubnet
      },
      vcenter: {
        id: record.vCenterID,
        ip: record.vCenterVIP,
        hostname: record.vCenterHostname,
        gateway: record.vCenterGateway,
        subnet: record.vCenterSubnet
      },
      prismCentral: {
        id: record.pcID,
        ip: record.pcVIP,
        hostname: record.pcHostname,
        gateway: record.pcGateway,
        subnet: record.pcSubnet
      },
      hypervisor: record.hypervisor,
      aos: record.aos
    })
    cluster._record = record

    return cluster
  }

  static async getAll(includeForeign=false) {
    const clusters = await this.query()

    if (includeForeign) {
      await Promise.all(clusters.map(cluster => cluster.getRelated()))
    }

    return clusters
  }

  static async getById(id, includeForeign=false) {
    const builder = this.query(q => {
      q.where({id: id})
      return q
    })
    const cluster = (await builder)[0]

    if (includeForeign) {
      await cluster.getRelated()
    }

    return cluster
  }

  async getNodes() {
    let nodes = await Node.getByClusterID(this.id)
    this.nodes = nodes

    return this.nodes
  }

  async getSite() {
    let site = await Site.getByID(this._record.siteID)
    this.site = site
    if (this.prismCentral.id) {
      this.prismCentral = site.pcServers.find(pc => pc.id == this.prismCentral.id)
    }
    if (this.vcenter.id) {
      this.vcenter = site.vCenterServers.find(vcsa => vcsa.id == this.vcenter.id)
    }
    if (this.hypervisor && typeof this.hypervisor == 'string') {
      this.hypervisor = site.hypervisorList.find(hypervisor => hypervisor.uuid == this.hypervisor)
    }
    if (this.aos && typeof this.aos == 'string') {
      this.aos = site.aosList.find(aos => aos.uuid == this.aos)
    }

    return this.site
  }

  async getRelated() {
    await Promise.all([this.getSite(), this.getNodes()])
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,

      clusterVIP: this.cluster.ip,
      clusterHostname: this.cluster.hostname,
      clusterGateway: this.cluster.gateway,
      clusterSubnet: this.cluster.subnet,

      vCenterID: this.vcenter.id,
      vCenterVIP: this.vcenter.ip,
      vCenterHostname: this.vcenter.hostname,
      vCenterGateway: this.vcenter.gateway,
      vCenterSubnet: this.vcenter.subnet,

      pcID: this.prismCentral.id,
      pcVIP: this.prismCentral.ip,
      pcHostname: this.prismCentral.hostname,
      pcGateway: this.prismCentral.gateway,
      pcSubnet: this.prismCentral.subnet,

      hypervisor: this.hypervisor?.uuid || this._record.hypervisor,
      aos: this.aos?.uuid || this._record.aos,

      ingestDate: this.ingestDate,
      lastModified: this.lastModified,
      siteID: this.site?.id || this._record.siteID
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,

      cluster: this.cluster,

      // It is either a vCenter defined on site or the one defined on the cluster
      vcenter: this.vcenter.toJSON?.() || this.vcenter,

      // It is either a PC defined on site or the one defined on the cluster
      prismCentral: this.prismCentral.toJSON?.() || this.prismCentral,

      nodes: this.nodes.map(node => node.toJSON()),
      site: this.site.toJSON(),

      hypervisor: this.hypervisor.toJSON?.() || this.hypervisor,
      aos: this.aos.toJSON?.() || this.aos,

      ingestDate: this._record.ingestDate,
      lastModified: this._record.lastModified
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
    let q = db(TABLE).where({serial: this.serial}).update(sparseCommit)
    return await q
  }

  async create(transaction) {
    this.ingestDate = new Date()
    this.lastModified = this.ingestDate
    let serialized = this.serialize()
    let insert = db(TABLE).insert(serialized)
    if (transaction) {
      insert.transacting(transaction)
    }
    this.id = (await insert)[0]

    return this
  }

  async delete() {
    return await db(TABLE).where({id: this.id}).delete()
  }
}

module.exports = Cluster
