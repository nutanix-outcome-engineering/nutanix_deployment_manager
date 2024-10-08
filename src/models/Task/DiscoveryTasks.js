const ms = require('ms')
const { promises: dns } = require('dns')
const { DelayedError } = require('bullmq')
const _ = require('lodash')
const IngestData = require('../IngestData')
const redfishNode = require('../../lib/redfish-util')
const Rack = require('../Rack')
const Site = require('../Site')
const Switch = require('../Switch')
const Foundation = require('nutanix_foundation')
const { fetchLLDPESXi, fetchLLDPAHV } = require('../../lib/lldp.js')
const config = require('../../lib/config')

class DiscoverBMCTask {
  constructor() {
  }

  static get type() {
    return this.name
  }

  static async process(job, token){
    let bmcInfo = job.data.bmcInfo
    try {
      const ingestData = await IngestData.getByID(job.data.ingestDataId)
      let node = await redfishNode.init({
        bmcIP: bmcInfo.ipmiIP,
        bmcUser: ingestData.credentials.ipmi.username,
        bmcPass: ingestData.credentials.ipmi.password
      })
      return { bmcInfo: node.toJSON(), ingestDataId: job.data.ingestDataId }
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
    let blockInfo
    try {
      const ingestData = await IngestData.getByID(job.data.ingestDataId)
      let node = new redfishNode({...bmcInfo, bmcPass: ingestData.credentials.ipmi.password})
      const isPoweredOn = await node.isPoweredOn()
      // TODO: handle scalable BMC discovery -- don't try to fetch network info for all nodes that come back in discovery when starting from BMC IP range
      if (!isPoweredOn) {
        await node.powerOn()
        // Delay job while we wait for power on. The function takes a epoch timestamp of the time to move it back to the wait queue
        await job.moveToDelayed((Date.now() + ms('5m')), token)
        // This error needs to be thrown otherwise the worker errors with a weird message
        throw new DelayedError('Waiting for node to power on.')
      } else {
        let fvm
        if (ingestData.cvmIP) {
          // Coming from node discovery, talk to CVM foundation service and include the knowledge we have from discovery
          // long-term TODO: ... Consider if this is actually needed or if we should just rely on what is already in ingestData
          fvm = new Foundation(ingestData.cvmIP, {logger: null})
          blockInfo = (await fvm.discoverNodes({ipmiIP: node.bmcIP, blockSN: ingestData.chassisSerial, ipv6Address:ingestData.ipv6Address}, {fetchNetworkInfo: true}))[0]
        }
        else {
          fvm = new Foundation(config.fvm_ip, {logger: null})
          blockInfo = (await fvm.discoverNodes({ipmiIP: node.bmcIP}, {fetchNetworkInfo: true}))[0]
        }
        const discoveredNode = blockInfo?.nodes?.[0]

        if (discoveredNode) {
          let hostnameLookups = await Promise.allSettled([
            dns.reverse(bmcInfo.bmcIP),
            dns.reverse(discoveredNode?.hypervisor_ip),
            dns.reverse(discoveredNode?.cvm_ip)
          ])

          discoveredNode.ipmi_hostname = hostnameLookups[0].status === 'fulfilled' ? hostnameLookups[0].value : null
          discoveredNode.discovered_hypervisor_hostname = hostnameLookups[1].status === 'fulfilled' ? hostnameLookups[1].value : discoveredNode?.hypervisor_hostname
          discoveredNode.cvm_hostname = hostnameLookups[2].status === 'fulfilled' ? hostnameLookups[2].value : null
          blockInfo.nodes = [discoveredNode]
        } else {
          throw new Error(`Node with BMC IP ${bmcInfo.bmcIP} already configured and in a cluster.`)
        }
      }
      return { blockInfo, ingestDataId: job.data.ingestDataId }
    } catch (err) {
      throw err
    }
  }
}

class FetchLLDPTask {
  static async process(job, token) {
    const blockInfo = job.data.blockInfo
    try {
      const ingestData = await IngestData.getByID(job.data.ingestDataId)
      // Extend the lock since we know this job takes time and we don't want it to be marked as stalled
      // await job.extendLock(token, ms(`${20*8}s`))
      let hypervisorInfo = {
        version: blockInfo.nodes[0].hypervisor_version,
        os: blockInfo.nodes[0].hypervisor,
      }

      let hostInfo = {
        host: blockInfo.nodes[0].hypervisor_ip,
        username: ingestData.credentials.host.username,
        password: ingestData.credentials.host.password
      }

      let lldpInfo
      if (hypervisorInfo.os === 'esx') {
        lldpInfo = await fetchLLDPESXi(hostInfo, job.log)
      }
      else if (hypervisorInfo.os === 'kvm') {
        lldpInfo = await fetchLLDPAHV(hostInfo, job.log)
      }
      else {
        throw new Error(`Unknown hypervisor type: ${hypervisorInfo.os}`)
      }

      if(lldpInfo.some(nic => nic.info.linkState == 'up' && nic.lldp.neighbor <= 0)) {
        // TODO: don't loop infinitely here
        await job.moveToDelayed((Date.now() + ms('30s')), token)
        throw new DelayedError('Waiting for LLDP Neighbor Info')
      }

      return { lldpInfo }
    } catch (err) {
      throw err
    }
  }
}

class IngestNodeTask {
  static async process(job, token) {
    const bmcInfo = job.data.bmcInfo
    const blockInfo = job.data.blockInfo
    const lldpInfo = job.data.lldpInfo
    const bmcNicInfo = bmcInfo?.nodeSwitchConnections
    let discoveredRacks = new Set()
    let discoveredSites = new Set()
    let discoveredSwitches = []
    let unMappedSwitches = new Set()
    const nics = await Promise.all(lldpInfo.map(async (nic) => {
      let lldpNeighbor = nic.lldp.neighbor
      let switchInfo = null
      if (lldpNeighbor.length > 0) {
        // ESX split, TODO: single-path this but cleaning the input data from ESX
        if(blockInfo.nodes[0].hypervisor === 'esx') {
          switchInfo = {
            portID: _.filter(lldpNeighbor, {type: '2'})[0]?.value,
            switchMAC: _.filter(lldpNeighbor, {type: '1'})[0]?.value,
            switchName: _.filter(lldpNeighbor, {type: '5'})[0]?.value,
            switchIP: _.filter(lldpNeighbor, {type: '8'})[0]?.value
          }
        }
        else if (blockInfo.nodes[0].hypervisor === 'kvm') {
          switchInfo = nic.switchInfo
        }
        if (switchInfo.switchIP) {
          let thisSwitch = await Switch.getByIPandType(switchInfo.switchIP, 'tor')
          if(thisSwitch) {
            switchInfo.id = thisSwitch.id
            switchInfo.type = thisSwitch.type
            // TODO: Question as to whether we denote any difference between LLDP name and name in NDM switch table?
            switchInfo.name = thisSwitch.name
            // Capturing for now...
            if(switchInfo.name != switchInfo.switchName) {
              switchInfo.switchNameMismatch = true
            }
            const thisRack = await Rack.getByID(thisSwitch.rackID)
            const thisSite = await Site.getByID(thisRack.siteID)
            thisSwitch.rack = thisRack
            thisSwitch.site = thisSite
            // TODO: this is not deduping, start from array and map to
            // array.filter where id=id (or array.map)
            // consider using find with custom function.
            discoveredRacks.add(thisRack)
            discoveredSites.add(thisSite)
            discoveredSwitches.push(thisSwitch)
          }
          else {
            unMappedSwitches.add(switchInfo)
          }
        }
      }
      let nicInfo = {
        linkState: nic.info.linkState,
        adminState: nic.info.adminState,
        name: nic.name,
        nicMAC: nic.info.mac,
        pciDevice: nic.info.pciDevice,
        switchInfo
      }
      // TODO: unify these variables across hypervisors
      if (nic.info.inBond) {nicInfo.inBond = nic.info.inBond}
      if (nic.info.bondName) {nicInfo.bondName = nic.info.bondName}
      if (nic.info.speed) {nicInfo.speed = nic.info.speed}
      return nicInfo
    }))
    job.data.rackIDMismatch = discoveredRacks.size > 1
    job.data.unMappedSwitches = unMappedSwitches.size ? [...unMappedSwitches] : undefined
    job.data.nics = nics
    job.data.discoveredRacks = [...discoveredRacks]
    job.data.discoveredSites = [...discoveredSites]
    job.data.discoveredSwitches = discoveredSwitches
    // If you find the same TOR twice, that's probably a misconfig, may tweak this for expected links beyond 2
    job.data.duplicateSwitchConnectionPresent = new Set(discoveredSwitches).size !== discoveredSwitches.length
    await job.updateData(job.data)

    let node = await IngestData.getByIngestTaskUUID(job.data.taskFlowId)
    node.serial = blockInfo.nodes[0].node_serial
    node.chassisSerial = blockInfo.block_id

    node.ipmiHostname = blockInfo.nodes[0].ipmi_hostname
    node.ipmiGateway = blockInfo.nodes[0].ipmi_gateway
    node.ipmiSubnet = blockInfo.nodes[0].ipmi_netmask

    node.hostIP = blockInfo.nodes[0].hypervisor_ip
    node.hostHostname = blockInfo.nodes[0].discovered_hypervisor_hostname
    node.hostGateway = blockInfo.nodes[0].hypervisor_gateway
    node.hostSubnet = blockInfo.nodes[0].hypervisor_netmask

    node.cvmIP = blockInfo.nodes[0].cvm_ip
    node.cvmHostname = blockInfo.nodes[0].cvm_hostname
    node.cvmGateway = blockInfo.nodes[0].cvm_gateway
    node.cvmSubnet = blockInfo.nodes[0].cvm_netmask

    await node.update()
    if (job.data.nics.some(nic => nic.linkState == 'up' && nic.switchInfo == null)) {
      throw new Error('Node failed switch discovery.')
    }
    node.ingestState = 'pendingReview'
    await node.update()

    return job.data
  }
}

module.exports = {
  DiscoverBMCTask,
  DiscoverCVMDirectTask,
  FetchLLDPTask,
  IngestNodeTask
}
