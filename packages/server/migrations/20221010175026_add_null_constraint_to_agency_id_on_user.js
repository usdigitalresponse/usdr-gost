/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => table.dropNullable('agency_id'));
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => table.setNullable('agency_id'));
};
