
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

// NOTE: This file was copied from migrations/20201206125507_add_validation_rule_tags.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
