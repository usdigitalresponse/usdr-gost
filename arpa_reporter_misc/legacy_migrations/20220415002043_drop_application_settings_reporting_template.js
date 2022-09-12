/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('application_settings', function (table) {
    table.dropColumn('reporting_template')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('application_settings', function (table) {
    table.text('reporting_template').after('current_reporting_period_id')
  })
}

// NOTE: This file was copied from migrations/20220415002043_drop_application_settings_reporting_template.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
