const db = process.env.POSTGRES_URL;

const knex = require('knex')({
    client: 'pg',
    connection: db,
});

module.exports = knex;
