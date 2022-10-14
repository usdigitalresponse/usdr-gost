
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

// NOTE: This file was copied from migrations/20201025174530_add_agency_id_to_projects.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
