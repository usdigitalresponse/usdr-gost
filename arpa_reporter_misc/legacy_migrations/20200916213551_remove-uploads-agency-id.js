
exports.up = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.dropColumn('agency_id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
}

// NOTE: This file was copied from migrations/20200916213551_remove-uploads-agency-id.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
