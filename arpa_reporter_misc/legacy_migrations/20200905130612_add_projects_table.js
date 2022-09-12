
exports.up = function (knex) {
  return knex.schema
    .createTable('projects', function (table) {
      table.increments('id').primary()
      table.text('code').notNullable().unique()
      table.text('name').notNullable().unique()
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('projects')
}

// NOTE: This file was copied from migrations/20200905130612_add_projects_table.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
