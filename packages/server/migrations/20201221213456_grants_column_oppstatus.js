/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .table('grants', (table) => {
            table.string('opportunity_status');
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('grants', (table) => {
            table.dropColumn('opportunity_status');
        });
};
