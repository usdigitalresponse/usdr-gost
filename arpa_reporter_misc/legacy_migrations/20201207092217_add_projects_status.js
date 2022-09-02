
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

// NOTE: This file was copied from migrations/20201207092217_add_projects_status.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
