
exports.up = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.date('crf_end_date')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.dropColumn('crf_end_date')
    })
}

// NOTE: This file was copied from migrations/20201226135544_add_crf_end_date.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
