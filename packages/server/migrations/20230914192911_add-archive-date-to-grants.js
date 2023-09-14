/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // , ALTER COLUMN close_date TYPE timestamp USING close_date::timestamp, ADD COLUMN archive_date TYPE timestamp
    return knex.raw(`ALTER TABLE grants ALTER COLUMN open_date TYPE timestamp USING open_date::timestamp,
    ALTER COLUMN close_date TYPE timestamp USING close_date::timestamp,
    ADD COLUMN archive_date timestamp`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    // , ALTER COLUMN close_date TYPE text USING close_date::text, DROP COLUMN archive_date
    return knex.raw(`ALTER TABLE grants ALTER COLUMN open_date TYPE text USING open_date::text,
    ALTER COLUMN close_date TYPE text USING close_date::text,
    DROP COLUMN archive_date`);
};
