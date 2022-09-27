
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

// NOTE: This file was copied from migrations/20200916213551_remove-uploads-agency-id.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
