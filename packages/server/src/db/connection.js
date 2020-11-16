const db = process.env.POSTGRES_URL;

const knex = require('knex')({
    client: 'pg',
    connection: db,
});
const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = knex;
