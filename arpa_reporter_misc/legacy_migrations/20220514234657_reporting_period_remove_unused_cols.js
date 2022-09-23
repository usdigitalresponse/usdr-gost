/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('reporting_periods', function (table) {
    table.dropColumn('final_report_file')
    table.dropColumn('crf_end_date')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('reporting_periods', function (table) {
    table.string('final_report_file')
    table.date('crf_end_date')
  })
}

// NOTE: This file was copied from migrations/20220514234657_reporting_period_remove_unused_cols.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
