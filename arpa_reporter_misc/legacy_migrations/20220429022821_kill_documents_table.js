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

// NOTE: This file was copied from migrations/20220429022821_kill_documents_table.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
