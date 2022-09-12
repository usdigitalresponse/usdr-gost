
exports.up = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.integer('configuration_id').references('id').inTable('configurations')
  })
}

exports.down = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.dropColumn('configuration_id')
  })
}

// NOTE: This file was copied from migrations/20200823071001_add_template_id_to_uploads.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
