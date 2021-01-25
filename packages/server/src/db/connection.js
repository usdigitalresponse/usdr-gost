const db = process.env.POSTGRES_URL;

const knex = require('knex')({
    client: 'pg',
    connection: db,
    debug: process.env.KNEX_DEBUG === 'true',
});
const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = knex;
