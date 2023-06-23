/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('grants_saved_searches', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.integer('agency_id').unsigned();
            table.foreign('agency_id').references('agencies.id');
            table.integer('created_by').unsigned();
            table.foreign('created_by').references('users.id');
            table.string('criteria').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('grants_saved_searches');
};
