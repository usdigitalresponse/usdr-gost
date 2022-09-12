exports.up = function (knex) {
  return knex.schema
    .createTable('arpa_subrecipients', function (table) {
      table.increments('id').primary()
      table.integer('tenant_id').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.timestamp('updated_at')
      table.integer('updated_by').unsigned()
      table.string('uei')
      table.string('tin')
      table.text('record')
      table.integer('upload_id').unsigned()

      table.unique(['tenant_id', 'uei'])
      table.unique(['tenant_id', 'tin'])

      table.foreign('updated_by').references('users.id')
      table.foreign('upload_id').references('uploads.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('arpa_subrecipients')
}

// NOTE: This file was copied from migrations/202205200000_arpa_subrecipients_table.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
