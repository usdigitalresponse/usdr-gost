
exports.up = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.date('period_of_performance_end_date')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.dropColumn('period_of_performance_end_date')
    })
}

// NOTE: This file was copied from migrations/20201031052020_add_period_of_performance.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
