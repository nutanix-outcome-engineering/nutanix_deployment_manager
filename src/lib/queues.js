const { Queue, FlowProducer } = require('bullmq')
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

function getQueueByName(name) {
  if (name == generalQueue.name) {
    return generalQueue
  }
}

module.exports = {
  general: {
    options: generalQueueOptions,
    queue: generalQueue,
    flowProducer: generalFlowProducer,
  },
  getQueueByName
}
