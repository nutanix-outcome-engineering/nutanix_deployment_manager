

export const cellTypes = {
  ip: {
    baseDataType: 'text',
    extendsDataType: 'text'

  },
  subnetMask: {
    baseDataType: 'text',
    extendsDataType: 'ip',
  },
  gateway: {
    baseDataType: 'text',
    extendsDataType: 'ip'
  },
  hostname: {
    baseDataType: 'text',
    extendsDataType: 'text'
  }
}
