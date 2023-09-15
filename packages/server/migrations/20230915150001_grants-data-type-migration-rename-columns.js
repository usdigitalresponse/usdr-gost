/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            RENAME COLUMN award_ceiling TO award_ceiling_old,
            RENAME COLUMN award_floor TO award_floor_old,
            RENAME COLUMN open_date TO open_date_old,
            RENAME COLUMN close_date TO close_date_old,
            RENAME COLUMN award_ceiling_temp TO award_ceiling,
            RENAME COLUMN award_floor_temp TO award_floor,
            RENAME COLUMN open_date_temp TO open_date,
            RENAME COLUMN close_date_temp TO close_date
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.raw(`
        ALTER TABLE grants
            RENAME COLUMN award_ceiling TO award_ceiling_temp,
            RENAME COLUMN award_floor TO award_floor_temp,
            REANME COLUMN open_date TO open_date_temp,
            RENAME COLUMN close_date TO close_date_temp,
            RENAME COLUMN award_ceiling_old TO award_ceiling,
            RENAME COLUMN award_floor_old TO award_floor,
            RENAME COLUMN open_date_old TO open_date,
            REANME COLUMN close_date_old TO close_date
    `);
};
