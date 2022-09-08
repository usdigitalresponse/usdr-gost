
exports.up = function (knex) {
  return knex.schema
    .createTable('application_settings', function (table) {
      table.text('title')
      table.integer('current_reporting_period_id').references('id').inTable('reporting_periods')
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('application_settings')
}

// NOTE: This file was copied from migrations/20200901111557_add_application_settings.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
