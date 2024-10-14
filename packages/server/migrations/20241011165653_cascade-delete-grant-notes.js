/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.table('grant_notes_revisions', (table) => {
        table.dropForeign('grant_note_id');
        table.foreign('grant_note_id').references('grant_notes.id').onDelete('CASCADE');
    });
    await knex.schema.table('grant_notes', (table) => {
        table.boolean('is_published').defaultTo(true);
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
    await knex.schema.table('grant_notes', (table) => {
        table.dropColumn('is_published');
    });
};
