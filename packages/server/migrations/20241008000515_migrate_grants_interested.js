/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// Insert data from grants_interested to grant_followers where interested status is 'Interested'
exports.up = async function (knex) {
    await knex.raw(`
      INSERT INTO grant_followers (grant_id, user_id, created_at)
      SELECT 
          gi.grant_id as grant_id,
          gi.user_id as user_id,
          COALESCE(gi.updated_at, gi.created_at) as created_at
      FROM grants_interested gi
      JOIN interested_codes ic ON ic.id = gi.interested_code_id
      WHERE ic.status_code = 'Interested'
      AND (gi.grant_id, gi.user_id) NOT IN (
          SELECT grant_id, user_id FROM grant_followers
      );
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    // Removing the rows that were inserted during the up migration
    await knex.raw(`
      DELETE FROM grant_followers
      WHERE (grant_id, user_id) IN (
        SELECT 
          gi.grant_id as grant_id,
          gi.user_id as user_id
        FROM grants_interested gi
        JOIN interested_codes ic ON ic.id = gi.interested_code_id
        WHERE ic.status_code = 'Interested'
      );
    `);
};
