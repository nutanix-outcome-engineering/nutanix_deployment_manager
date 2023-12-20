/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropForeign('hypervisor')
  })
  .table('hypervisor', table => {
    table.string('id').alter()
    table.renameColumn('id', 'uuid')
    table.string('status').after('filename')
    table.string('transferStatus')
    table.integer('site').unsigned()
    table.foreign('site').references('site.id')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
  .table('cluster', table => {
    table.string('hypervisor').alter()
    table.foreign('hypervisor').references('hypervisor.uuid')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('cluster', table => {
    table.dropForeign('hypervisor')
  })
  .table('hypervisor', table => {
    table.dropForeign('site')
    table.dropColumn('site')
    table.integer('uuid').unsigned().alter()
    table.renameColumn('uuid', 'id')
    table.dropColumn('status')
    table.dropColumn('transferStatus')
  })
  .table('cluster', table => {
    table.integer('hypervisor').unsigned().alter()
    table.foreign('hypervisor').references('hypervisor.id')
      .onDelete('SET NULL').onUpdate('CASCADE')
  })
}
