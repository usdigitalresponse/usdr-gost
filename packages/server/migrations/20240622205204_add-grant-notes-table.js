/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('grant_notes', (table) => {
            table.increments('id').notNullable().primary();
            table.text('grant_id').notNullable();
            table.integer('user_id').notNullable();
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

            table.foreign('grant_id').references('grants.grant_id');
            table.foreign('user_id').references('users.id');

            table.index(['grant_id', 'user_id'], 'idx_grant_id_user_id');
        })
        .createTable('grant_notes_revisions', (table) => {
            table.increments('id').notNullable().primary();
            table.integer('grant_note_id').notNullable();
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
            table.text('text').notNullable();
            table.foreign('grant_note_id').references('grant_notes.id');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('grant_notes')
        .dropTable('grant_notes_revisions');
};
