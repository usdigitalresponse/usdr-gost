/**
 * Populates the new `close_date_explanation` field from existing data in the raw_body_json field
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex('grants')
        .update({
            close_date_explanation: knex.raw(`raw_body_json->'opportunity'->'milestones'->'close'->>'explanation'`),
        })
        .whereNull('close_date_explanation');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {
    // Cannot accurately reverse the migration
    // (but if you also reverse the preceding migration, the column will simply be removed, making this moot)
    return Promise.resolve();
};
