/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    // Sets the empty string for any grant whose raw_body does not contain valid funding activity categories.
    // This matches the behavior of the grants ingestor.
    return knex.raw(`
        UPDATE grants
        SET funding_activity_category_codes = (
            SELECT array_to_string(COALESCE(array_agg(category ->> 'code'), ARRAY[]::text[]), ' ')
            FROM (SELECT jsonb_path_query(raw_body_json, '$.funding_activity.categories[*]') AS category) AS unused
        )
        WHERE funding_activity_category_codes IS NULL AND raw_body_json IS NOT NULL;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// eslint-disable-next-line no-unused-vars
exports.down = function (knex) {
    // no going back
};
