
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

// NOTE: This file was copied from migrations/20200902093159_add_agency_code.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
