
exports.up = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.timestamp('certified_at')
      table.text('certified_by')
      table.text('reporting_template')
      table.specificType('validation_rule_tags', 'TEXT[]')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.dropColumn('validation_rule_tags')
      table.dropColumn('reporting_template')
      table.dropColumn('certified_by')
      table.dropColumn('certified_at')
    })
}

// NOTE: This file was copied from migrations/20201210114557_add_reporting_period_attributes.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
