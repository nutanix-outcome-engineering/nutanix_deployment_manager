const ms = require('ms')
const { DelayedError } = require('bullmq')
const _ = require('lodash')
const Foundation = require('../Foundation')
const Cluster = require('../Cluster')
const db = require('../../database')
const log = require('../../lib/logger.js')
const config = require('../../lib/config')

class ClusterBuildTask {
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
        jobData.fvm_session_id = (await fvm.imageNodes(cluster, undefined, {imageNodes: false, formCluster: true})).session_id
        fvm.status = 'imaging'
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
        fvm.status = 'idle'
        await fvm.update()
        throw new DelayedError('Waiting for cluster build to complete.')
      } else {
        fvm.status = 'idle'
        await fvm.update()
        return progress
      }
    }
  }
}

class ImageNodesTask {
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
        fvm = await Foundation.findAvailable(transaction)
        if (!fvm) {
          await job.moveToDelayed(Date.now() + ms('1m'), token)
          throw new DelayedError('Waiting for Foundation VM.')
        }
        jobData.fvm_session_id = (await fvm.imageNodes(cluster, undefined, {imageNodes: true, formCluster: false})).session_id
        fvm.status = 'imaging'
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
      await job.progress(progress.aggregate_percent_complete)
      if (progress.imaging_stopped && progress.aggregate_percent_complete != 100) {
        throw new Error(`Failed to build cluster`)
      } else {
        await job.moveToDelayed(Date.now() + ms('1m'), token)
        throw new DelayedError('Waiting for cluster build to complete.')
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


module.exports = {
  ClusterBuildTask,
  ImageNodesTask
}
