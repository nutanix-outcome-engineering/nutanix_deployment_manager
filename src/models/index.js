module.exports = {
  IngestData: require('./IngestData.js'),
  Node: require('./Node.js'),
  Site: require('./Site.js'),
  Cluster: require('./Cluster.js'),
  Rack: require('./Rack.js'),
  Switch: require('./Switch.js'),
  PrismCentral: require('./PrismCentral.js'),
  vCenter: require('./vCenter.js'),
  AOS: require('./AOS.js'),
  Hypervisor: require('./Hypervisor.js'),
  Foundation: require('./Foundation.js'),
  ...require('./Task')
}
