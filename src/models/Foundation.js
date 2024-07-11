const db = require('../database')
const config = require('../lib/config')
const { exec } = require('../lib/ssh.js')
const uuid = require('uuid').v4
const { readFile } = require('fs/promises')
const fvmClient = require('nutanix_foundation')
const jsondiffpatch = require('jsondiffpatch')

const TABLE = 'foundation'

class Foundation {
  constructor(foundation) {

    this.uuid = foundation.uuid || uuid()
    this.ip = foundation.ip

    this.version = foundation.version
    this.status = foundation.status

    this.createDate = foundation.createDate || null
    this.lastModified = foundation.lastModified || this.createDate
    this.siteId = foundation.siteId

    /** @private */
    this.api = new fvmClient(this.ip)
    this._record = null
  }

  static get dbTable() {
    return TABLE
  }

  static fromDB(record) {
    let foundation = new Foundation({
      uuid: record.uuid,
      ip: record.ip,
      version: record.version,
      status: record.status,
      createDate: record.createDate,
      lastModified: record.lastModified,
      siteId: record.siteId
    })
    foundation._record = record

    return foundation
  }

  static async getAll(siteId) {
    let qualifier = async knex => knex
    if (siteId) {
      qualifier = async knex => knex.where({siteId})
    }
    const foundationList = await this.query(qualifier)

    return foundationList
  }

  static async getById(id, includeForeign=false) {
    const builder = this.query(q => {
      q.where({uuid: id})
      return q
    })
    const foundation = (await builder)[0]

    return foundation
  }

  static async getByIds(ids, transaction) {
    const builder = this.query(q => {
      q.whereIn('uuid', ids)
      if (transaction) { q.transacting(transaction) }
      return q
    })
    let foundationList = await builder

    return foundationList || []
  }

  static async query(callback = async knex => knex) {
    const query = db(TABLE)

    await callback(query)

    const records = await query

    return records.map(this.fromDB)
  }

  static async findAvailable(siteId, transaction) {
    if (!transaction) {
      throw new Error('This function requires a transaction to properly lock.')
    }

    const builder = this.query(q => {
      q.where({status: 'idle', siteId})
        .forUpdate()
        .skipLocked()
        .limit(1)
        .transacting(transaction)
      return q
    })

    const fvm = (await builder)[0]

    return fvm
  }

  serialize() {
    return {
      uuid: this.uuid,
      ip: this.ip,
      version: this.version,
      status: this.status,
      siteId: this.siteId,

      createDate: this.createDate,
      lastModified: this.lastModified
    }
  }

  toJSON() {
    return {
      uuid: this.uuid,

      ip: this.ip,
      version: this.version,
      status: this.status || 'Unknown',

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
    let q = db(TABLE).where({uuid: this.uuid}).update(sparseCommit)
    if (transaction) {
      q.transacting(transaction)
    }
    return await q
  }

  async create(transaction) {
    this.createDate = new Date()
    this.version = await this.api.version
    this.lastModified = this.createDate
    let serialized = this.serialize()
    let insert = db(TABLE).insert(serialized)
    if (transaction) {
      insert.transacting(transaction)
    }
    await insert

    return this
  }

  async delete() {
    return await db(TABLE).where({uuid: this.uuid}).delete()
  }

  async setup(credentials, nfsHost) {
    try {
      const sshInfo = {host: this.ip, ...credentials}
      const sshPublicKey = await readFile(`${config.ssh.public}`, {encoding: 'utf-8'})
      const siteBaseDir = `${config.filestore.baseDirectory}/${config.filestore.exportDirectory}/${this.siteId}`
      const commands = [
        `sudo umount --all --types nfs4,nfs`,
        `echo "${sshPublicKey.replace('\n', '')}" >> ~/.ssh/authorized_keys && chmod 640 ~/.ssh/authorized_keys`,
        `rm -rf /home/nutanix/foundation/isos/* /home/nutanix/foundation/nos/*;`,
        `sudo su -c 'grep -q "${nfsHost}:${siteBaseDir}/aos" /etc/fstab || echo ${nfsHost}:${siteBaseDir}/aos /home/nutanix/foundation/nos nfs defaults 0 0 >> /etc/fstab'`,
        `sudo su -c 'grep -q "${nfsHost}:${siteBaseDir}/hypervisor" /etc/fstab || echo ${nfsHost}:${siteBaseDir}/hypervisor /home/nutanix/foundation/isos nfs defaults 0 0 >> /etc/fstab'`,
        `sudo mount --all --types nfs --options remount`
      ]
      await exec(sshInfo, commands.join('\n'))
    } catch (err) {
      throw err
    }
  }

  async imageNodes(cluster, advanced, operations) {
    const clusterInfo = {
      ...cluster.cluster,
      name: cluster.name,
      nameserver: cluster.site.dnsServers,
      ntpServer: cluster.site.ntpServers
    }

    // Used to for debug reasons
    const payload = this.api.generateImageNodePayload(clusterInfo, cluster.nodes, cluster.hypervisor, cluster.aos.filename, advanced, operations)
    return this.api.imageNodes(clusterInfo, cluster.nodes, cluster.hypervisor, cluster.aos.filename, advanced, operations)
  }

  async progress(session_id) {
    return await this.api.progress(session_id)
  }
}

module.exports = Foundation
