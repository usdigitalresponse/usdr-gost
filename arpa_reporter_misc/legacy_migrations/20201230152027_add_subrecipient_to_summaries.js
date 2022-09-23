
exports.up = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.text('subrecipient_identification_number')
      table.foreign('subrecipient_identification_number').references('subrecipients.identification_number')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.dropColumn('subrecipient_identification_number')
    })
}

// NOTE: This file was copied from migrations/20201230152027_add_subrecipient_to_summaries.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
