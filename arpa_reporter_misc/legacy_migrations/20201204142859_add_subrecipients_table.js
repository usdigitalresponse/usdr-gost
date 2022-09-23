
exports.up = function (knex) {
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
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('subrecipients')
}

// NOTE: This file was copied from migrations/20201204142859_add_subrecipients_table.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
