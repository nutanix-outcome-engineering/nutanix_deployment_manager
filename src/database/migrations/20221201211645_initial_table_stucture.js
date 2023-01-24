/** @typedef {import('knex/types').Knex} Knex */

const { type } = require('os')

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
    return knex.schema.createTable('ingestData', table => {
        table.increments('id').primary()
        table.string('ingestState', 50)
        table.json('failureReason', 50)
        table.string('serial', 25).nullable().unique()
        table.string('chassisSerial', 25)
        table.string('ipmiIP', 15).unique()
        table.string('ipmiHostname', 50)
        table.string('ipmiD', 50)
        table.string('hostIP', 15)
        table.string('hostHostname', 50)
        table.string('cvmIP', 15)
        table.string('cvmHostname', 50)
        table.string('clusterVIP', 15)
        table.string('clusterHostname', 50)
        table.json('rawCSVAsJSON', 50)
      })

      .createTable('site', table => {
        table.increments('id').primary()
        table.string('name', 50)
        table.integer('infraCluster')
      })

      .createTable('rack', table => {
        table.increments('id').primary()
        table.integer('siteID').unsigned()
        table.string('row', 50)
        table.string('column', 50)
        table.string('datahall', 50)
        table.string('name', 50).defaultTo(knex.raw('CONCAT(`row`, `column`)'))

        table.foreign('siteID').references('site.id')
          .onDelete('RESTRICT').onUpdate('CASCADE')
      })

      .createTable('switch', table => {
        table.increments('id').primary()
        table.enum('type', ['ipmi', 'tor'])
        table.string('ip', 15)
        table.string('name', 50)
        table.integer('rackID').unsigned()
        table.integer('rackUnit')

        table.foreign('rackID').references('rack.id')
          .onDelete('RESTRICT').onUpdate('CASCADE')
      })

      .createTable('hypervisor', table => {
        table.increments('id').primary()
        table.string('name', 50)
        table.string('version', 50)
        table.string('type', 50)
        table.string('filename', 50)
        table.datetime('createdDate')
        table.datetime('lastModified')
      })

      .createTable('aos', table => {
        table.increments('id').primary()
        table.string('name', 50)
        table.string('version', 50)
        table.string('filename', 50)
        table.datetime('createdDate')
        table.datetime('lastModified')
      })

      .createTable('cluster', table => {
        table.increments('id').primary()
        table.string('name', 50)
        table.enum('type', ['infrastructure', 'workload'])
        table.string('clusterVIP', 15)
        table.string('clusterGateway', 15)
        table.string('clusterSubnet', 15)
        table.string('clusterHostname', 50)
        table.string('pcVIP', 15)
        table.string('pcGateway', 15)
        table.string('pcSubnet', 15)
        table.string('pcHostname', 50)
        table.string('vCenterVIP', 15)
        table.string('vCenterGateway', 15)
        table.string('vCenterSubnet', 15)
        table.string('vCenterHostname', 50)
        table.string('dataservicesVIP', 15)
        table.text('hostProfile', 'longtext')
        table.integer('hypervisor').unsigned()
        table.integer('aos').unsigned()
        table.datetime('ingestDate')
        table.datetime('lastModified')

        table.foreign('hypervisor').references('hypervisor.id')
          .onDelete('SET NULL').onUpdate('CASCADE')
        table.foreign('aos').references('aos.id')
          .onDelete('SET NULL').onUpdate('CASCADE')
      })

      .createTable('node', table => {
        table.string('serial', 25).primary()
        table.string('chassisSerial', 25)
        table.string('ipmiIP', 15)
        table.string('ipmiGateway', 15)
        table.string('ipmiSubnet', 15)
        table.string('ipmiHostname', 50)
        table.string('hostIP', 15)
        table.string('hostGateway', 15)
        table.string('hostSubnet', 15)
        table.string('hostHostname', 50)
        table.string('cvmIP', 15)
        table.string('cvmGateway', 15)
        table.string('cvmSubnet', 15)
        table.string('cvmHostname', 50)
        table.integer('clusterID').unsigned()
        table.integer('rackID').unsigned()
        table.integer('rackUnit')
        table.datetime('ingestDate')
        table.datetime('lastModified')

        table.foreign('clusterID').references('cluster.id')
          .onDelete('SET NULL').onUpdate('CASCADE')
        table.foreign('rackID').references('rack.id')
          .onDelete('RESTRICT').onUpdate('CASCADE')
      })

      .createTable('ntnxConfig', table => {
        table.increments('id').primary()
        table.string('type', 50)
        table.json('config')
      })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('switch')
    .dropTableIfExists('node')
    .dropTableIfExists('cluster')
    .dropTableIfExists('hypervisor')
    .dropTableIfExists('aos')
    .dropTableIfExists('rack')
    .dropTableIfExists('site')
    .dropTableIfExists('ntnxConfig')
    .dropTableIfExists('ingestData')
}
