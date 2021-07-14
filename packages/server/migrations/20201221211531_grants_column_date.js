/* eslint-disable func-names */

exports.up = async function (knex) {
    await knex.raw(`
  UPDATE grants SET open_date = null WHERE open_date like '%2100%';
  `);
    await knex.raw(`
  UPDATE grants SET close_date = null WHERE close_date like '%2100%';
  `);
    await knex.raw(`
  ALTER TABLE grants ALTER COLUMN open_date TYPE DATE 
    using to_date(open_date, 'MM/DD/YYYY');
  `);
    await knex.raw(`
  ALTER TABLE grants ALTER COLUMN close_date TYPE DATE 
    using to_date(close_date, 'MM/DD/YYYY');
  `);
};

exports.down = async function (knex) {
    await knex.raw(`
    ALTER TABLE grants ALTER COLUMN open_date TYPE varchar(255) 
      using to_char(open_date, 'MM/DD/YYYY');
    `);
    await knex.raw(`
    ALTER TABLE grants ALTER COLUMN close_date TYPE varchar(255) 
      using to_char(close_date, 'MM/DD/YYYY');
    `);
};
