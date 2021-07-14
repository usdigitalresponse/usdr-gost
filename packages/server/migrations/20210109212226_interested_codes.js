/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('interested_codes', (table) => {
            table.increments('id').primary();
            table.text('name').notNullable().unique();
            table.bool('is_rejection').defaultTo(false);
        })
        .table('grants_interested', (table) => {
            table.integer('interested_code_id').unsigned();
            table.foreign('interested_code_id').references('interested_codes.id').onDelete('CASCADE');
        });
};

exports.down = function (knex) {
    return knex.schema
        .table('grants_interested', (table) => {
            table.dropColumn('interested_code_id');
        })
        .dropTable('interested_codes');
};
