const { types } = require('pg');
const { builtins } = require('pg-types');
const { attachPaginate } = require('knex-paginate');
const config = require('../../knexfile');
// eslint-disable-next-line import/order
const knexLib = require('knex');
let knex = knexLib(config[process.env.NODE_ENV || 'production']);
if ((process.env.NODE_ENV || 'production') === 'production') {
    knex.raw('select 1').catch((err) => {
        console.error("Failed to connect to Postgres, will try basic auth", err);
        knex = knexLib(config.productionBasic);
    });
}


// override parser for date fields — just return the raw string content.
//
// The reason for this is that the Date() constructor assumes a timezone when
// parsing a timezone-less Postgres "date" field, then we JSONify that and cause
// off-by-one-day display bugs on the client if there's a TZ difference between
// client and server. Instead, treat these as string that get sent down to client
// and passed into Date() constructor there.
types.setTypeParser(builtins.DATE, (value) => value);

attachPaginate();

module.exports = knex;
