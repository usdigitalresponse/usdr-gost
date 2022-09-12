
exports.up = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.text('status')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.dropColumn('status')
    })
}

// NOTE: This file was copied from migrations/20201207092217_add_projects_status.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
