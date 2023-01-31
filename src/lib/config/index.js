'use strict'


const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const flat = require('flat')

dotenv.config({path: path.resolve(__dirname, '../../.env')})

const config = {
  secret: process.env.RX_SECRET,
  env_prefix: process.env.RX_ENV_PREFIX || 'prod',
  logging: {
    use_console_logging: Boolean(process.env.RX_LOGGING_USE_CONSOLE_LOGGING === 'true'),
    use_JSONL_logging: Boolean(process.env.RX_LOGGING_USE_JSON_LOGGING === 'true'),
    level: process.env.RX_LOGGING_LEVEL || "debug"
  },
  mysql: {
    host: process.env.RX_MYSQL_HOST || "localhost",
    user: process.env.RX_MYSQL_USER || "root",
    password: process.env.RX_MYSQL_PASSWORD,
    database: process.env.RX_MYSQL_DATABASE,
    port: Number(process.env.RX_MYSQL_PORT) || 3306
  },
  redis: {
    host: process.env.RX_REDIS_HOST || "localhost",
    port: Number(process.env.RX_REDIS_PORT) || 6379,
    db: Number(process.env.RX_REDIS_DB) || 2,
    pass: process.env.RX_REDIS_PASS
  },
  server: {
    port: 8080
  }
}

// Prevent startup if any required config variables are `undefined`.
const undefinedVariables = Object.entries(flat(config)).filter(([key, value]) => value === undefined)

if (undefinedVariables.length) {
  console.error(`The following config variables are not defined:\n\n${undefinedVariables.map(([key, value]) => `  ${key} - ENV VAR: RX_${key.toUpperCase().replace('.', '_')}`).join('\n')}\n`)
  console.error(`Set them in your environment or in the .env in ${path.resolve(__dirname, '../../.env')}`)
  process.exit(1)
}

module.exports = config
