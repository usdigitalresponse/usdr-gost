
exports.up = function (knex) {
  return knex.schema
    .table('agencies', function (table) {
      table.text('code').unique()
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('agencies', function (table) {
      table.dropColumn('code')
    })
}

// NOTE: This file was copied from migrations/20200902093159_add_agency_code.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
