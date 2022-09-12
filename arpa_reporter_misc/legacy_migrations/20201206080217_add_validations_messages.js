
exports.up = function (knex) {
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

exports.down = function (knex) {
  return knex.schema
    .dropTable('validation_messages')
}

// NOTE: This file was copied from migrations/20201206080217_add_validations_messages.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
