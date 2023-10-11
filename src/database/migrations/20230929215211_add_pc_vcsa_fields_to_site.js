/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('site', table => {
    table.json('pcServers').defaultTo([])
    table.json('vCenterServers').defaultTo([])
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('site', table => {
    table.dropColumns(['pcServers', 'vCenterServers'])
  })
}
