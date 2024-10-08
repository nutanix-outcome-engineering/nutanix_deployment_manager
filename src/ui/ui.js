'use strict'

const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const https = require('https')
const fs = require('fs')
const cors = require('cors')

const passport = require('../lib/passport.js')
const config = require(`../lib/config`)
const { registerAPIHandlers } = require('./api')
const log = require('../lib/logger.js')


const path = require('path')
const app = express()

// const allowedOrigins = [
//   'http://localhost:8080',
//   'http://localhost:5173'
// ]
// app.use(cors({
//   origin: (origin, callback) => {
//       /**
//        * Undefined origin means SAMEORIGIN.
//        * See: https://github.com/expressjs/cors/issues/118
//        */
//       if (origin === undefined || allowedOrigins.includes(origin)) {
//           callback(null, true)
//       } else {
//           callback(new Error(`${origin} not allowed by CORS`))
//       }
//   },
//   credentials: true,
// }))

// Register body parser middlewares
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: false}))

const Redis = require('ioredis')
const RedisStore = require('connect-redis')(session)

app.use(
  session({
    store: new RedisStore({
      client: new Redis({
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
        keyPrefix: 'uiSession',
        password: config.redis.pass,
        reconnectOnError: true
      })
    }),
    secret: config.server.cookie,
    name: 'connect.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true
    }
  })
)

passport(app)

app.get('/permissions', (req,res,next) => {
  if (req.isAuthenticated()) {res.status(200).send({})}
  else {res.status(401).send({})}
})

/** Register API routes and eov middleware */
registerAPIHandlers(app)

/** Register UI Bundle Routes */
app.use('/assets', express.static(path.resolve(__dirname,'frontend/dist/assets')))
app.use('/', express.static(path.resolve(__dirname,'frontend/dist')))
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
  log.error(`Error in API: ${err.message}. ${err}`)
  log.debug(`Stack Trace: ${err.stack}`)
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors || []
  })
})

// CONFIGURE AND START WEB SERVER
let options = {
  key: fs.readFileSync(`${path.resolve(process.cwd(), config.server.key)}`),
  cert: fs.readFileSync(`${path.resolve(process.cwd(), config.server.cert)}`),
  minVersion: 'TLSv1.2'
}

https.createServer(options, app).listen(config.server.port)
log.info(`Server Setup on Port: ${config.server.port}.`)
