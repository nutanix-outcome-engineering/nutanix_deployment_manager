/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.alterTable('site', table => {
    table.json('ntpServers', 45)
    table.json('dnsServers', 45)
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.alterTable('site', table => {
    table.dropColumn('ntpServers')
    table.dropColumn('dnsServers')
})
}
