/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('user', table => {
    table.boolean('changePass').defaultTo(true)
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('user', table => {
    table.dropColumn('changePass')
  })
}
