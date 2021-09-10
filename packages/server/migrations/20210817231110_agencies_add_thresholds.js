exports.up = async function (knex) {
    await knex.raw(`
  ALTER TABLE agencies ADD COLUMN warning_threshold INTEGER DEFAULT 30; 
  `);
    await knex.raw(`
  ALTER TABLE agencies ADD COLUMN danger_threshold INTEGER DEFAULT 15; 
  `);
};

exports.down = async function (knex) {
    await knex.raw(`
  ALTER TABLE agencies DROP COLUMN warning_threshold;
  `);
    await knex.raw(`
  ALTER TABLE agencies DROP COLUMN danger_threshold;
  `);
};
