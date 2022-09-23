
exports.up = function (knex) {
  return knex.schema
    .createTable('period_summaries', function (table) {
      table.increments('id').primary()
      table.integer('reporting_period_id').notNullable()
      table.text('project_code').notNullable()
      table.text('award_type').notNullable()
      table.text('award_number').notNullable()
      table.decimal('current_obligation', 19, 2).notNullable()
      table.decimal('current_expenditure', 19, 2).notNullable()

      table.foreign('reporting_period_id').references('reporting_periods.id')
      table.foreign('project_code').references('projects.code')
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('period_summaries')
}

// NOTE: This file was copied from migrations/20201210143014_add-period-summaries.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
