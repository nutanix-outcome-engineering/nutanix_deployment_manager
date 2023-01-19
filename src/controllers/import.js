
const busboy = require('busboy')
const { readData } = require('../lib/csv.js')
const  IngestData  = require('../models/IngestData.js');

module.exports = {

  csv: async (req, res) => {
    let nodesToIngest = req.files[0].csv
    await IngestData.massInsert(nodesToIngest)
    res.status(201).json({status: 'ingest queued'})
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
