/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.dropTable('documents')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.createTable('documents', function (table) {
    table.increments('id').primary()
    table.text('type').notNullable()
    table.json('content').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.integer('upload_id')
    table.timestamp('last_updated_at')
    table.string('last_updated_by')
  })
}

// NOTE: This file was copied from migrations/20220429022821_kill_documents_table.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
