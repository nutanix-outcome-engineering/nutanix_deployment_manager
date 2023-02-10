'use strict'
const config = require('./config')
const axios = require('axios').default
const http = require('http')
const util = require('util')
const _ = require('lodash')

class foundationAPI {
  constructor(a) {
    this.fvm_ip = a?.fvm_ip || config.fvm_ip,
    this.axInstance = axios.create({
      timeout: 55000,
      httpsAgent: new http.Agent({
          rejectUnauthorized: false
        }),
      headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'chunked',
          'Accept': 'application/json'
      },
      baseURL: `http://${this.fvm_ip}:8000/foundation/`
    })
  }
  async discoverNodes(includeConfigured=false) {
    const resp = await this.axInstance.get('/discover_nodes')
    let blocks = resp.data
    blocks.forEach(block => {
      block.nodes = _.filter(block.nodes, ['configured', includeConfigured])
    })

    return blocks
  }

  async discoverNodesByBlockSN(blockSN) {
    const resp = await this.axInstance.get('/discover_nodes')
    let thisBlock = _.filter(resp.data, {'block_id': blockSN})[0]
    if (!thisBlock) {
      return
    }
    thisBlock.nodes = _.filter(thisBlock.nodes, {'configured' : false})
    let nodeArr = []
    for(let node of thisBlock.nodes) {
      if (!node.configured) {
        nodeArr.push({"ipv6_address": node.ipv6_address})
      }
    }
    const netDetails = await this.nodeNetworkDetailsArray(nodeArr)
    // TODO: un bubble-sort this shit.
    for (let tbIdx in thisBlock.nodes) {
      for (let tnIdx in netDetails) {
        if (thisBlock.nodes[tbIdx].ipv6_address == netDetails[tnIdx].ipv6_address) {
          _.merge(thisBlock.nodes[tbIdx], netDetails[tnIdx])
        }
      }
    }
    return thisBlock
  }

  async nodeNetworkDetails(ipv6Addr, timeout=45) {
    const body = {
      "nodes": [{"ipv6_address": ipv6Addr}],
      "timeout": `${timeout}`
    }
    const resp = await this.axInstance.post('/node_network_details', body)
    return resp.data.nodes[0]
  }

  async nodeNetworkDetailsArray(nodesArray, timeout=45) {
    const body = {
      "nodes": nodesArray,
      "timeout": `${timeout}`
    }
    const resp = await this.axInstance.post('/node_network_details', body)
    return resp.data.nodes
  }
}
// async function run() {
//   foundationAPI = new foundationAPI()
//   let goodBlockSN = '87J9ZB3'
//   let badBlockSN = 'kjsfdkjghs'
//   let resp = await foundationAPI.discoverNodesByBlockSN(goodBlockSN)
//   console.log(util.inspect(resp,{colors: true, depth: null}))
//   resp = await foundationAPI.discoverNodesByBlockSN(badBlockSN)
//   console.log(util.inspect(resp, {colors: true, depth: null}))
// }
// run()
