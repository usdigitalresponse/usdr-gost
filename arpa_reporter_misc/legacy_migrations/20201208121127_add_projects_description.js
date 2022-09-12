
exports.up = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.text('description')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.dropColumn('description')
    })
}

// NOTE: This file was copied from migrations/20201208121127_add_projects_description.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
