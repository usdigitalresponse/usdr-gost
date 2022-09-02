
exports.up = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.date('open_date')
      table.date('close_date')
      table.date('review_period_start_date')
      table.date('review_period_end_date')
      table.text('final_report_file')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.dropColumn('open_date')
      table.dropColumn('close_date')
      table.dropColumn('review_period_start_date')
      table.dropColumn('review_period_end_date')
      table.dropColumn('final_report_file')
    })
}

// NOTE: This file was copied from migrations/20201210114558_add_reporting_period_attributes.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
