let TaskFlow = require('./TaskFlow')
const { Graph } = require('graphology')
const db = require('../../database')


function fromDB(record) {
  let graphData = JSON.parse(record.graph)
  const graph = new Graph(graphData.options)
  graph.import(graphData)

  let taskFlow = new TaskFlow[record.type](graph, record.id, null)
  taskFlow = taskFlow.fromRecord(record)
  return taskFlow
}


async function query(callback = async knex => knex) {
  const query = db('taskFlow')

  await callback(query)

  const records = await query

  return records.map(fromDB)
}

async function getAllNotFinished(type) {
  const builder = query(q => {
    q.whereNotIn('status', ['complete', 'failed'])
    if (type) {
      q.andWhere({type: type})
    }
    return q
  })

  return await builder
}
async function getByID(id) {
  const builder = query(q => {
    q.where({id: id})
    return q
  })

  return (await builder)[0]
}
async function getLatestByTypeAndRef(type, ref) {
  const builder = query(q => {
    q.where({type: type})
    .andWhere('ref', 'LIKE', `%${ref}`)
    .orderBy('startDate', 'DESC')
    .limit(1)
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
  getByID,
  getLatestByTypeAndRef
}
