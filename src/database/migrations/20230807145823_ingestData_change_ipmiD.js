/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.alterTable('ingestData', async table => {
    table.text('ipmiD').alter()
    table.renameColumn('ipmiD', 'credentials')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.alterTable('ingestData', async table => {
    table.string('credentials', 50).alter()
    table.renameColumn('credentials', 'ipmiD')
  })
}
