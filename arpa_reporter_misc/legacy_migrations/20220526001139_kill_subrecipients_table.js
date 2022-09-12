
exports.up = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.dropColumn('subrecipient_identification_number')
    })
    .dropTable('subrecipients')
}

exports.down = function (knex) {
  return knex.schema
    .createTable('subrecipients', function (table) {
      table.increments('id').primary()
      table.text('identification_number').notNullable().unique()
      table.text('duns_number').unique()
      table.text('legal_name')
      table.text('address_line_1')
      table.text('address_line_2')
      table.text('address_line_3')
      table.text('city_name')
      table.text('state_code')
      table.text('zip')
      table.text('country_name').defaultTo('United States')
      table.text('organization_type').defaultTo('Other')
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.text('created_by')
      table.timestamp('updated_at')
      table.text('updated_by')

      table.integer('created_in_period')
      table.foreign('created_in_period').references('reporting_periods.id')
    })
    .table('period_summaries', function (table) {
      table.text('subrecipient_identification_number')
      table.foreign('subrecipient_identification_number').references('subrecipients.identification_number')
    })
}

// NOTE: This file was copied from migrations/20220526001139_kill_subrecipients_table.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
