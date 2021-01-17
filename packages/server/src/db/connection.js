const db = process.env.POSTGRES_URL;

const knex = require('knex')({
    client: 'pg',
    connection: db,
    debug: true,
});
const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = knex;
