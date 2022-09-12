
exports.up = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.specificType('validation_rule_tags', 'TEXT[]')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('application_settings', function (table) {
      table.dropColumn('validation_rule_tags')
    })
}

// NOTE: This file was copied from migrations/20201206125507_add_validation_rule_tags.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
