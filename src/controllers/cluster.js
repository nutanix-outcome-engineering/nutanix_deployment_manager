const db = require('../database')
const  { Node, Cluster}  = require('../models');

module.exports = {
  getAll: async (req, res, next) => {
    const clusters = await Cluster.getAll(true)

    const response = clusters.map(cluster => cluster.toJSON())
    res.json(response)
  },
  create: async (req, res, next) => {
    let cluster = new Cluster(req.body)

    // Only use transaction if there are nodes in the body
    let transaction = await db.transaction()


    cluster = await cluster.create(transaction)
    if (req.body.nodes.length > 0) {
      let nodesInCluster = await Promise.all(req.body.nodes.map(node => {
        return Node.getBySerial(node.serial)
      }))
      await Promise.all(nodesInCluster.map(node => {
        node.clusterID = cluster.id
        return node.update(transaction)
      }))
    }
    await transaction.commit()
    cluster = await Cluster.getById(cluster.id, true)

    res.status(201).json(cluster.toJSON())
  }
}
