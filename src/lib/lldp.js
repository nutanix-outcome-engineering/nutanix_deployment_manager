const { exec } = require('./ssh.js')
const { long2ip } = require('netmask')

module.exports = {
  fetchLLDPESXi
}

async function fetchLLDPESXi({host, username, password}, logger=undefined) {
  let commands = [
    `esxcfg-vswitch -B both vSwitch0`,
    `for uplink in \`vsish -e ls /net/portsets/vSwitch0/uplinks\`; do`,
      `echo BEGIN \${uplink}`,
      `port=$(printf '%d' \`vsish -e cat /net/portsets/vSwitch0/uplinks/\${uplink}portID\`)`,
      `vsish -e set /net/portsets/vSwitch0/ports/\${port}/lldp/enable 1`,
      `sleep 10`,
      `echo "NDM---NICStatus"`,
      `vsish -e cat /net/portsets/vSwitch0/ports/\${port}/status | awk '/Physical NIC|fixed Hw Id|clientName/ { print $0 }'`,
      `vsish -e cat /net/pNics/\${uplink}linkStatus | awk '/link status:/ { print "   Link State: "$5 }'`,
      `echo "NDM---LLDPNeighbor"`,
      `vsish -e cat /net/portsets/vSwitch0/ports/\${port}/lldp/rcache`,
      `echo "NDM---LLDPLocal"`,
      `vsish -e cat /net/portsets/vSwitch0/ports/\${port}/lldp/lcache`,
      `echo END \${uplink}`,
    `done`
  ]

  let output = await exec({
    username: username,
    password: password,
    host: host
  }, commands.join('\n'), logger)

  const parsedOutput = output.stdout.matchAll(/(?:BEGIN (?<name>.*)\/\n)(?<data>.*)(?:END \1\/\n)/gs)
  const nics = Array.from(parsedOutput, nic => {
    let retVal = {
      name: nic.groups.name,
      lldp: {
        neighbor: [],
        local: []
      }
    }
    let data = nic.groups.data.split(/(NDM---.*)\n/)
    while (data.length) {
      let el = data.shift()
      if (el.includes('NDM---')) {
        let key = el.replace('NDM---', '')
        let rawValue = data.shift().trim()
        if (key === 'NICStatus') {
          retVal.NICStatus = Object.fromEntries(rawValue.split('\n').filter(s => s.length > 0).map(s => s.trim().split(/:(.*)/).map(e => e.trim())))
        } else if (key === 'LLDPNeighbor') {
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

function parseMAC(macBytes) {
  let macAddr = ''
  for (let byte of macBytes.values()) {
    macAddr += byte.toString(16).padStart(2, 0) + ':'
  }
  return macAddr.slice(0, -1)
}

// See https://standards.ieee.org/ieee/802.1AB/6047/ for more info
// Spec doc perma link:  https://ieeexplore.ieee.org/servlet/opac?punumber=7433913
function parseTLVs(rawValue) {
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
          let tlvData = Buffer.from(newTLV.data.split(' '))
          if (tlvData.subarray(0,1).readInt8() === 5) {
            newTLV.value = tlvData.toString('utf8', 1)
          }
          if (tlvData.subarray(0,1).readInt8() === 3) {
            newTLV.value = parseMAC(tlvData.subarray(1))
          }
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
