
exports.up = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.text('created_by')
      table.timestamp('updated_at')
      table.text('updated_by')
    })
    .table('agencies', function (table) {
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.text('created_by')
      table.timestamp('updated_at')
      table.text('updated_by')
    })
    .table('subrecipients', function (table) {
      table.text('created_by')
      table.timestamp('updated_at')
      table.text('updated_by')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.dropColumn('created_at')
      table.dropColumn('created_by')
      table.dropColumn('updated_at')
      table.dropColumn('updated_by')
    })
    .table('agencies', function (table) {
      table.dropColumn('created_at')
      table.dropColumn('created_by')
      table.dropColumn('updated_at')
      table.dropColumn('updated_by')
    })
    .table('subrecipients', function (table) {
      table.dropColumn('created_by')
      table.dropColumn('updated_at')
      table.dropColumn('updated_by')
    })
}

// NOTE: This file was copied from migrations/20201210113823_db_timestamps.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
