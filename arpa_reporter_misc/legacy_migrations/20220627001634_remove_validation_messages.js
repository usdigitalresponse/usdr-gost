/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .dropTable('validation_messages')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .createTable('validation_messages', function (table) {
      table.increments('id').primary()
      table.integer('upload_id').unsigned()
      table.foreign('upload_id').references('uploads.id')
      table.text('message')
      table.text('tab')
      table.integer('row')
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
}

// NOTE: This file was copied from migrations/20220627001634_remove_validation_messages.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
