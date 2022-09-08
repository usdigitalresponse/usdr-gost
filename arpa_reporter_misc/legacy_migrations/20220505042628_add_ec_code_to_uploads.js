/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.string('ec_code')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('uploads', function (table) {
    table.dropColumn('ec_code')
  })
}

// NOTE: This file was copied from migrations/20220505042628_add_ec_code_to_uploads.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
