const db = require('../database')
const  { Node, Cluster, ClusterBuildTaskFlow }  = require('../models')
const { general } = require('../lib/workers.js')
const log = require('../lib/logger')

module.exports = {
  getAll: async (req, res, next) => {
    const clusters = await Cluster.getAll(true)

    const response = clusters.map(cluster => cluster.toJSON())
    res.json(response)
  },
  create: async (req, res, next) => {
    // Only use transaction if there are nodes in the body
    let transaction = await db.transaction()
    let cluster = new Cluster(req.body)
    try {
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

      try {
        const clusterBuildFlow = new ClusterBuildTaskFlow(null, null, {cluster: {id: cluster.id}})
        await clusterBuildFlow.create()
        const jobTree = await general.flowProducer.add(clusterBuildFlow.generateJobsForQueue(general.queue.name))
        clusterBuildFlow.addJobIdsToTasks(jobTree)
        await clusterBuildFlow.update()
      } catch (err) {
        log.error(`Error trying to initiate cluster build ${err}`)
        next(err)
      }
    } catch (err) {
      log.error(`Error trying to create cluster ${err}`)
      transaction.rollback()
      next(err)
    }
    try {
      cluster = await Cluster.getById(cluster.id, true)

      res.status(201).json(cluster.toJSON())
    } catch (error) {
      log.error(`Error trying to fetch cluster ${error}`)
      next(error)
    }
  },
  delete: async (req, res, next) => {
    let transaction = await db.transaction()
    let cluster = await Cluster.getById(req.params.id)
    try {
      await Promise.all(cluster.nodes.map(node => {
        node.clusterID = null
        return node.update(transaction)
      }))
      await cluster.delete()
      await transaction.commit()

    } catch (error) {
      log.error(`Error trying to delete cluster ${cluster.name} with id ${req.params.id} ${err}`)
      await transaction.rollback()
      next(`Error trying to delete cluster ${cluster.name}`)
    }

    res.status(204).send()
  },
  rebuild: async (req, res, next) => {
    let transaction = await db.transaction()
    let cluster = await Cluster.getById(req.params.id)

    try {
      const clusterBuildFlow = new ClusterBuildTaskFlow(null, null, {cluster: {id: cluster.id}})
      await clusterBuildFlow.create()
      const jobTree = await general.flowProducer.add(clusterBuildFlow.generateJobsForQueue(general.queue.name))
      clusterBuildFlow.addJobIdsToTasks(jobTree)
      await clusterBuildFlow.update()
    } catch (error) {
      log.error(`Error trying to rebuild cluster ${cluster.name} with id ${req.params.id} ${error}`)
      await transaction.rollback()
      next(`Error trying to rebuild cluster ${cluster.name}`)
    }

    res.status(201).send()
  },
}
