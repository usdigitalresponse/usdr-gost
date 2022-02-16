/* eslint-disable func-names */
exports.up = function (knex) {
    return knex.schema
        .createTable('tenants', (table) => {
            table.increments('id').primary();
            table.string('display_name');
            table.integer('main_agency_id').unsigned();
            table.foreign('main_agency_id').references('agencies.id');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
        })
        .table('agencies', (table) => {
            table.integer('tenant_id').unsigned();
            table.foreign('tenant_id').references('tenants.id');
        })
        .table('users', (table) => {
            table.integer('tenant_id').unsigned();
            table.foreign('tenant_id').references('tenants.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('tenants')
        .table('agencies', (table) => {
            table.dropColumn('tenant_id');
        })
        .table('users', (table) => {
            table.dropColumn('tenant_id');
        });
};
