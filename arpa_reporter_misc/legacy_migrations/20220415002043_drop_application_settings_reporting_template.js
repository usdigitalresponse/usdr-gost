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

// NOTE: This file was copied from migrations/20220415002043_drop_application_settings_reporting_template.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
