'use strict'

const express = require('express')
const http = require('http')

const config = require(`../lib/config`)
const { registerAPIHandlers } = require('./api')

const path = require('path')
const app = express()

// Register body parser middlewares
app.use(express.json())

/** Register API routes and eov middleware */
registerAPIHandlers(app)

/** Register UI Bundle Routes */
app.use('/assets', express.static(path.resolve(__dirname,'frontend/dist/assets')))
app.use('/', express.static(path.resolve(__dirname,'frontend/dist')))
console.log(path.resolve(__dirname,'frontend/dist'))
app.use('/*', express.static(path.resolve(__dirname, 'frontend/dist'), {
  maxAge: '2h',
  setHeaders: (res, path) => {
      if (express.static.mime.lookup(path) === 'text/html') {
          res.setHeader('Cache-Control', 'no-store')
      }
  }
}))

/** Register default error handler */
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message
  })
})


http.createServer(app).listen(config.server.port)
console.log(`Http Server Setup on Port: ${config.server.port}.`)
