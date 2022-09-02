
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

// NOTE: This file was copied from migrations/20200905130612_add_projects_table.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
