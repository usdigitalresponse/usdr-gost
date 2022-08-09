// const db = process.env.NODE_ENV !== 'test' ? process.env.POSTGRES_URL : (process.env.POSTGRES_TEST_URL || 'postgresql://localhost:5432/usdr_grants_test');
const { attachPaginate } = require('knex-paginate');
const config = require('./knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(config[process.env.NODE_ENV || 'production']);
// const knex = require('knex')({
//     client: 'pg',
//     connection: db,
//     seeds: {
//         directory: './seeds',
//     },
//     migrations: {
//         directory: './migrations',
//     },
//     debug: process.env.NODE_ENV === 'staging',
// });

attachPaginate();

module.exports = knex;
