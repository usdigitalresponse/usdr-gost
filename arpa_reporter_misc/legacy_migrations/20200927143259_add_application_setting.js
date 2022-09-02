
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

// NOTE: This file was copied from migrations/20200927143259_add_application_setting.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
