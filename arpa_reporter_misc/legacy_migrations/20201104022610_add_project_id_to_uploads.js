
exports.up = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.integer('project_id').unsigned()
      table.foreign('project_id').references('projects.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('uploads', function (table) {
      table.dropColumn('project_id')
    })
}

// NOTE: This file was copied from migrations/20201104022610_add_project_id_to_uploads.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
