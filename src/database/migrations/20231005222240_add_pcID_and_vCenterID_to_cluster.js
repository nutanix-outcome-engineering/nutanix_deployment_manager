/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.integer('pcID').unsigned().after('clusterHostname').defaultTo(null)
    table.integer('vCenterID').unsigned().after('pcHostname').defaultTo(null)
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropColumn('pcID')
    table.dropColumn('vCenterID')
  })
}
