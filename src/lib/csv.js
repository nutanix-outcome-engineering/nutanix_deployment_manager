const { parse } = require('csv-parse')
const  IngestData  = require('../models/IngestData.js');

async function readData(csv, headers, cb=()=>{}) {
  const parser = parse({
    columns: headers || true,
    raw: true,
    from: headers ? 2 : 1,
    skip_records_with_empty_values: true,
    skip_empty_lines: true,
    relax_column_count: true
  })

  let records = []
  for await (const r of csv.pipe(parser)) {
    records.push(cb(r))
  }

  return records
}


async function readHeader(csv) {
  let header
  for await (const record of csv.pipe(parse({to: 1}))) {
    header = record
  }
  return header
};

class MulterCSVStorage {
  async _handleFile(req, file, cb) {
    let headers, ingest
    try {
      headers = JSON.parse(req.body.headers)
      ingest = await readData(file.stream, headers, (data) => {
        let id = IngestData.fromCSVRecord(data);
        return id
      })
    } catch (error) {
      cb(error)
    }

    cb(null, {
      csv: ingest,
    })
  }

  _removeFile(req, file, cb) {
    return true
  }
}

module.exports = {
  readData,
  readHeader,
  MulterCSVStorage
}
