const db = require('../database')
const  { IngestData, Node, TaskFlowFactory }  = require('../models');
const lodash = require('lodash')

module.exports = {
  ingesting: {
    getAll: async (req, res, next) => {
      let ingestingNodes = await IngestData.getAll()
      ingestingNodes = ingestingNodes.map(n => n.toJSON())
      //BUG: need better error handling here
      ingestingNodes = await Promise.all(ingestingNodes.map(async (node) => {
        let taskData = await TaskFlowFactory.getByID(node.ingestTaskUUID)
        if (taskData) {
          node.taskData = taskData.toJSON()
          delete node.ingestTaskUUID
          node.failureReason = node.taskData.failureReason
          node.nicInfo = node.taskData?.rawResults?.nics
        }
        return node
      }))

      res.json(ingestingNodes)
    },
    update: async (req, res, next) => {
      try {
        let id = req.params.id
        let ingestingNode = await IngestData.getByID(id)

        ingestingNode.ipmiIP = req.body?.ipmi?.ip
        ingestingNode.ipmiHostname = req.body?.ipmi?.hostname
        ingestingNode.ipmiGateway = req.body?.ipmi?.gateway
        ingestingNode.ipmiSubnet = req.body?.ipmi?.subnet

        ingestingNode.hostIP = req.body?.host?.ip
        ingestingNode.hostHostname = req.body?.host?.hostname
        ingestingNode.hostGateway = req.body?.host?.gateway
        ingestingNode.hostSubnet = req.body?.host?.subnet

        ingestingNode.cvmIP = req.body?.cvm?.ip
        ingestingNode.cvmHostname = req.body?.cvm?.hostname
        ingestingNode.cvmGateway = req.body?.cvm?.gateway
        ingestingNode.cvmSubnet = req.body?.cvm?.subnet

        await ingestingNode.update()
        res.json(ingestingNode.toJSON())
      } catch (err) {
        next(err)
      }
    },
    retry: async (req, res, next) => {
      let retryIds = []
      if (req.params.id) {
        retryIds.push(req.params.id)
      } else {
        retryIds = req.body.ingestionIDs
      }

      await IngestData.retryDiscovery(retryIds)

      res.status(204).send()
    }
  },
  nodes: {
    getAll: async(req, res, next) => {
      const nodes = await Node.getAll()

      res.json(nodes.map(n => n.toJSON()))
    },
    get: async(req, res, next) => {
      next({message: 'Not Implemented', status: 501})
    },
    add: async(req, res, next) => {
      let nodes = req.body.map(n => (new Node(n)).serialize())
      let removeFromIngestion = req.body.map(n => n.serial)

      // TODO: Follow scheme in cluster create of passing transaction around to Class function
      await db.transaction(async (tr) => {
        await db(Node.dbTable).insert(nodes).transacting(tr)
        await db(IngestData.dbTable).whereIn('serial', removeFromIngestion).del().transacting(tr)
      })

      res.status(201).send()
    },
    update: async(req, res, next) => {
      try {
        let node = await Node.getBySerial(req.params.serial)
        //BUG: This doesn't work as expected if you are wanting to do a PATCH; it behaves more like a PUT. Basically value is overwritten if left out.
        // Would probably be a good idea to create a generic class method that would handle this for re-usability
        node.ipmiIP = req.body?.ipmi?.ip
        node.ipmiHostname = req.body?.ipmi?.hostname
        node.ipmiGateway = req.body?.ipmi?.gateway
        node.ipmiSubnet = req.body?.ipmi?.subnet

        node.hostIP = req.body?.host?.ip
        node.hostHostname = req.body?.host?.hostname
        node.hostGateway = req.body?.host?.gateway
        node.hostSubnet = req.body?.host?.subnet

        node.cvmIP = req.body?.cvm?.ip
        node.cvmHostname = req.body?.cvm?.hostname
        node.cvmGateway = req.body?.cvm?.gateway
        node.cvmSubnet = req.body?.cvm?.subnet

        await node.update()
        res.json(node.toJSON())
      } catch (err) {
        next(err)
      }
    }
  }
}
