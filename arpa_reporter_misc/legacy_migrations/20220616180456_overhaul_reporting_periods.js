/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('reporting_periods', function (table) {
    table.dropColumn('review_period_end_date')
    table.dropColumn('review_period_start_date')
    table.dropColumn('close_date')
    table.dropColumn('open_date')

    table.dropColumn('validation_rule_tags')
    table.dropColumn('reporting_template')

    table.dropColumn('period_of_performance_end_date')

    table.integer('certified_by').unsigned().alter()
    table.foreign('certified_by').references('users.id')

    table.string('template_filename')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table('reporting_periods', function (table) {
      table.dropForeign('certified_by')
    })
    .alterTable('reporting_periods', function (table) {
      table.dropColumn('template_filename')

      table.text('certified_by').alter()

      table.date('period_of_performance_end_date')

      table.text('reporting_template')
      table.specificType('validation_rule_tags', 'TEXT[]')

      table.date('open_date')
      table.date('close_date')
      table.date('review_period_start_date')
      table.date('review_period_end_date')
    })
}

// NOTE: This file was copied from migrations/20220616180456_overhaul_reporting_periods.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
