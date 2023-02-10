require('dotenv').config();

const knex = require('../../../src/db/connection');
const { setupAgencies } = require('./fixtures/add-dummy-data');

module.exports = {
    knex,
    mochaHooks: {
        beforeAll: async () => setupAgencies(knex),
        afterAll: (done) => {
            knex.destroy(done);
        },
    },
};

// NOTE: This file was copied from tests/server/mocha_init.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
