
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

// NOTE: This file was copied from migrations/20200823071001_add_template_id_to_uploads.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
