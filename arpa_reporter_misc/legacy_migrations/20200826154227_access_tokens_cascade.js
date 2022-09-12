exports.up = async function (knex) {
  return knex.schema
    .table('access_tokens', function (table) {
      table.dropForeign('user_id')
    })
    .table('access_tokens', function (table) {
      table
        .foreign('user_id')
        .references('users.id')
        .onDelete('CASCADE')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('access_tokens', function (table) {
      table.dropForeign('user_id')
    })
    .table('access_tokens', function (table) {
      table.foreign('user_id').references('users.id')
    })
}

// NOTE: This file was copied from migrations/20200826154227_access_tokens_cascade.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
