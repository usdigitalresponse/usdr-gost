/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema
        .table('access_tokens', (table) => {
            table.integer('uses').notNullable().defaultTo(0);
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('access_tokens', (table) => {
            table.dropColumn('uses');
        });
};
