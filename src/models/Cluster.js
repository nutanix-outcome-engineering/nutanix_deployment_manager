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
        ip: record.vCenterVIP,
        hostname: record.vCenterHostname,
        gateway: record.vCenterGateway,
        subnet: record.vCenterSubnet
      },
      prismCentral: {
        ip: record.pcVIP,
        hostname: record.pcHostname,
        gateway: record.pcGateway,
        subnet: record.pcSubnet
      },
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

      vCenterVIP: this.vcenter.ip,
      vCenterHostname: this.vcenter.hostname,
      vCenterGateway: this.vcenter.gateway,
      vCenterSubnet: this.vcenter.subnet,

      pcVIP: this.prismCentral.ip,
      pcHostname: this.prismCentral.hostname,
      pcGateway: this.prismCentral.gateway,
      pcSubnet: this.prismCentral.subnet,

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

      vcenter: this.vcenter,

      prismCentral: this.prismCentral,

      nodes: this.nodes.map(node => node.toJSON()),
      site: this.site.toJSON(),

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
}

module.exports = Cluster
