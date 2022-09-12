
exports.up = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
    })
    .table('documents', function (table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
      table.dropColumn('created_by')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.dropColumn('user_id')
    })
    .table('documents', function (table) {
      table.dropColumn('user_id')
      table.text('created_by')
    })
}

// NOTE: This file was copied from migrations/20200902002417_add_user_id_to_uploads_and_documents.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
