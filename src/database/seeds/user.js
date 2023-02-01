const bcrypt = require('bcryptjs')
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('user').del()
  const salt = bcrypt.genSaltSync()
  const hash = bcrypt.hashSync('nutanix/4u',salt)
  await knex('user').insert({
    username:'admin',
    password: hash
  });
};
