
exports.up = function (knex) {
  return knex.schema
    .table('subrecipients', function (table) {
      table.integer('created_in_period')
      table.foreign('created_in_period').references('reporting_periods.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('subrecipients', function (table) {
      table.dropColumn('created_in_period')
    })
}

// NOTE: This file was copied from migrations/20201230151844_add_period_to_subrecipients.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
