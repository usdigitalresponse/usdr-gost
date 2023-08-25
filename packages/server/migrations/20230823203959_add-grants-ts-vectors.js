/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.raw(
        `
            -- Create and index a column that materializes lexemes parsed from grants.title
            ALTER TABLE grants ADD COLUMN title_ts tsvector
                GENERATED ALWAYS AS (to_tsvector('english', title)) STORED;
            CREATE INDEX title_ts_idx_gin ON grants USING GIN (title_ts);
            -- Create and index a column that materializes lexemes parsed from grants.description
            ALTER TABLE grants ADD COLUMN description_ts tsvector
                GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;
            CREATE INDEX description_ts_idx_gin ON grants USING GIN (description_ts);
        `,
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable('grants', (table) => {
        table.dropColumn('title_ts');
        table.dropColumn('description_ts');
    });
};
