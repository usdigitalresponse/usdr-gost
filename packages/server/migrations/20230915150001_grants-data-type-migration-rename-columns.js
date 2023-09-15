/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    const queries = [
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_ceiling TO award_ceiling_old`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_floor TO award_floor_old`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN open_date TO open_date_old`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN close_date TO close_date_old`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_ceiling_temp TO award_ceiling`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_floor_temp TO award_floor`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN open_date_temp TO open_date`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN close_date_temp TO close_date`),
    ];
    console.log(queries.join(';'));
    const multiQuery = queries.join(';');
    return knex.raw(multiQuery);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    const queries = [
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_ceiling TO award_ceiling_temp`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_floor TO award_floor_temp`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN open_date TO open_date_temp`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN close_date TO close_date_temp`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_ceiling_old TO award_ceiling`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN award_floor_old TO award_floor`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN open_date_old TO open_date`),
        knex.raw(`ALTER TABLE grants RENAME COLUMN close_date_old TO close_date`),
    ];
    console.log(queries.join(';'));
    const multiQuery = queries.join(';');
    return knex.raw(multiQuery);
};
