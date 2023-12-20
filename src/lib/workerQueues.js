const { Queue, Worker, FlowProducer } = require('bullmq')
const task = require('../models/Task')
const config = require('./config')
const log = require('./logger')

const generalQueueOptions = {
  prefix: 'generalTaskQueue',
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
    password: config.redis.pass
  }
}

const generalQueue = new Queue(`ndm-generalTaskQueue`, {
  ...generalQueueOptions
}).on('error', err => {
  // log the error
  log.error(`[General Task Queue Error]: ${err}`);
})

const generalFlowProducer = new FlowProducer(generalQueueOptions)

const generalWorker = new Worker(generalQueue.name,
  async (job, token) => {
    return await task[job.name].process(job, token)
  },
  {
    ...generalQueueOptions,
    concurrency: 10,
    /***
     * This is set to false so jobs aren't immediately proccessed when added to the queue.
     * Jobs wouldn't be executed until you logged into the UI even when set to true.
     * So setting to false and the calling worker.run in a separate service file to start
     * processing.
     */
    autorun: false
}).on('active', async (job, prev) => {
  try {
    const taskFlow = await task.TaskFlowFactory.getByID(job.data.taskFlowId)
    let shouldUpdateTaskFlow = false
    if (taskFlow.status == 'pending'){
      taskFlow.status = 'processing'
      shouldUpdateTaskFlow = true
    }
    if (taskFlow.isSubTaskPending(job.data.taskType)) {
      taskFlow.schedule({name: job.data.taskType}, job.id)
      shouldUpdateTaskFlow = true
    }
    if(shouldUpdateTaskFlow) {
      await taskFlow.update()
    }
  } catch (err) {
    log.error(`Error trying to mark task active: ${err}`)
  }
}).on('progress', async (job, progress) => {
  try {
    const taskFlow = await task.TaskFlowFactory.getByID(job.data.taskFlowId)
    taskFlow.updateProgress({name: job.data.taskType}, progress)
    await taskFlow.update()
  } catch (err) {
    log.warn(`Error trying to update progress: ${err}`)
  }
}).on('stalled', (jobID, prev) => {
  log.warn(`Job with jobID: ${jobID} stalled ${prev}`)
}).on('failed', async (job, err) => {
  try {
    log.error(`JOB NAMED ${job.name} FAILED: ${err} ${job.stacktrace}`)
    const taskFlow = await task.TaskFlowFactory.getByID(job.data.taskFlowId)
    taskFlow.fail({name: job.data.taskType}, job?.failedReason || err.message)
    taskFlow.complete()
    await taskFlow.update()
    await taskFlow.onFailure()
  } catch (err) {
    log.critical(`Error trying to run on failure code: ${err}`)
  }
}).on('error', err => {
  // log the error
  log.error(`WORKER ERROR: ${err}`);
}).on('completed', async (job, result) => {
  try {
    log.debug(JSON.stringify(result))
    const taskFlow = await task.TaskFlowFactory.getByID(job.data.taskFlowId)
    if (!job.parent) {// This is the root job and means we are probably finished
      await taskFlow.finalize(getQueueByName(job.queueName))
    }
    await taskFlow.update()
  } catch (err) {
    log.error(`Error marking task complete: ${err}`)
  }
})

function getQueueByName(name) {
  if (name == generalQueue.name) {
    return generalQueue
  }
}

module.exports = {
  general: {
    flowProducer: generalFlowProducer,
    queue: generalQueue,
    worker: generalWorker
  },
  getQueueByName
}
