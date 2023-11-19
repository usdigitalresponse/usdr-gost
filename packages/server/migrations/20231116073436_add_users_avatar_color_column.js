const { userAvatarStyles } = require("../src/db/constants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
      table.json('avatar').defaultTo(JSON.stringify({ bgColor: '#6610F2', text: '#FFF' })).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
      table.dropColumn('avatar');
  });
};
