const { Server, EVENTS } = require('@tus/server')
const { FileStore } = require('@tus/file-store')
const { v4: uuid} = require('uuid')
const { resolve } = require('path')
const { UploadAOSTaskFlow, getLatestByTypeAndRef } = require('../models/Task')
const { general } = require('./workerQueues.js')
const AOS = require('../models/AOS.js')
const log = require('./logger.js')
const config = require('./config')

const filestoreDirectory = resolve(config.filestore.baseDirectory)

const imageStore = new FileStore({
  directory: filestoreDirectory
})

async function handleTaskTracking(type, id, size) {
  switch (type) {
    case 'aos':
      const taskFlow = await getLatestByTypeAndRef(`UploadAOSTaskFlow`, id)
      if (!taskFlow || taskFlow?.isComplete()) {
        let aos = await AOS.getById(id)
        aos.transferStatus = 'uploading'
        await aos.update()
        let uploadTaskFlow = new UploadAOSTaskFlow(null, null, {
          filepath: `${filestoreDirectory}/${aos.uuid}`,
          exportBasePath: `${resolve(filestoreDirectory, config.filestore.exportDirectory)}`,
          aosUUID: aos.uuid,
          size: size
        })
        await uploadTaskFlow.create()
        const jobTree = await general.flowProducer.add(uploadTaskFlow.generateJobsForQueue(general.queue.name))
        // TODO: add jobIds to taskFlow
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
    if (!['aos'].includes(req.headers['ndm-upload-type'])) {
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
      }
    } catch (err) {
      log.error(`Error processing file with id ${id}: ${err}`)
      throw {status_code: 500, body: err.message}
    }
  },
  onResponseError: async (req, res, error) => {
    //
    if (req.params.id && req.headers['ndm-auto-retry'] == 5) {
      const taskFlow = await getLatestByTypeAndRef(`Upload${req.headers['ndm-upload-type'].toUpperCase()}TaskFlow`, req.params.id)
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
    log.error(`Error during file upload: ${err}`)
  }
}).on(EVENTS.POST_RECEIVE, (req, res, upload) => {
  log.debug(`POST_RECEIVE: ${JSON.stringify(upload)}`)
}).on(EVENTS.POST_TERMINATE, (req, res, id) => {
  log.debug(`POST_TERMINATE: ${JSON.stringify(id)}`)
})

module.exports = { uploadsServer }
