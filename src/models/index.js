module.exports = {
  IngestData: require('./IngestData.js'),
  Node: require('./Node.js'),
  Site: require('./Site.js'),
  Cluster: require('./Cluster.js'),
  Rack: require('./Rack.js'),
  Switch: require('./Switch.js'),
  ...require('./Task')
}
