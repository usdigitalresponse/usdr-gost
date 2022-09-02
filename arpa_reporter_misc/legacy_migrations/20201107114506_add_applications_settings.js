
exports.up = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.text('duns_number')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.dropColumn('duns_number')
    })
}

// NOTE: This file was copied from migrations/20201107114506_add_applications_settings.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
