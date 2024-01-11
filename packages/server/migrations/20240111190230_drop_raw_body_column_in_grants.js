/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.raw(`
      CREATE OR REPLACE FUNCTION jsonb_from_text(inval TEXT) RETURNS JSONB AS $$
        BEGIN
          RETURN inval::jsonb;
          exception when others then return null;
        END;
      $$ LANGUAGE plpgsql IMMUTABLE;
      
      UPDATE grants SET raw_body_json = jsonb_from_text(raw_body) WHERE raw_body IS NOT NULL;
      
      DROP FUNCTION jsonb_from_text;
      
      ALTER TABLE grants DROP COLUMN raw_body;
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    // This isn't a perfect inverse function.
    // Rows where raw_body was not valid json will not be restored.
    return knex.raw(`
      ALTER TABLE grants ADD COLUMN raw_body TEXT;

      UPDATE grants SET raw_body = raw_body_json::text WHERE raw_body_json IS NOT NULL;
    `);
};
