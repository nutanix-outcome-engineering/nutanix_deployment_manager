/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.alterTable('ingestData', table => {
    table.string('ipv6Address', 30).after('chassisSerial')
    table.string('model', 15).after('ipv6Address')
    table.string('position', 1).after('model')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.alterTable('ingestData', table => {
    table.dropColumn('ipv6Address')
    table.dropColumn('model')
    table.dropColumn('position')
})
}
