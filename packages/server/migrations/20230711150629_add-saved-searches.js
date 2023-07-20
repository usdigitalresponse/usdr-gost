/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('grants_saved_searches', (table) => {
            table.increments('id').primary();
            table.text('name').notNullable();
            table.integer('created_by').unsigned().index().notNullable();
            table.foreign('created_by').references('users.id');
            table.text('criteria').notNullable();
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
            table.unique(['name', 'created_by'], { indexName: 'grants_saved_searches_name_created_by_idx' });
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('grants_saved_searches');
};
