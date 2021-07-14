/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('grants', (table) => {
            table.string('grant_id').primary();
            table.string('grant_number');
            table.text('title');
            table.string('status');
            table.string('agency_code');
            table.string('award_ceiling');
            table.string('cost_sharing');
            table.string('cfda_list');
            table.string('open_date');
            table.string('close_date');
            table.string('reviewer_name');
            table.string('opportunity_category');
            table.text('search_terms');
            table.text('notes');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
        })
        // update eligibility_codes set enabled = true where code in ('00','06','07','25','99');
        .createTable('eligibility_codes', (table) => {
            table.string('code').notNullable().primary();
            table.boolean('enabled');
            table.text('label');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
        })
        .createTable('keywords', (table) => {
            table.increments('id').primary();
            table.string('mode').notNullable();
            table.text('search_term');
            table.text('notes');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('eligibility_codes')
        .dropTable('grants')
        .dropTable('keywords');
};
