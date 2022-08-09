const { attachPaginate } = require('knex-paginate');
const config = require('../../knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(config[process.env.NODE_ENV || 'production']);

attachPaginate();

module.exports = knex;
