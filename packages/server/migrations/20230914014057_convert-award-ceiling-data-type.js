/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
        ALTER COLUMN award_ceiling TYPE bigint USING award_ceiling::bigint,
        ALTER COLUMN award_floor TYPE bigint USING award_floor::bigint`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
    ALTER TABLE grants
    ALTER COLUMN award_ceiling TYPE text USING award_ceiling::text,
    ALTER COLUMN award_floor TYPE text USING award_floor::text`);
};
