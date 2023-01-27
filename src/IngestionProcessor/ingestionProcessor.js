

const { Queue, Worker } = require('bullmq')

const IngestData = require('../models/IngestData')
const task = require('../models/Task')
const config = require('../lib/config')

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
  console.error(`QUEUE ERROR: ${err}`);
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
  console.error(`JOB NAMED ${job.name} FAILED: ${err} ${job.stacktrace}`);
}).on('error', err => {
  // log the error
  console.error(`WORKER ERROR: ${err}`);
}).on('completed', (job, returnvalue) => {
  console.log(returnvalue)
}).on('stalled', (jobID, prev) => {
  console.log(`Job with jobID: ${jobID} stalled ${prev}`)
})

const INGESTION_LOOP_INTERVAL = 15 * 1000

setTimeout(start, INGESTION_LOOP_INTERVAL)
let taskFlows = new Map()
async function start() {
  try {
    let pendingIngest = await IngestData.getAllWithStage('pending')
    console.log(`Number pending ingest: ${pendingIngest.length}`)
    for (let node of pendingIngest) {
      try {
        let t = new task.DiscoverNodeTaskFlow(null, {
          bmcInfo: {
            ipmiIP: node.ipmiIP,
            user: 'root',
            password: 'calvin'
          }
        })
        taskFlows.set(t.id, t)
        node.ingestState = 'ingesting'
        node.ingestTaskUUID = t.id
        await node.update()
      } catch (err) {
        console.log(`Unexpected error while adding node with bmcIP ${node.ipmiIP} to ingest queue: ${err}`)
      }
    }

    console.log(`Number of taskFlows still processing: ${taskFlows.size}`)
    taskFlows.forEach((t, tId, map) =>{
      if (!t.isComplete()) {
        let pt = t.getPendingSubtasks()
        pt.forEach(async (tt) => {
          let dependencyResults = t.getDependencieResults(tt)
          let data = {
            taskFlowId: tId,
            ...tt.attributes.data,
            ...dependencyResults
          }
          let job = await ingestionQueue.add(`${tt.name}Task`, data)
          t.schedule(tt, job.id)
        })
        let at = t.getActiveSubtasks()
        at.forEach(async (tt) => {
          let aj = await ingestionQueue.getJob(tt.attributes.jobId)
          let jobState = await aj.getState()
          if (jobState === 'completed') {
            t.complete(tt, aj.returnvalue)
          } else if (jobState === 'failed') {
            t.fail(tt, aj.failedReason)
          }
        })
      } else {
        taskFlows.delete(tId)
      }
    })
  } catch(err) {
    console.log(err)
  } finally {
    setTimeout(start, INGESTION_LOOP_INTERVAL)
  }
}
