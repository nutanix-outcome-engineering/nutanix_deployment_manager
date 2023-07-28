const ms = require('ms')
const { promises: dns } = require('dns')
const { DelayedError } = require('bullmq')
const IngestData = require('../IngestData')
const redfishNode = require('../../lib/redfish-util')
const foundation = require('../../lib/foundation-util')

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
    let cvmInfo
    try {
      let node = new redfishNode(bmcInfo)
      const isPoweredOn = await node.isPoweredOn()
      if (!isPoweredOn) {
        await node.powerOn()
        // Delay job while we wait for power on. The function takes a epoch timestamp of the time to move it back to the wait queue
        await job.moveToDelayed((Date.now() + ms('5m')), token)
        // This error needs to be thrown otherwise the worker errors with a weird message
        throw new DelayedError('Waiting for node to power on.')
      } else {
        const fvm = new foundation()
        cvmInfo = await fvm.discoverNodesByBlockSN(node.blockSerial)
        const discoveredNode = cvmInfo.nodes.filter(n => n.node_serial == bmcInfo.nodeSerial)[0]
        delete cvmInfo.nodes

        if (discoveredNode) {
          let hostnameLookups = await Promise.allSettled([
            dns.reverse(bmcInfo.bmcIP),
            dns.reverse(discoveredNode?.hypervisor_ip),
            dns.reverse(discoveredNode?.cvm_ip)
          ])

          discoveredNode.ipmi_hostname = hostnameLookups[0].status === 'fulfilled' ? hostnameLookups[0].value : null
          discoveredNode.discovered_hypervisor_hostname = hostnameLookups[1].status === 'fulfilled' ? hostnameLookups[1].value : discoveredNode?.hypervisor_hostname
          discoveredNode.cvm_hostname = hostnameLookups[2].status === 'fulfilled' ? hostnameLookups[2].value : null

          cvmInfo.node = discoveredNode
        } else {
          throw new Error(`Node with BMC IP ${bmcInfo.bmcIP} already configured and in a cluster.`)
        }
      }
      return { cvmInfo }
    } catch (err) {
      throw err
    }
  }
}

class IngestNodeTask {
  static async process(job, token) {
    let bmcInfo = job.data.bmcInfo
    let cvmInfo = job.data.cvmInfo
    let node = await IngestData.getByIngestTaskUUID(job.data.taskFlowId)
    node.serial = bmcInfo.nodeSerial
    node.chassisSerial = bmcInfo.blockSerial

    node.ipmiHostname = cvmInfo.node.ipmi_hostname
    node.ipmiGateway = cvmInfo.node.ipmi_gateway
    node.ipmiSubnet = cvmInfo.node.ipmi_netmask

    node.hostIP = cvmInfo.node.hypervisor_ip
    node.hostHostname = cvmInfo.node.discovered_hypervisor_hostname
    node.hostGateway = cvmInfo.node.hypervisor_gateway
    node.hostSubnet = cvmInfo.node.hypervisor_netmask

    node.cvmIP = cvmInfo.node.cvm_ip
    node.cvmHostname = cvmInfo.node.cvm_hostname
    node.cvmGateway = cvmInfo.node.cvm_gateway
    node.cvmSubnet = cvmInfo.node.cvm_netmask

    node.ingestState = 'pendingReview'
    await node.update()
    return job.data
  }
}

module.exports = {
  DiscoverBMCTask,
  DiscoverCVMDirectTask,
  IngestNodeTask
}
