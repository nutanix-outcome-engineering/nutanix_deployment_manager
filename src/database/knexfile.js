const config = require('../lib/config')

exports.development = exports.staging = exports.production = exports.test = {
  client: 'mysql2',
  connection: {
    host: config.mysql.host,
    database: config.mysql.database,
    user: config.mysql.user,
    password: config.mysql.password,
    port: config.mysql.port,
    multipleStatements: true,
    supportBigNumbers: true,
    timezone: 'Z'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
    stub: './migrations/template.stub'
  },
  seeds: {
    directory: './seeds'
  }
}
