/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable('user', table => {
    table.increments('id').primary()
    table.string('username', 25).unique().notNullable()
    table.string('password').notNullable()
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('user')
}
