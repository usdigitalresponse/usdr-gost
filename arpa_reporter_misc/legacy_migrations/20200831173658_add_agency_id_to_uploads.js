
exports.up = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.dropColumn('agency_id')
    })
}

// NOTE: This file was copied from migrations/20200831173658_add_agency_id_to_uploads.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
