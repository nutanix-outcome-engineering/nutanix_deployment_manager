/** @typedef {import('knex/types').Knex} Knex */

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
  return knex.schema.table('site', table => {
    table.string('smtpServerAddress', 255)
    table.string('smtpServerFromAddress', 512)
    table.integer('smtpServerPort')
    table.string('smtpServerSecurityMode', 255)
    table.text('smtpServerCredentials').defaultTo('')

    table.string('lcmDarksiteUrl', 512)

    table.text('prismCert', 'mediumtext')
    table.text('prismCAChain', 'mediumtext')
    table.text('prismKey', 'mediumtext').defaultTo('')
    table.string('prismKeyType')

    table.string('ldapDirectoryName', 512)
    table.string('ldapDirectoryURL', 512)
    table.text('ldapCredentials')

  })
}

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
  return knex.schema.table('site', table => {
    table.dropColumns([
      'smtpServerAddress',
      'smtpServerFromAddress',
      'smtpServerPort',
      'smtpServerSecurityMode',
      'smtpServerCredentials',

      'lcmDarksiteUrl',

      'prismCert',
      'prismCAChain',
      'prismKey',
      'prismKeyType',

      'ldapDirectoryName',
      'ldapDirectoryURL',
      'ldapCredentials'
    ])
  })
}
