/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable('foundation', table => {
    table.string('uuid').primary()
    table.string('ip').notNullable().unique()
    table.string('version')
    table.string('status')
    table.integer('siteId').unsigned()
    table.datetime('createDate')
    table.datetime('lastModified')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('foundation')
}
