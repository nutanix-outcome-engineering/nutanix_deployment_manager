
const busboy = require('busboy')
const { Netmask, ip2long, long2ip } = require('netmask')
const { readData } = require('../lib/csv.js')
const IngestData  = require('../models/IngestData.js');
const Node = require('../models/Node.js');
const Foundation = require('nutanix_foundation')
const _ = require('lodash')
const config = require('../lib/config')


module.exports = {

  csv: async (req, res, next) => {
    let nodesToIngest = req.files[0].csv
    await IngestData.massInsert(nodesToIngest)
    res.status(201).json({status: 'ingest queued'})
  },

  ip: {
    range: async (req, res, next) => {
      let ingestIP = ip2long(req.body.start)
      const stop = ip2long(req.body.stop)

      if (ingestIP > stop) {
        throw new Error("Start greater than end")
      }

      let nodesToIngest = []
      do {
        nodesToIngest.push(new IngestData({
          ipmiIP: long2ip(ingestIP),
          ingestState: 'pending',
          failureReason: null,
          credentials: req.body.credentials
        }))
        ingestIP++
      } while (ingestIP <= stop)
      await IngestData.massInsert(nodesToIngest)

      res.status(201).json({status: `ingest of ${nodesToIngest.length} queued`})
    },
  },
  nodes: async (req, res, next) => {
    let nodesToIngest = []
    let nodes = req.body.nodes
    // TODO: duplicate detection of IPs

    nodes.forEach(node => {
      nodesToIngest.push(new IngestData({
        serial: node.serial,
        chassisSerial: node.chassisSerial,

        ipmiIP: node.ipmi.ip,
        ipmiGateway: node.ipmi.gateway,
        ipmiSubnet: node.ipmi.subnet,

        cvmIP: node.cvm.ip,
        cvmGateway: node.cvm.gateway,
        cvmSubnet: node.cvm.subnet,

        hostIP: node.host.ip,
        hostGateway: node.host.gateway,
        hostSubnet: node.host.subnet,

        ingestState: 'pending',
        credentials: req.body.credentials
      }))
    })
    await IngestData.massInsert(nodesToIngest)
    res.status(201).json({status: `ingest of ${nodesToIngest.length} queued`})
  },
  foundation: {
    discover: async (req, res, next) => {
      const fvm = new Foundation(config.fvm_ip)

      const discoveredNodes = (await fvm.discoverNodes({},{fetchNetworkInfo: true})).flatMap(block => {
        let retVal = []
        block.nodes.forEach(node => {
          let separated = {
            serial: node.node_serial,
            chassisSerial: block.block_id,
            ipv6Address: node.ipv6_address,
            position: node.node_position,
            ipmi: {
              ip: node.ipmi_ip,
              gateway: node.ipmi_gateway,
              subnet: node.ipmi_netmask
            },
            cvm: {
              ip: node.cvm_ip,
              gateway: node.cvm_gateway,
              subnet: node.cvm_netmask,
              vlan: Number(node.current_cvm_vlan_tag)
            },
            host: {
              ip: node.hypervisor_ip,
              gateway: node.hypervisor_gateway,
              subnet: node.hypervisor_netmask,
              hostname: node.hypervisor_hostname
            }
          }
          retVal.push(separated)
        })
        return retVal
      })
      const allNodes  = (await Promise.all([IngestData.getAll(), Node.getAll()])).flat()

      res.status(200).json(discoveredNodes.filter(node => !allNodes.find(n => Boolean(n.serial == node.serial))))
    },
    'provision-network': async (req, res, next) => {
      const fvm = new Foundation(config.fvm_ip)
      let nodesToReconfigure = req.body.map(node => {
        return {
          "ipv6_address": node.ipv6Address,
          "ipmi_ip": node.ipmi.ip,
          "ipmi_gateway": node.ipmi.gateway,
          "ipmi_netmask": node.ipmi.subnet,

          "cvm_ip": node.cvm.ip,
          "cvm_gateway": node.cvm.gateway,
          "cvm_netmask": node.cvm.subnet,
          "cvm_vlan_id": `${node.cvm.vlan}`,

          "hypervisor_hostname": node.host.hostname,
          "hypervisor_ip": node.host.ip,
          "hypervisor_gateway": node.host.gateway,
          "hypervisor_netmask": node.host.subnet
        }
      })
      try {
        let resp = await fvm.provisionNetwork(nodesToReconfigure)
        // Maybe handle partial successes and error. Currently dunno how to test so leaving as is.
        res.status(200).json(resp.data || {})
      } catch (err) {
        if (err.response.data) {
          next({message: err.response.data.message})
        } else {
          next(err)
        }
      }
    }
  },

  /**
   * TODO: remove this later. Keeping for reference
   * busboy implementation
   * */
  csv2: (req, res) => {
    console.log("IN HANDLER")
    let headers
    const bb = busboy({headers: req.headers})
      .on('file', async (name, filestream, info) => {
        console.log(`Got File ${name} with info ${JSON.stringify(info)}`)

        // const parser = parse({
        //   columns: headers || true,
        //   raw: true,
        //   from: headers ? 2 : 1,
        //   skip_records_with_empty_values: true,
        //   skip_empty_lines: true,
        //   relax_column_count: true
        // })
        // function cb(d) {
        //   console.log(d)
        //   return d
        // }
        // let records = []
        // for await (const r of filestream.pipe(parser)) {
        //   records.push(cb(r))
        // }
        // console.log(records)
        let ingest = await readData(filestream, headers, (data) => {
          let id = IngestData.fromCSVRecord(data);
          return id
        })
        // await IngestData.massInsert(ingest)

        res.status(201).json({status: 'ingest queued'})
      })
      .on('field', (name, value, info) => {
        // console.log(`Got field ${name} with with value ${value} and info ${JSON.stringify(info)}`)
        headers = JSON.parse(value)
      })
      .on('error', (err) => {
        console.log(err)
        res.status(500).json({})
      })
    req.pipe(bb)
  }
}
