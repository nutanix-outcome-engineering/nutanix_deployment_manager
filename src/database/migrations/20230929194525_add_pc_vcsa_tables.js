/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.createTable('prismCentral', table => {
    table.increments('id').primary()
    table.string('displayName', 255)
    table.string('hostnameOrIP', 255).unique()
    table.text('credentials')
    table.boolean('siteDefault')
    table.datetime('createDate')
    table.datetime('lastModified')
  })
  .createTable('vCenter', table => {
    table.increments('id').primary()
    table.string('displayName', 255)
    table.string('hostnameOrIP', 255).unique()
    table.text('credentials')
    table.boolean('siteDefault')
    table.datetime('createDate')
    table.datetime('lastModified')
  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.dropTableIfExists('prismCentral')
    .dropTableIfExists('vCenter')
}
