const { parse } = require('csv-parse')

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
    if (r.record.Service_Tag) {
      records.push(cb(r))
    }
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

module.exports = {
  readData,
  readHeader
}
