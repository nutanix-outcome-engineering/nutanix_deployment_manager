module.exports = {
  ...require('./TaskFlowBase'),
  ...require('./DiscoveryTaskFlow'),
  ...require('./UploadFileTaskFlow'),
  ...require('./ClusterBuildTaskFlow')
}
