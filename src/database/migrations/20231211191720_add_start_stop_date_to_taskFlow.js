/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('taskFlow', table => {
    table.datetime('startDate')
    table.datetime('stopDate')
    table.string('ref')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('taskFlow', table => {
    table.dropColumn(['startDate', 'stopDate', 'ref'])
  })
}
