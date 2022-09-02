
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

// NOTE: This file was copied from migrations/20201206080217_add_validations_messages.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
