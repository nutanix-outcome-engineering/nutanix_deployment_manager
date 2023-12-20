const { uploadsServer } = require('../lib/tus.js')


module.exports = {
  create: uploadsServer.handle.bind(uploadsServer),
  options: uploadsServer.handle.bind(uploadsServer),
  patch: uploadsServer.handle.bind(uploadsServer),
  head: uploadsServer.handle.bind(uploadsServer),
  delete: uploadsServer.handle.bind(uploadsServer),
}
