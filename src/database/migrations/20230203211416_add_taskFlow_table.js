/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable('taskFlow', table => {
    table.string('id', 50).primary()
    table.string('status', 50).nullable().defaultTo(null)
    table.string('type', 50).notNullable().defaultTo('Basic')
    table.json('graph')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('taskFlow')
}
