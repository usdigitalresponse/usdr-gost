
exports.up = function (knex) {

}

exports.down = function (knex) {

}

exports.up = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.decimal('award_amount', 19, 2)
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('period_summaries', function (table) {
      table.dropColumn('award_amount')
    })
}

// NOTE: This file was copied from migrations/20210118221340_add_award_amount_to_summaries.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
