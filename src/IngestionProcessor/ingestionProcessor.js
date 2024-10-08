

const { Queue, Worker } = require('bullmq')

const IngestData = require('../models/IngestData')
const task = require('../models/Task')
const config = require('../lib/config')
const log = require('../lib/logger')

let ingestionQueue = new Queue('rx-lite-ingestionQueue', {
  prefix: 'ingestionQueue',
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
    password: config.redis.pass
  }
}).on('error', err => {
  // log the error
  log.error(`QUEUE ERROR: ${err}`);
})

let worker = new Worker(ingestionQueue.name,
  async (job, token) => {
    return await task[job.name].process(job, token)
  },
  {
    prefix: 'ingestionQueue',
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
      password: config.redis.pass
    },
    concurrency: 10,

}).on('failed', (job, err) => {
  log.error(`JOB NAMED ${job.name} FAILED: ${err} ${job.stacktrace}`);
}).on('error', err => {
  // log the error
  log.error(`WORKER ERROR: ${err}`);
}).on('completed', (job, returnvalue) => {
  log.debug(returnvalue)
}).on('stalled', (jobID, prev) => {
  log.warn(`Job with jobID: ${jobID} stalled ${prev}`)
})

const INGESTION_LOOP_INTERVAL = 15 * 1000

setTimeout(start, INGESTION_LOOP_INTERVAL)
async function start() {
  try {
    let pendingIngest = await IngestData.getAllWithStage('pending')
    log.debug(`Number pending ingest: ${pendingIngest.length}`)
    for (let node of pendingIngest) {
      try {
        let taskFlow = new task.DiscoverNodeTaskFlow(null, null, {
          ingestDataId: node.id,
          bmcInfo: {
            ipmiIP: node.ipmiIP
          }
        })
        taskFlow.status = 'processing'
        await taskFlow.create()
        node.ingestState = 'ingesting'
        node.ingestTaskUUID = taskFlow.id
        await node.update()
      } catch (err) {
        log.error(`Unexpected error while adding node with bmcIP ${node.ipmiIP} to ingest queue: ${err}`)
      }
    }


    let taskFlows = await task.getAllNotFinished('DiscoverNodeTaskFlow')
    log.debug(`Number of taskFlows still processing: ${taskFlows.length}`)
    taskFlows.forEach(async (taskFlow) =>{
      if (!taskFlow.isComplete()) {
        let pendingSubtasks = taskFlow.getPendingSubtasks()
        pendingSubtasks.forEach(async (pendingTask) => {
          let dependencyResults = taskFlow.getDependencieResults(pendingTask)
          let data = {
            taskFlowId: taskFlow.id,
            ...pendingTask.attributes.data,
            ...dependencyResults
          }
          let job = await ingestionQueue.add(`${pendingTask.name}Task`, data)
          taskFlow.schedule(pendingTask, job.id)
          await taskFlow.update()
        })
        let activeSubtasks = taskFlow.getActiveSubtasks()
        activeSubtasks.forEach(async (activeTask) => {
          let job = await ingestionQueue.getJob(activeTask.attributes.jobId)
          let jobState = await job.getState()
          if (jobState === 'completed') {
            taskFlow.complete(activeTask, job.returnvalue)
          } else if (jobState === 'failed') {
            taskFlow.fail(activeTask, job.failedReason)
          }
          await taskFlow.update()
        })
      } else {
          taskFlow.complete()
        await taskFlow.update()
        if (taskFlow.hasFailed()) {
          await taskFlow.onFailure()
        }
      }
    })
  } catch(err) {
    log.error(err)
  } finally {
    setTimeout(start, INGESTION_LOOP_INTERVAL)
  }
}
