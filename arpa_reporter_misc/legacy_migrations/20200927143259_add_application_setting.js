
exports.up = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.text('reporting_template')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.dropColumn('reporting_template')
    })
}

// NOTE: This file was copied from migrations/20200927143259_add_application_setting.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
