
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

// NOTE: This file was copied from migrations/20200901111557_add_application_settings.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
