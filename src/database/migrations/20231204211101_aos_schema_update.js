/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropForeign('aos')
  })
  .table('aos', table => {
    table.string('id').alter()
    table.renameColumn('id', 'uuid')
    table.string('status').after('filename')
    table.string('transferStatus')
  })
  .table('cluster', table => {
    table.string('aos').alter()
    table.foreign('aos').references('aos.uuid')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropForeign('aos')
  })
  .table('aos', table => {
    table.integer('uuid').unsigned().alter()
    table.renameColumn('uuid', 'id')
    table.dropColumn('status')
    table.dropColumn('transferStatus')
  })
  .table('cluster', table => {
    table.integer('aos').unsigned().alter()
    table.foreign('aos').references('aos.id')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
}
