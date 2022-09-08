/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.timestamp('validated_at')
    table.integer('validated_by').unsigned()
    table.foreign('validated_by').references('users.id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.dropForeign('validated_by')
    table.dropColumns('validated_by', 'validated_at')
  })
}

// NOTE: This file was copied from migrations/20220426184556_add_upload_validation_state.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
