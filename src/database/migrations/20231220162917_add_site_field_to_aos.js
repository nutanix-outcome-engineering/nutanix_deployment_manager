/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('aos', table => {
    table.integer('site').unsigned()
    table.foreign('site').references('site.id')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('aos', table => {
    table.dropForeign('site')
    table.dropColumn('site')
  })
}
