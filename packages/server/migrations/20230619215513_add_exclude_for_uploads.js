/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .alterTable('uploads', (table) => {
            table.timestamp('invalidated_at');
            table.integer('invalidated_by');
            table.foreign('invalidated_by').references('users.id').onDelete('SET NULL');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .alterTable('uploads', (table) => {
            table.dropColumn('invalidated_at');
            table.dropColumn('invalidated_by');
        });
};
