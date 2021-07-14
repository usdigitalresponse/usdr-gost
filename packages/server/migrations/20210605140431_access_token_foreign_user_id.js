/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema.table('access_tokens', (t) => {
        t.dropForeign('user_id');
        t.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
};

exports.down = function (knex) {
    return knex.schema.table('access_tokens', (t) => {
        t.dropForeign('user_id');
        t.foreign('user_id').references('users.id');
    });
};
