const { exec } = require('./ssh.js')
const csv = require('./csv.js')
const { long2ip } = require('netmask')
const _ = require('lodash')

module.exports = {
  fetchLLDPESXi,
  fetchLLDPAHV
}

async function fetchLLDPAHV({host, username, password}, logger=undefined) {
  const hostInfo = {host, username, password}
  // Get interface list and ovs bridge config, add stragglers
  let nicList = await getPhysicalNicsAHV(hostInfo, logger)
  const commandOutput = await exec(hostInfo,`lldpcli show neighbors details -f json0`)
  const lldpOutput = commandOutput.stdout
  let nicArray = JSON.parse(lldpOutput).lldp[0].interface
  nicList.forEach(nic => {
    let thisNic = _.find(nicArray,{'name':`${nic.name}`})
    nic.info = {
      linkState: nic.carrier == 1 ? 'up' : 'down',
      adminState: nic.operState == 'up' ? 'enabled' : 'disabled',
      mac: nic.mac,
      pciDevice: nic.pciDevice,
      speed: nic.speed,
      inBond: nic.bondName != 'undefined' ? true : false,
      bondName: nic.bondName
    }
    if (thisNic) {
      nic.lldp = {
        neighbor: [{
          portID: thisNic.port[0].id[0].value,
          portDescr: thisNic.port[0].descr[0].value,
          switchMAC: thisNic.chassis[0].id[0].value,
          switchName: thisNic.chassis[0].name[0].value,
          switchIP: thisNic.chassis[0]["mgmt-ip"][0].value,
          vlan: thisNic.vlan[0]["vlan-id"]
        }]
      }
      nic.switchInfo = {
        portID: thisNic.port[0].id[0].value,
        portDescr: thisNic.port[0].descr[0].value,
        switchMAC: thisNic.chassis[0].id[0].value,
        switchName: thisNic.chassis[0].name[0].value,
        switchIP: thisNic.chassis[0]["mgmt-ip"][0].value,
        vlan: thisNic.vlan[0]["vlan-id"]
      }
    }
    else {
      nic.lldp = {neighbor: []}
    }

  })
  return nicList
}

async function getPhysicalNicsAHV({host, username, password}, logger=undefined) {
  const hostInfo = {host, username, password}
  const commandOutput = await exec(hostInfo,`find /sys/class/net -mindepth 1 -maxdepth 1 -not -lname '*virtual*' -not -lname '*usb*' -printf '%f\n'`)
  // splitting on newline, remove trailing entry
  let nicArray = commandOutput.stdout.trim().split('\n')
  let nics = await Promise.all(nicArray.map(async (nic) => await getAHVNicInfo(hostInfo, nic, logger)))
  nics = nics.map(nic => {
    nic = nic.trim().split(',')
    return {
      name: nic[0],
      mac: nic[3],
      speed: nic[2].replaceAll(/\D/g, ''),
      pciDevice: nic[1],
      operState: nic[4],
      carrier: nic[5],
      bondName: nic[6]
    }
  })
  nics.sort((n1,n2) => (n1.name > n2.name) ? 1 : (n1.name < n2.name) ? -1 : 0)
  return nics

}

async function getAHVNicInfo(hostInfo, nic, logger) {
  const commands = [
    `pciBus=$(ethtool -i ${nic} | grep bus-info | awk '{print $2}')`,
    `address=$(cat /sys/class/net/${nic}/address)`,
    `speed=$(ethtool ${nic} | grep -i speed | awk '{print $2}')`,
    `operState=$(cat /sys/class/net/${nic}/operstate)`,
    `carrier=$(cat /sys/class/net/${nic}/carrier || echo 'unknown')`,
    `bondName=$(ovs-vsctl iface-to-br ${nic} || echo 'undefined')`,
    `echo ${nic},$pciBus,$speed,$address,$operState,$carrier,$bondName`
  ]
  const output = await exec(hostInfo, commands.join('\n'))
  return output.stdout
}

/*** ESXi LLDP FETCH CODE ***/
async function fetchLLDPESXi({host, username, password}, logger=undefined) {
  const hostInfo = {host, username, password}
  const vSwitchConfig = await getVSwitchConfig(hostInfo)
  const nicInfo = vSwitchConfig.nicInfo

  if (!vSwitchConfig.vSwitchInfo.find(vswitch => vswitch.Name === 'vSwitchNDMTemp')) {
    await createNDMVSwitch(hostInfo)
  }

  if (vSwitchConfig.uplinksNotInVSwitch.length > 0) {
    await addUplinksToNDMVSwitch(hostInfo, vSwitchConfig.uplinksNotInVSwitch)
  }

  let uplinkIDs = (await getUplinkPortIDs(hostInfo, 'vSwitch0')).split(',')
  let uplinkIDsTemp = (await getUplinkPortIDs(hostInfo, 'vSwitchNDMTemp')).split(',')

  nicInfo.forEach(nic => {
    let portIDInfo = uplinkIDs.find(uplink => uplink.includes(nic.Name))
    if (portIDInfo) {
      nic.vSwitchName = 'vSwitch0'
      nic.inBond = true
    } else {
      portIDInfo = uplinkIDsTemp.find(uplink => uplink.includes(nic.Name))
      nic.vSwitchName = 'vSwitchNDMTemp'
      nic.inBond = false
    }
    nic.portID = portIDInfo.split(':')[1]
  })
  await enableLLDP(hostInfo, nicInfo)

  let lldpInfo = (await Promise.all(nicInfo.map(uplink => {
    return gatherLLDPInfoESX(hostInfo, uplink, logger)
  }))).flat()

  await removeNDMVSwitch(hostInfo, vSwitchConfig.uplinksNotInVSwitch)

  return lldpInfo
}

async function getVSwitchConfig(hostInfo) {
  let vSwitchInfo = await exec(hostInfo, `esxcli --formatter=csv network vswitch standard list`)
  vSwitchInfo = csv.parseCSV(vSwitchInfo.stdout).filter(vswitch => vswitch.Name.match(/vSwitch0|vSwitchNDMTemp/))
  let uplinksInVSwitch = vSwitchInfo.flatMap(vswitch => vswitch.Uplinks.replace(/,*$/,'').split(','))

  let nicInfo = await exec(hostInfo, `esxcli --formatter=csv network nic list`)
  nicInfo = csv.parseCSV(nicInfo.stdout).filter(nic => nic.Name.toLowerCase().includes('vmnic'))

  let uplinksNotInVSwitch = nicInfo.filter(nic => !uplinksInVSwitch.includes(nic.Name)).flat()

  return {
    vSwitchInfo,
    nicInfo,
    uplinksNotInVSwitch
  }
}

async function createNDMVSwitch(hostInfo) {
  await exec(hostInfo, `esxcli network vswitch standard add -v vSwitchNDMTemp`)
}

async function addUplinksToNDMVSwitch(hostInfo, uplinksNotInVSwitch) {
  let addNICToVSwitchCommands = [
    ...uplinksNotInVSwitch.flatMap(nic => `esxcli network vswitch standard uplink add -u ${nic.Name} -v vSwitchNDMTemp`)
  ]
  await exec(hostInfo, addNICToVSwitchCommands.join('\n'))
}

async function getUplinkPortIDs(hostInfo, vSwitchName) {
  let commands = [
    `NDM_PORTIDS=""`,
    `for uplink in \`vsish -e ls /net/portsets/${vSwitchName}/uplinks\`; do`,
      `port=$(printf '%d' \`vsish -e cat /net/portsets/${vSwitchName}/uplinks/\${uplink}portID\`)`,
      `NDM_PORTIDS=\${NDM_PORTIDS:+\${NDM_PORTIDS},}\${uplink}:\${port}`,
    `done`,
    `echo -n \${NDM_PORTIDS}`
  ]

  return (await exec(hostInfo, commands.join('\n'))).stdout
}

async function enableLLDP(hostInfo, nicInfo) {
  let commands = [
    `esxcfg-vswitch -B both vSwitch0`,
    `esxcfg-vswitch -B both vSwitchNDMTemp`,
    ...nicInfo.map(nic => `vsish -e set /net/portsets/${nic.vSwitchName}/ports/${nic.portID}/lldp/enable 1`)
  ]

  return await exec(hostInfo, commands.join('\n'))
}

async function gatherLLDPInfoESX(hostInfo, nicInfo, logger=undefined) {
  const uplink = nicInfo.Name
  const portID = nicInfo.portID
  const vSwitchName = nicInfo.vSwitchName
  let commands = [
    `echo BEGIN ${uplink}`,
    `echo "NDM---LLDPNeighbor"`,
    `vsish -e cat /net/portsets/${vSwitchName}/ports/${portID}/lldp/rcache`,
    `echo "NDM---LLDPLocal"`,
    `vsish -e cat /net/portsets/${vSwitchName}/ports/${portID}/lldp/lcache`,
    `echo END ${uplink}`
  ]

  let output = await exec(hostInfo, commands.join('\n'), logger)
  const parsedOutput = output.stdout.matchAll(/(?:BEGIN (?<name>.*)\n)(?<data>.*)(?:END \1\n)/gs)
  const nics = Array.from(parsedOutput, nic => {
    let retVal = {
      name: uplink,
      lldp: {
        neighbor: [],
        local: []
      },
      info: {
        adminState: nicInfo.AdminStatus,
        linkState: nicInfo.LinkStatus,
        mac: nicInfo.MACAddress,
        pciDevice: nicInfo.PCIDevice,
        description: nicInfo.Description,
        speed: nicInfo.Speed
      }
    }
    let data = nic.groups.data.split(/(NDM---.*)\n/)
    while (data.length) {
      let el = data.shift()
      if (el.includes('NDM---')) {
        let key = el.replace('NDM---', '')
        let rawValue = data.shift().trim()
        if (key === 'LLDPNeighbor') {
          retVal.lldp.neighbor = parseTLVs(rawValue)
        } else if (key === 'LLDPLocal') {
          retVal.lldp.local = parseTLVs(rawValue)
        } else {
          retVal[key] = rawValue
        }
      }
    }
    return retVal
  })

  return nics
}

async function removeNDMVSwitch(hostInfo) {
  await exec(hostInfo, `esxcli network vswitch standard remove -v vSwitchNDMTemp`)
}

/*** TLV Parsing Code ***/
function parseTLVs(rawValue) {
  // See https://standards.ieee.org/ieee/802.1AB/6047/ for more info
  // Spec doc perma link:  https://ieeexplore.ieee.org/servlet/opac?punumber=7433913
  let parsedTLVs = []
  if (rawValue !== '<empty>') {
    let tlvs = rawValue.split('-').filter(s => s.length > 0).map(tlv => tlv.trim().split('\n'))
    parsedTLVs = tlvs.map(tlv => {
      let newTLV = []
      while (tlv.length) {
        let field = tlv.shift()
        if (field === 'data:') {
          newTLV.push(['data', tlv.splice(0).join(' ')])
        } else {
          newTLV.push(field.split(':').filter(e => e.length > 0).map(e => e.trim()))
        }
      }
      newTLV = Object.fromEntries(newTLV)
        if (newTLV.type === '1') {
          newTLV.name = 'Chassis ID'
          let tlvData = Buffer.from(newTLV.data.split(' '))
          if (tlvData.subarray(0,1).readInt8() === 4) {
            newTLV.value = parseMAC(tlvData.subarray(1))
          }
        }
        if (newTLV.type === '2') {
          newTLV.name = 'Port ID'
          newTLV.value = parsePortID(newTLV.data)
        }
        if (newTLV.type === '5') {
          newTLV.name = 'System Name'
          newTLV.value = Buffer.from(newTLV.data.split(' ')).toString('utf8')
        }
        if (newTLV.type === '8') {
          newTLV.name = 'Management Address'
          let tlvData = newTLV.data.split(' ')
          let lengthOfAddr = Buffer.from(tlvData.splice(0,1)).readInt8()
          let addrDetails = tlvData.splice(0,lengthOfAddr)
          if (parseInt(addrDetails[0].replace('0x', ''), 16) == 1) {
            newTLV.value = long2ip(Buffer.from(addrDetails.slice(1,lengthOfAddr)).readInt32BE())
          }
        }
        if (newTLV.type === '127') {
          if (newTLV.orgUI === '0x0 0x80 0xc2') {
            newTLV.orgName = 'IEEE'
            if (newTLV.orgType === '1') {
              newTLV.name = 'Port VLAN ID'
              newTLV.value = parseInt(newTLV.data.replaceAll('0x', '').replace(' ', ''), 16)
            }
          }
          if (newTLV.orgUI === '0x0 0x12 0xf') {
            newTLV.orgName = 'IEEE 802.3'
            if (newTLV.orgType === '4') {
              newTLV.name = 'Maximum Frame Size'
              newTLV.value = parseInt(newTLV.data.replaceAll('0x', '').replace(' ', ''), 16)
            }
            if (newTLV.orgType === '3') {
              newTLV.name = 'Link Aggregation'
              let value = newTLV.data.replaceAll('0x', '').split(' ')
              newTLV.value = {
                capable: value[0].padStart(2, '0')[1],
                status: value[0].padStart(2, '0')[0],
                portId: value.slice(1)
              }
              newTLV.value = parseInt(newTLV.data.replaceAll('0x', '').replace(' ', ''), 16)
            }
          }

      }
      return newTLV
    })
  }
  return parsedTLVs
}

function parseMAC(macBytes) {
  let macAddr = ''
  for (let byte of macBytes.values()) {
    macAddr += byte.toString(16).padStart(2, 0) + ':'
  }
  return macAddr.slice(0, -1)
}

function parsePortID(tlvDataRaw) {
  const tlvData = Buffer.from(tlvDataRaw.split(' '))
  const subType = tlvData.subarray(0,1).readInt8()
  let value = ''
  switch (subType) {
    case 3:
      value = parseMAC(tlvData.subarray(1))
      break;
    case 5:
    case 7:
      value = tlvData.toString('utf8', 1)
      break;
    default:
      value = ''
      break;
  }

  return value
}
