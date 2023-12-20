const AOS = require('../AOS.js')
const TaskFlowFactory = require('./TaskFlowFactory.js')
const { stat } = require('fs/promises')
const { resolve } = require('path')
const ms = require('ms')
const { DelayedError } = require('bullmq')


class UploadAOSTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
    const path = resolve(job.data.filepath)
    const stats = await stat(path)
    const percentage = (stats.size / job.data.size * 100).toFixed(2)
    await job.updateProgress(percentage)

    if(percentage < 100) {
      if (job.data.status) {
        if (job.data.status.lastPercentage === percentage) {
          job.data.status.numTimesSame += 1
          if (job.data.status.numTimesSame >= 3) {
            throw new Error('Upload stalled. Retry upload to resume.')
          }
        } else {
          job.data.status.lastPercentage = percentage
          job.data.status.numTimesSame = 0
        }
      } else {
        job.data.status = {
          lastPercentage: percentage,
          numTimesSame: 0
        }
      }
      await job.update(job.data)
      await job.moveToDelayed(Date.now() + ms('20s'), token)
      // This error needs to be thrown otherwise the worker errors with a weird message
      throw new DelayedError('Waiting for upload to complete')
    }

    const taskFlow = await TaskFlowFactory.getByID(job.data.taskFlowId)
    taskFlow.complete({name: job.data.taskType}, job.data)
    await taskFlow.update()

    return job.data
  }
}

class PostUploadAOSTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token) {
    const uploadResults = Object.values(await job.getChildrenValues())[0]
    const aos = await AOS.getById(uploadResults.aosUUID)
    await aos.extractAndMove(uploadResults.filepath, uploadResults.exportBasePath)
    aos.transferStatus = 'uploaded'
    aos.filename = `${aos.uuid}.tar`
    await aos.update()

    const taskFlow = await TaskFlowFactory.getByID(job.data.taskFlowId)
    taskFlow.complete({name: job.data.taskType}, aos.toJSON())
    await taskFlow.update()

    return aos
  }
}

module.exports = {
  UploadAOSTask,
  PostUploadAOSTask
}
