/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable('arpa_subrecipients', function (table) {
      table.dropForeign('upload_id')
      table.dropColumn('upload_id')
    })
    .alterTable('uploads', function (table) {
      table.dropPrimary()
      table.dropColumn('id')
    })
    .alterTable('uploads', function (table) {
      table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary()
    })
    .alterTable('arpa_subrecipients', function (table) {
      table.uuid('upload_id')
      table.foreign('upload_id').references('uploads.id').onDelete('cascade')
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('arpa_subrecipients', function (table) {
      table.dropForeign('upload_id')
      table.dropColumn('upload_id')
    })
    .alterTable('uploads', function (table) {
      table.dropPrimary()
      table.dropColumn('id')
    })
    .alterTable('uploads', function (table) {
      table.increments('id').primary()
    })
    .alterTable('arpa_subrecipients', function (table) {
      table.integer('upload_id').unsigned()
      table.foreign('upload_id').references('uploads.id').onDelete('cascade')
    })
}

// NOTE: This file was copied from migrations/20220627001742_key_uploads_with_uuid.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
