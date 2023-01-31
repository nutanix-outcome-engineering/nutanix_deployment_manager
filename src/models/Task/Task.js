let redfishNode = require('../../lib/redfish-util')

class DiscoverBMCTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token){
    let bmcInfo = job.data.bmcInfo
    try {
      let node = await redfishNode.init({
        bmcIP: bmcInfo.ipmiIP,
        bmcUser: bmcInfo.user,
        bmcPass: bmcInfo.password
      })
      return { bmcInfo: node.toJSON() }
    } catch (err) {
      throw err
    }
  }
}

class DiscoverCVMDirectTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token){
    let bmcInfo = job.data.bmcInfo
    try {
      let node = new redfishNode(bmcInfo)
      let cvmInfo = {
        cvmInfo : {
          isPoweredOn: (await node.isPoweredOn())
        }
      }
      return cvmInfo
    } catch (err) {
      throw err
    }
  }
}

const IngestData = require('../IngestData')
class IngestNodeTask {
  static async process(job, token) {
    let bmcInfo = job.data.bmcInfo
    let cvmInfo = job.data.cvmInfo
    let node = await IngestData.getByIngestTaskUUID(job.data.taskFlowId)
    node.serial = bmcInfo.serial
    node.cvmIP = cvmInfo.isPoweredOn
    node.ingestState = 'pendingReview'
    await node.update()
    return 'ALL FINISHED'
  }
}

module.exports = {
  DiscoverBMCTask,
  DiscoverCVMDirectTask,
  IngestNodeTask
}
