/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            DROP COLUMN award_ceiling_old,
            DROP COLUMN award_floor_old,
            DROP COLUMN open_date_old,
            DROP COLUMN close_date_old
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            ADD COLUMN award_ceiling_old text,
            ADD COLUMN award_floor_old text,
            ADD COLUMN open_date_old text,
            ADD COLUMN close_date_old text
    `);
};
