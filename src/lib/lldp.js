const { exec } = require('./ssh.js')
const csv = require('./csv.js')
const { long2ip } = require('netmask')

module.exports = {
  fetchLLDPESXi
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
    await addUplinksToVSwitch(hostInfo, vSwitchConfig.uplinksNotInVSwitch)
  }

  let uplinkIDs = (await getUplinkPortIDs(hostInfo, 'vSwitch0')).split(',')
  let uplinkIDsTemp = (await getUplinkPortIDs(hostInfo, 'vSwitchNDMTemp')).split(',')

  nicInfo.forEach(nic => {
    let portIDInfo = uplinkIDs.find(uplink => uplink.includes(nic.Name))
    if (portIDInfo) {
      nic.vSwitchName = 'vSwitch0'
    } else {
      portIDInfo = uplinkIDsTemp.find(uplink => uplink.includes(nic.Name))
      nic.vSwitchName = 'vSwitchNDMTemp'
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

async function addUplinksToVSwitch(hostInfo, uplinksNotInVSwitch) {
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
