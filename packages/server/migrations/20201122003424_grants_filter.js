/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('agency_eligibility_codes', (table) => {
            table.integer('agency_id').unsigned().notNullable();
            table.string('code').notNullable();
            table.boolean('enabled');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
            table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
            table.foreign('code').references('eligibility_codes.code').onDelete('CASCADE');
            table.primary(['agency_id', 'code']);
        })
        .table('grants', (table) => {
            table.text('description');
            table.string('eligibility_codes');
            table.text('raw_body');
        })
        .table('keywords', (table) => {
            table.integer('agency_id').unsigned();

            table.foreign('agency_id').references('agencies.id');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('agency_eligibility_codes')
        .table('grants', (table) => {
            table.dropColumn('description');
            table.dropColumn('eligibility_codes');
            table.dropColumn('raw_body');
        })
        .table('keywords', (table) => {
            table.dropColumn('agency_id');
        });
};
