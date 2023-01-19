'use strict'
const axios = require('axios').default
const https = require('https')
const util = require('util')
const _ = require('lodash')

class redfishNode {
   constructor(a) {
    this.bmcIP = a.bmcIP
    this.bmcUser = a.bmcUser
    this.bmcPass = a.bmcPass
    this.sysID = null
    this.serviceTag = null
    this.oem = null
    this.nodeSwitchConnections = null
    this.embeddedSwitchConnections = null
    this.axInstance = axios.create({
      timeout: 5000,
      httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
      headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'chunked',
          'Accept': 'application/json'
      },
      auth: {'username': this.bmcUser, 'password': this.bmcPass},
      baseURL: `https://${this.bmcIP}/redfish/v1`
    })
  }
  static async init(a) {
    const rfNode = new redfishNode(a)
    await rfNode.getServiceRoot()
    await rfNode.getSystems()
    await rfNode.getSwitchConnections()
    return rfNode
  }
  async getServiceRoot() {
    const resp = await this.axInstance.get()
    this.oem = resp.data.Vendor
    if (this.oem == 'Dell') {
      this.serviceTag = resp.data.Oem[`${this.oem}`].ServiceTag
    }
  }
  async getSystems(){
    const resp = await this.axInstance.get(`/Systems`)
    const shim = resp.data.Members[0]['@odata.id']
    this.sysID = shim.substring(shim.lastIndexOf('/')+1)

  }

  async getSwitchConnections() {
     if (this.oem=='Dell'){
      await this.getDellSwitchConnections()
     }
     //TODO: other oem platforms...
  }

  async verifyDellSwitchConnections(switchPort) {
    if (this.nodeSwitchConnections == null) {
      await this.getDellSwitchConnections()
    }
    let notMatching = this.nodeSwitchConnections.filter(a => !a.SwitchPortConnectionID.includes(switchPort))
    if (notMatching.length > 0) {
      console.log(`One or more NICs aren't using the specified switchport`)
    }
    else{
      console.log(`All non-embedded NICs matched the expected switchport`)
    }
  }
  async getDellSwitchConnections() {
    const resp = await this.axInstance.get(`/Systems/${this.sysID}/NetworkPorts/Oem/Dell/DellSwitchConnections`)
    const nodeConnections = resp.data.Members.filter(a => !a.Id.includes('Embedded'))
    const embeddedConnections = resp.data.Members.filter(a => a.Id.includes('Embedded'))
    this.nodeSwitchConnections = nodeConnections
    this.embeddedSwitchConnections = embeddedConnections
  }
  // TODO: (don't print bmcPass?)
  toJSON() {
    return _.omit(this,["axInstance", "bmcPass"])
  }
  toString() {
    return util.inspect(_.omit(this, ["axInstance", "bmcPass"]), {colors: true, depth: null})
  }
}
module.exports = redfishNode
// async function run() {
//   console.log('RUNNING')
//   const bmc = {
//     bmcIP: '10.38.43.33',
//     bmcUser: 'root',
//     bmcPass: 'calvin'
//   }
//   let thisRF = await redfishNode.init(bmc)
//   console.log('%s', thisRF)
//   thisRF.verifyDellSwitchConnections('Ethernet24/2')
// }

// run()
