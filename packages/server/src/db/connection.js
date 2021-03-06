const db = process.env.NODE_ENV !== 'test' ? process.env.POSTGRES_URL : process.env.POSTGRES_TEST_URL;

const knex = require('knex')({
    client: 'pg',
    connection: db,
    debug: process.env.KNEX_DEBUG === 'true',
});
const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = knex;
