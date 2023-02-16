/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.alterTable('ingestData', table => {
      table.string('ipmiGateway', 15)
      table.string('ipmiSubnet', 15)
      table.string('hostGateway', 15)
      table.string('hostSubnet', 15)
      table.string('cvmGateway', 15)
      table.string('cvmSubnet', 15)
    })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.alterTable('ingestData', table => {
      table.dropColumn('ipmiGateway')
      table.dropColumn('ipmiSubnet')
      table.dropColumn('hostGateway')
      table.dropColumn('hostSubnet')
      table.dropColumn('cvmGateway')
      table.dropColumn('cvmSubnet')
  })
}
