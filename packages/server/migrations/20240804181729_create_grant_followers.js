/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('grant_followers', (table) => {
        table.increments('id').primary();
        table.text('grant_id').notNullable();
        table.integer('user_id').notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('grant_id').references('grant_id').inTable('grants');
        table.foreign('user_id').references('id').inTable('users');

        table.unique(['grant_id', 'user_id'], 'idx_grant_followers_grant_id_user_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('grant_followers');
};
