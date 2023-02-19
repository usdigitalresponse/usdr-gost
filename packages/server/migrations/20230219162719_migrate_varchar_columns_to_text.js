/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.raw(`
        DO $bulkmigration$
        BEGIN
        EXECUTE (
        SELECT
            string_agg(
                format (
                'ALTER TABLE %I ALTER COLUMN %I TYPE text',
                c.table_name,
                c.column_name
                ),
            E';\n')
        FROM information_schema.columns c
            JOIN information_schema.tables t
            ON t.table_schema = c.table_schema
            AND t.table_name = c.table_name
            AND t.table_type = 'BASE TABLE'
        WHERE c.data_type = 'character varying'
            AND c.table_schema NOT IN ('information_schema', 'pg_catalog')
            AND c.table_name NOT IN ('migrations')
        );
        END
        $bulkmigration$;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// eslint-disable-next-line no-unused-vars
exports.down = function (knex) {
    // no going back
};
