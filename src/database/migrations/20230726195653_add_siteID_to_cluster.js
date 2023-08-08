/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.integer('siteID').unsigned()

    table.foreign('siteID').references('site.id')
      .onDelete('RESTRICT').onUpdate('CASCADE')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropForeign('siteID')
    table.dropColumn('siteID')
  })
}
