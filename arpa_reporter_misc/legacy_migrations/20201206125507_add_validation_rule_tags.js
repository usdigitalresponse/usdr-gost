
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

// NOTE: This file was copied from migrations/20201206125507_add_validation_rule_tags.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
