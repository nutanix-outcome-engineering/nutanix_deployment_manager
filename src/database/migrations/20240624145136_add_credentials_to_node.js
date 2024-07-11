/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('node', table => {
    table.text('ipmiCredentials').after('ipmiHostname')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('node', table => {
    table.dropColumn('ipmiCredentials')
  })
}
