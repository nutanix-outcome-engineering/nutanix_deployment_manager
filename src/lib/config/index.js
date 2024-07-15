'use strict'


const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const flat = require('flat')

dotenv.config({path: path.resolve(__dirname, '../../.env')})

const config = {
  secret: process.env.NDM_SECRET,
  cipher: process.env.NDM_CIPHER || 'aes-256-gcm',
  env_prefix: process.env.NDM_ENV_PREFIX || 'prod',
  logging: {
    use_console_logging: Boolean(process.env.NDM_LOGGING_USE_CONSOLE_LOGGING === 'true'),
    use_JSONL_logging: Boolean(process.env.NDM_LOGGING_USE_JSON_LOGGING === 'true'),
    level: process.env.NDM_LOGGING_LEVEL || "debug"
  },
  mysql: {
    host: process.env.NDM_MYSQL_HOST || "localhost",
    user: process.env.NDM_MYSQL_USER || "root",
    password: process.env.NDM_MYSQL_PASSWORD,
    database: process.env.NDM_MYSQL_DATABASE,
    port: Number(process.env.NDM_MYSQL_PORT) || 3306
  },
  redis: {
    host: process.env.NDM_REDIS_HOST || "localhost",
    port: Number(process.env.NDM_REDIS_PORT) || 6379,
    db: Number(process.env.NDM_REDIS_DB) || 2,
    pass: process.env.NDM_REDIS_PASS,
  },
  server: {
    name: process.env.NDM_SERVER_NAME,
    port: process.env.NDM_SERVER_PORT,
    key: process.env.NDM_SERVER_KEY,
    cert: process.env.NDM_SERVER_CERT,
    cookie: process.env.NDM_SERVER_COOKIE
  },
  filestore: {
    local: process.env.NDM_FILESTORE_LOCAL ? Boolean(process.env.NDM_FILESTORE_LOCAL === 'true') : true,
    tusBase: process.env.NDM_FILESTORE_TUS_BASE || 'files',
    baseDirectory: process.env.NDM_FILESTORE_BASE_DIRECTORY || 'files',
    exportDirectory: process.env.NDM_FILESTORE_EXPORT_DIRECTORY || 'exports'
  },
  ssh: {
    private: process.env.NDM_SSH_PRIVATE,
    public: process.env.NDM_SSH_PUBLIC
  },
  nfsServer: process.env.NDM_NFS_SERVER || 'localhost',
  fvm_ip: process.env.NDM_FVM_IP
}

// Skip this check if set. Currently only set during CI/CD Pipeline
if (process.env.NDM_SKIP_UNSET_CHECK != 'true') {
  // Prevent startup if any required config variables are `undefined`.
  const undefinedVariables = Object.entries(flat(config)).filter(([key, value]) => value === undefined)

  if (undefinedVariables.length) {
    console.error(`The following config variables are not defined:\n\n${undefinedVariables.map(([key, value]) => `  ${key} - ENV VAR: NDM_${key.toUpperCase().replace('.', '_')}`).join('\n')}\n`)
    console.error(`Set them in your environment or in the .env in ${path.resolve(__dirname, '../../.env')}`)
    process.exit(1)
  }
}

module.exports = config
