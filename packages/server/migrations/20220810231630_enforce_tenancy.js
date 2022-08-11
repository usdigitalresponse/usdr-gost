/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropNullable('tenant_id');
    }).alterTable('agencies', (table) => {
        table.dropNullable('tenant_id');
        table.dropNullable('main_agency_id');
    }).alterTable('tenants', (table) => {
        table.dropNullable('main_agency_id');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', (table) => {
        table.setNullable('tenant_id');
    }).alterTable('agencies', (table) => {
        table.setNullable('tenant_id');
        table.setNullable('main_agency_id');
    }).alterTable('tenants', (table) => {
        table.setNullable('main_agency_id');
    });
};
