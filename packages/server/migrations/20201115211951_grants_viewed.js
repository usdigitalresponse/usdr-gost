/* eslint-disable func-names */

exports.up = function (knex) {
    return knex.schema
        .createTable('grants_viewed', (table) => {
            table.integer('agency_id').unsigned().notNullable();
            table.string('grant_id').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
            table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
            table.foreign('grant_id').references('grants.grant_id').onDelete('CASCADE');
            table.primary(['agency_id', 'grant_id']);
        });
};

exports.down = function (knex) {
    return knex.schema
        .dropTable('grants_viewed');
};
