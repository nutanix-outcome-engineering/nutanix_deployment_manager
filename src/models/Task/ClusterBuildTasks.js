const ms = require('ms')
const { DelayedError } = require('bullmq')
const _ = require('lodash')
const Foundation = require('../Foundation')
const Cluster = require('../Cluster')
const db = require('../../database')
const log = require('../../lib/logger.js')
const config = require('../../lib/config')
const { exec } = require('../../lib/ssh.js')

class ClusterBuildTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
    const jobData = job.data

    if (!jobData.fvm) {
      const imageResults = Object.values(await job.getChildrenValues())[0]
      const transaction = await db.transaction()
      let fvm, cluster
      try {
        /***
         * If imageResults is not undefined/null that means we have imaged nodes in the previous step and are reusing the
         * FVM. Else it is implied that the nodes are already imaged and we need to request an unused FVM.
         */
        if (imageResults){
          fvm = await Foundation.getById(imageResults.fvm)
          cluster = await Cluster.getById(imageResults.cluster.id, true)
          jobData.cluster = {id: imageResults.cluster.id}
        } else {
          cluster = await Cluster.getById(jobData.cluster.id, true)
          fvm = await Foundation.findAvailable(cluster.site.id, transaction)
        }
        if (!fvm) {
          await job.log('Waiting for Foundation VM')
          log.warning(`Waiting on Foundation VM for cluster ${cluster.name} with id ${cluster.id}`)
          await job.moveToDelayed(Date.now() + ms('1m'), token)
          throw new DelayedError('Waiting for Foundation VM.')
        }
        jobData.fvm_session_id = (await fvm.imageNodes(cluster, undefined, {imageNodes: false, formCluster: true})).session_id
        fvm.status = 'createCluster'
        await fvm.update(transaction)
        await transaction.commit()
      } catch (err) {
        await transaction.rollback()
        throw err
      }
      jobData.fvm = fvm.uuid
      await job.updateData(jobData)
      await job.moveToDelayed(Date.now() + ms('1m'), token)
      throw new DelayedError('Waiting for cluster build to complete.')
    } else {
      const fvm = await Foundation.getById(jobData.fvm)
      const progress = await fvm.progress()
      await job.updateProgress(progress.aggregate_percent_complete)
      if (progress.imaging_stopped && progress.aggregate_percent_complete != 100) {
        throw new Error(`Failed to build cluster`)
      } else if (!progress.imaging_stopped && progress.aggregate_percent_complete != 100){
        await job.moveToDelayed(Date.now() + ms('1m'), token)
        await fvm.update()
        throw new DelayedError('Waiting for cluster build to complete.')
      } else {
        fvm.status = 'idle'
        const cluster = await Cluster.getById(jobData.cluster.id)
        await fvm.update()
        return cluster
      }
    }
  }
}

class ImageNodesTask {
  /***
   * Expects a cluster ID to work. Possible improvement would be to make it work
   * with arbitrary number of nodes.
   */
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
    const jobData = job.data

    if (!jobData.fvm) {
      const transaction = await db.transaction()
      let fvm
      try {
        const cluster = await Cluster.getById(jobData.cluster.id, true)
        fvm = await Foundation.findAvailable(cluster.site.id, transaction)
        if (!fvm) {
          await job.log('Waiting for Foundation VM')
          log.warning(`Waiting on Foundation VM for cluster ${cluster.name} with id ${cluster.id}`)
          await job.moveToDelayed(Date.now() + ms('1m'), token)
          throw new DelayedError('Waiting for Foundation VM.')
        }
        jobData.fvm_session_id = (await fvm.imageNodes(cluster, undefined, {imageNodes: true, formCluster: false})).session_id
        fvm.status = 'imagingNodes'
        await fvm.update(transaction)
        await transaction.commit()
      } catch (err) {
        await transaction.rollback()
        throw err
      }
      jobData.fvm = fvm.uuid
      await job.updateData(jobData)
      await job.moveToDelayed(Date.now() + ms('1m'), token)
      throw new DelayedError('Waiting for cluster build to complete.')
    } else {
      const fvm = await Foundation.getById(jobData.fvm)
      const progress = await fvm.progress()
      await job.updateProgress(progress.aggregate_percent_complete)
      if (progress.imaging_stopped && progress.aggregate_percent_complete != 100) {
        throw new Error(`Failed to build cluster`)
      } else if (!progress.imaging_stopped && progress.aggregate_percent_complete != 100){
        await job.moveToDelayed(Date.now() + ms('1m'), token)
        await fvm.update()
        throw new DelayedError('Waiting for node imaging to complete.')
      } else {
        if(!job.parent) {
          fvm.status = 'idle'
          await fvm.update()
        }
        const cluster = await Cluster.getById(jobData.cluster.id)
        return {cluster, fvm: jobData.fvm}
      }
    }
  }
}


class RegisterToPCTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
  }
}

class ChangeDefaultPasswordsTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
    const jobData = job.data
    if (!jobData.cluster) {
      const imageResults = Object.values(await job.getChildrenValues())[0]
      jobData.cluster = { id: imageResults.id }
      await job.updateData(jobData)
    }
    const cluster = await Cluster.getById(jobData.cluster.id, true)
    const escapedPassword = cluster.site.ldap.credentials.password.replace(/[[{}()*+?^$|!@#&-<>\,\]\.\\\=\`\~\;\:]/g, "\\$&")
    const commands = [
      `/home/nutanix/prism/cli/ncli user reset-password user-name='admin' password='${escapedPassword}'`,
      `for z in \`svmips\`; do ssh nutanix@$z 'cpass="${escapedPassword}" ; echo $cpass | sudo passwd nutanix --stdin';done`,
      `echo '' > /home/nutanix/.bash_history && history -c`
    ]
    await exec({host: cluster.cluster.ip, username: 'nutanix', password: 'nutanix/4u'}, commands.join('\n'))
    return {cluster: {id: jobData.cluster.id}}
  }
}


module.exports = {
  ClusterBuildTask,
  ImageNodesTask,
  ChangeDefaultPasswordsTask,
  RegisterToPCTask
}
