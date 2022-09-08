
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

// NOTE: This file was copied from migrations/20201207092217_add_projects_status.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
