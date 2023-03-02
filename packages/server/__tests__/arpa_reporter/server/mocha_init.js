require('dotenv').config();

const knex = require('../../../src/db/connection');
const { setupAgencies } = require('./fixtures/add-dummy-data');

// `requireSrc(__filename)` is a convenience that performs a
// `require` of the corresponding source file to the current `spec` file.
// `or
// `requireSrc(`${__dirname}/a/path`) does a require of `a/path` relative
// to the corresponding `src` dir of the tests `__dirname`,
global.requireSrc = function requireSrc(fpath) {
    return require(
        fpath
            .replace(/(\.[^.]*)*\.spec/, '')
        // GOST repo path of ARPA Reporter code
            .replace(/\/__tests__\/arpa_reporter\/server\//, '/src/arpa_reporter/')
        // Legacy ARPA repo paths
            .replace(/\/tests\//, '/src/'),
    );
};

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
