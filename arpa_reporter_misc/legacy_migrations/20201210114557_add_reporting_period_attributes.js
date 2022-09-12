
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

// NOTE: This file was copied from migrations/20201210114557_add_reporting_period_attributes.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
