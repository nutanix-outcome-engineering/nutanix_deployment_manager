let db = require('../database')

const TABLE = 'ingestData'

class IngestData {
  constructor(ingestData) {
    this.serial = ingestData.serial
    this.chassisSerial = ingestData.chassisSerial

    this.ipmiIP = ingestData.ipmiIP
    this.ipmiHostname = ingestData.ipmiIP
    this.ipmiCreds = ingestData.ipmiD

    this.hostIP = ingestData.hostIP
    this.hostHostname = ingestData.hostHostname

    this.cvmIP = ingestData.cvmIP
    this.cvmHostname = ingestData.cvmHostname
    this.clusterVIP = ingestData.clusterVIP
    this.clusterHostname = ingestData.clusterHostname

    this.ingestState = ingestData.ingestState
    this.failureReason = ingestData.failureReason

    this.rawCSVAsJson = ingestData

    /** @private */
    this._record = null
  }

  static fromCSVRecord(ingestData) {
    let record = ingestData.record
    record.ingestState = 'pending'
    record.failureReason = null

    return new IngestData(record)
  }

  static fromDB(record) {
    let ingestData = new IngestData(record)
    ingestData._record = record

    return ingestData
  }

  static async massInsert(data, chunkSize=100) {
     let serialized = data.map(record => {
      return record.serialize()
    })
    return await db.batchInsert(TABLE, serialized, chunkSize)
  }

  serialize() {
    return {
      serial: this.serial,
      chassisSerial: this.chassisSerial,

      ipmiIP: this.ipmiIP,
      ipmiHostname: this.ipmiIP,
      ipmiD: this.ipmiCreds,

      hostIP: this.hostIP,
      hostHostname: this.hostHostname,

      cvmIP: this.cvmIP,
      cvmHostname: this.cvmHostname,
      clusterVIP: this.clusterVIP,
      clusterHostname: this.clusterHostname,

      ingestState: this.ingestState,
      failureReason: this.failureReason,

      rawCSVAsJson: this.rawCSVAsJson
    }
  }

  async create() {
    return await db.table(TABLE).insert({
      serial: this.serial,
      rawCSVAsJson: JSON.stringify(this.rawCSVAsJson)
    })
  }
}

module.exports = IngestData
