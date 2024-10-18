const { onUpdateTrigger } = require('../knexfile');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const ON_UPDATE_TIMESTAMP_FUNCTION = `
        CREATE OR REPLACE FUNCTION before_update_set_updated_at()
        RETURNS trigger AS $$
        BEGIN
            IF NEW IS DISTINCT FROM OLD THEN
                NEW.updated_at = now();
            END IF;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    `;

    await knex.schema.table('grant_notes_revisions', (table) => {
        table.dropForeign('grant_note_id');
        table.foreign('grant_note_id').references('grant_notes.id').onDelete('CASCADE');
    });
    await knex.raw(ON_UPDATE_TIMESTAMP_FUNCTION);
    await knex.schema.table('grant_notes', (table) => {
        table.boolean('is_published').notNullable().defaultTo(true);
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.raw(onUpdateTrigger('grant_notes'));
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
        table.dropColumn('updated_at');
    });
    await knex.raw('DROP TRIGGER IF EXISTS grant_notes_updated_at ON grant_notes');
    await knex.raw('DROP FUNCTION IF EXISTS before_update_set_updated_at');
};
