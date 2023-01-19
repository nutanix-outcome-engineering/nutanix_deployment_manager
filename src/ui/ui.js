'use strict'

const express = require('express')
const http = require('http')

const config = require(`../lib/config`)
const { registerAPIHandlers } = require('./api')

const app = express()

registerAPIHandlers(app)

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message
  })
})


http.createServer(app).listen(config.server.port)
console.log(`Http Server Setup on Port: ${config.server.port}.`)
