const db = require('../database')
const  { IngestData, Node, TaskFlow }  = require('../models');

module.exports = {
  ingesting: async (req, res, next) => {
    let ingestingNodes = await IngestData.getAll()
    ingestingNodes = ingestingNodes.map(n => n.toJSON())
    ingestingNodes = await Promise.all(ingestingNodes.map(async (node) => {
      node.taskData = (await TaskFlow.getByID(node.ingestTaskUUID)).toJSON()
      delete node.ingestTaskUUID
      return node
    }))

    res.json(ingestingNodes)
  },
  nodes: {
    getAll: async(req, res, next) => {
      const nodes = await Node.getAll()

      res.json(nodes.map(n => n.toJSON()))
      // res.json([{"serial":"87JCZB3","chassisSerial":null,"ipmiIP":"10.38.43.33","ipmiHostname":null,"ipmiD":null,"hostIP":null,"hostHostname":null,"cvmIP":"1","cvmHostname":null},{"serial":"87JFZB3","chassisSerial":null,"ipmiIP":"10.38.43.34","ipmiHostname":null,"ipmiD":null,"hostIP":null,"hostHostname":null,"cvmIP":"1","cvmHostname":null},{"serial":"87JDZB3","chassisSerial":null,"ipmiIP":"10.38.43.35","ipmiHostname":null,"ipmiD":null,"hostIP":null,"hostHostname":null,"cvmIP":"1","cvmHostname":null},{"serial":"87JGZB3","chassisSerial":null,"ipmiIP":"10.38.43.36","ipmiHostname":null,"ipmiD":null,"hostIP":null,"hostHostname":null,"cvmIP":"1","cvmHostname":null}])
    },
    get: async(req, res, next) => {
      next({message: 'Not Implemented', status: 501})
    },
    add: async(req, res, next) => {
      let nodes = req.body.map(n => (new Node(n)).serialize())
      let removeFromIngestion = req.body.map(n => n.serial)

      await db.transaction(async (tr) => {
        await db(Node.dbTable).insert(nodes).transacting(tr)
        await db(IngestData.dbTable).whereIn('serial', removeFromIngestion).del().transacting(tr)
      })

      res.status(201).send()
    },
  }
}
