/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        UPDATE grants
            SET award_ceiling_temp = award_ceiling::bigint,
                award_floor_temp = award_floor::bigint,
                open_date_temp = open_date::date,
                close_date_temp = close_date::date
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
        UPDATE grants
            SET award_ceiling_temp = NULL,
                award_floor_temp = NULL,
                open_date_temp = NULL,
                close_date_temp = NULL
    `);
};
