
exports.up = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.dropColumn('agency_id')
    })
}

// NOTE: This file was copied from migrations/20201025174530_add_agency_id_to_projects.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
