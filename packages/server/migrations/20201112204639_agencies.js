/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('agencies', (table) => {
            table.increments('id').primary();
            table.text('name').notNullable().unique();
            table.string('abbreviation');
            table.integer('parent').unsigned();

            table.foreign('parent').references('agencies.id');
        })
        .table('users', (table) => {
            table.integer('agency_id').unsigned();

            table.foreign('agency_id').references('agencies.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('users', (table) => {
            table.dropColumn('agency_id');
        })
        .dropTable('agencies');
};
