/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        UPDATE grants
            SET award_ceiling_temp = award_ceiling,
                award_floor_temp = award_floor,
                open_date_temp = open_date,
                close_date_temp = close_date
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
