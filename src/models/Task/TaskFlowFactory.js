let TaskFlow = require('./TaskFlow')
const { Graph } = require('graphology')
const db = require('../../database')


function fromDB(record) {
  let graphData = JSON.parse(record.graph)
  const graph = new Graph(graphData.options)
  graph.import(graphData)

  const taskFlow = new TaskFlow[record.type](graph, record.id, null)
  taskFlow._record = record
  taskFlow.status = record.status
  taskFlow.type = record.type
  return taskFlow
}


async function query(callback = async knex => knex) {
  const query = db('taskFlow')

  await callback(query)

  const records = await query

  return records.map(fromDB)
}

async function getAllNotFinished() {
  const builder = query(q => {
    q.whereNotIn('status', ['complete', 'failed'])
    return q
  })

  return await builder
}
async function getByID(id) {
  const builder = this.query(q => {
    q.where({id: id})
    return q
  })

  return (await builder)[0]
}

// function fromJSONDefinition(definition) {
//   const graph = this.graphFromJSONDefinition(definition)
//   return new TaskFlow(graph)
// }

module.exports = {
  getAllNotFinished,
  getByID
}
