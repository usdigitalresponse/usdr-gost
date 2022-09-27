/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.dropColumns('created_by', 'project_id')
      table.dropUnique('filename')
    })
    .table('documents', function (table) {
      table.dropForeign('user_id')
      table.dropColumn('user_id')
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table('documents', function (table) {
      table.integer('user_id').unsigned()
      table.foreign('user_id').references('users.id')
    })
    .table('uploads', function (table) {
      table.unique('filename')

      table.integer('project_id').unsigned()
      table.foreign('project_id').references('projects.id')

      table.string('created_by')
    })
}

// NOTE: This file was copied from migrations/20220425080141_overhaul_uploads.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
