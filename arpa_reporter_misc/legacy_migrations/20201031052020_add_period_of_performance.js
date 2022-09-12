
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

// NOTE: This file was copied from migrations/20201031052020_add_period_of_performance.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
