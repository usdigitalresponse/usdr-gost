/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('grant_notes_revisions', (table) => {
        table.dropForeign('grant_note_id');
        table.foreign('grant_note_id').references('grant_notes.id').onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.table('grant_notes_revisions', (table) => {
        table.dropForeign('grant_note_id');
        table.foreign('grant_note_id').references('grant_notes.id');
    });
};
