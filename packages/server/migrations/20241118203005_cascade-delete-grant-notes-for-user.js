/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('grant_notes', (table) => {
        table.dropForeign('user_id');
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.table('grant_notes', (table) => {
        table.dropForeign('user_id');
        table.foreign('user_id').references('users.id');
    });
};
