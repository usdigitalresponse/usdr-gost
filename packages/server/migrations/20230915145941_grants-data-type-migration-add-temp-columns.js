/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            ADD COLUMN award_ceiling_temp bigint,
            ADD COLUMN award_floor_temp bigint,
            ADD COLUMN open_date_temp date,
            ADD COLUMN close_date_temp date,
            ADD COLUMN archive_date date
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            DROP COLUMN award_ceiling_temp,
            DROP COLUMN award_floor_temp,
            DROP COlUMN open_date_temp,
            DROP COLUMN close_date_temp,
            DROP COLUMN archive_date
    `);
};
