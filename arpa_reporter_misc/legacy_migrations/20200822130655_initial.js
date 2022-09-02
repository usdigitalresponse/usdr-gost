
exports.up = function (knex) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').primary()
      table.text('email').notNullable().unique()
      table.text('name')
      table.text('role').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.json('tags')
    })
    .createTable('roles', function (table) {
      table.increments('id').primary()
      table.text('name').notNullable().unique()
      table.json('rules').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
    .createTable('access_tokens', function (table) {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('passcode', 200).notNullable().unique()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.timestamp('expires').notNullable()
      table.boolean('used').notNullable()

      table.foreign('user_id').references('users.id')
    })
    .createTable('configurations', function (table) {
      table.increments('id').primary()
      table.text('type').notNullable()
      table.string('name').notNullable().unique()
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.json('content').notNullable()
    })
    .createTable('documents', function (table) {
      table.increments('id').primary()
      table.text('type').notNullable()
      table.json('content').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.string('created_by')
      table.integer('upload_id')
      table.timestamp('last_updated_at')
      table.string('last_updated_by')
    })
    .createTable('uploads', function (table) {
      table.increments('id').primary()
      table.text('filename').notNullable().unique()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.string('created_by')
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('uploads')
    .dropTable('documents')
    .dropTable('configurations')
    .dropTable('access_tokens')
    .dropTable('roles')
    .dropTable('users')
}

// NOTE: This file was copied from migrations/20200822130655_initial.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
