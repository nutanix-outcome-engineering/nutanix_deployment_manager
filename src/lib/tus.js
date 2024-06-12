const { Server, EVENTS } = require('@tus/server')
const { FileStore } = require('@tus/file-store')
const { v4: uuid} = require('uuid')
const { resolve } = require('path')
const { startCase } = require('lodash')
const {
  UploadAosTaskFlow,
  UploadHypervisorTaskFlow,
  getLatestByTypeAndRef
} = require('../models/Task')
const {
  AOS,
  Hypervisor,
} = require('../models')
const { general } = require('./workerQueues.js')
const log = require('./logger.js')
const config = require('./config')

// TODO: Think about how to handle this for remote NFS servers/dev
// this refers to a local directory
const filestoreDirectory = resolve(config.filestore.tusBase)

const imageStore = new FileStore({
  directory: filestoreDirectory
})

async function handleTaskTracking(type, id, size) {
  let taskFlow
  log.debug(`Entered handleTaskTracking for type ${type} with id ${id}`)
  switch (type) {
    case 'aos':
      taskFlow = await getLatestByTypeAndRef(`UploadAosTaskFlow`, id)
      if (!taskFlow || taskFlow?.isComplete()) {
        let aos = await AOS.getById(id)
        aos.transferStatus = 'uploading'
        await aos.update()
        let uploadTaskFlow = new UploadAosTaskFlow(null, null, {
          filepath: `${filestoreDirectory}/${aos.uuid}`,
          exportBasePath: `${resolve(filestoreDirectory, config.filestore.exportDirectory)}`,
          aosUUID: aos.uuid,
          size: size
        })
        await uploadTaskFlow.create()
        const jobTree = await general.flowProducer.add(uploadTaskFlow.generateJobsForQueue(general.queue.name))
        uploadTaskFlow.addJobIdsToTasks(jobTree)
        await uploadTaskFlow.update()
      }
      break;
    case 'hypervisor':
      log.debug(`Entered hypervisor case for type ${type} with id ${id}`)
      taskFlow = await getLatestByTypeAndRef(`UploadHypervisorTaskFlow`, id)
      if (!taskFlow || taskFlow?.isComplete()) {
        let hypervisor = await Hypervisor.getById(id)
        hypervisor.transferStatus = 'uploading'
        await hypervisor.update()
        let uploadTaskFlow = new UploadHypervisorTaskFlow(null, null, {
          filepath: `${filestoreDirectory}/${hypervisor.uuid}`,
          exportBasePath: `${resolve(filestoreDirectory, config.filestore.exportDirectory)}`,
          hypervisorUUID: hypervisor.uuid,
          size: size
        })
        await uploadTaskFlow.create()
        const jobTree = await general.flowProducer.add(uploadTaskFlow.generateJobsForQueue(general.queue.name))
        uploadTaskFlow.addJobIdsToTasks(jobTree)
        await uploadTaskFlow.update()
      }
      break;
  }
}



const uploadsServer = new Server({
  // path here can be arbitratry because we pull it from the request; see generateUrl below
  path: '/',
  datastore: imageStore,
  relativeLocation: true,
  namingFunction: (req) => uuid(),
  generateUrl: (req, { proto, host, baseUrl, path, id }) => {
    return `${req.path}/${id}`
  },
  onUploadCreate: async (req, res, upload) => {
    if (!['aos', 'hypervisor'].includes(req.headers['ndm-upload-type'])) {
      throw {status_code: 500, body: `Unknown upload type ${type}`}
    }
    upload.id = upload.metadata.refId
    return res
  },
  onUploadFinish: async (req, res, upload) => {
    return res
  },
  onIncomingRequest: async (req, res, id) => {
    try {
      //This is here so we can handle task tracking
      if (req.method == 'PATCH' && !req.headers['ndm-auto-retry']) {
        const totalSize = Number(req.headers['content-length']) + Number(req.headers['upload-offset'])
        await handleTaskTracking(req.headers['ndm-upload-type'], id, totalSize)
        log.debug(`Task tracking started for upload with id ${id}`)
      }
    } catch (err) {
      log.error(`Error processing file with id ${id}: ${err}`)
      throw {status_code: 500, body: err.message}
    }
  },
  onResponseError: async (req, res, error) => {
    //
    if (req.params.id && req.headers['ndm-auto-retry'] == 5) {
      const taskFlow = await getLatestByTypeAndRef(`Upload${startCase(req.headers['ndm-upload-type'])}TaskFlow`, req.params.id)
      if (taskFlow) {
        let notCompletedTasks = taskFlow.getAllActivePendingSubtasks()
        let jobIds = notCompletedTasks.reduce((jobIds, task) => {
          taskFlow.fail(task, error.message)
          if(task.attributes.jobId) {
            jobIds.push(task.attributes.jobId)
          }
          return jobIds
        }, [])
        try {
          await Promise.all(jobIds.map(id => general.queue.remove(id, true)))
        } catch (err) {
          // TODO: Dunno what to do here yet
        }
        taskFlow.complete()
        await taskFlow.update()
        await taskFlow.onFailure()
      }
    }
    log.error(`Error during file upload: ${error}`)
  }
}).on(EVENTS.POST_RECEIVE, (req, res, upload) => {
  log.debug(`POST_RECEIVE: ${JSON.stringify(upload)}`)
}).on(EVENTS.POST_TERMINATE, (req, res, id) => {
  log.debug(`POST_TERMINATE: ${JSON.stringify(id)}`)
})

module.exports = { uploadsServer }
