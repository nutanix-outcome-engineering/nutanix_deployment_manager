/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('user').del()
  await knex('user').insert({
    username:'admin',
    password: '$2a$10$0/BrYrykfrBI/qbbwU97a.w4eFLUs0wwGKZ1lqn7OhR3CSLEZ8TWK'
  });
};
