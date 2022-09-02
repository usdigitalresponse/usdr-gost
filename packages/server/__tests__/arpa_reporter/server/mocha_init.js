require('dotenv').config()

const knex = require('../../../src/db/connection')
const { setupAgencies } = require('./fixtures/add-dummy-data')

// `requireSrc(__filename)` is a convenience that performs a
// `require` of the corresponding source file to the current `spec` file.
// `or
// `requireSrc(`${__dirname}/a/path`) does a require of `a/path` relative
// to the corresponding `src` dir of the tests `__dirname`,
global.requireSrc = f =>
  require(f.replace(/\/tests\//, '/src/').replace(/(\.[^.]*)*\.spec/, ''))

module.exports = {
  knex,
  mochaHooks: {
    beforeAll: async () => {
      return setupAgencies(knex)
    },
    afterAll: done => {
      knex.destroy(done)
    }
  }
}

// NOTE: This file was copied from tests/server/mocha_init.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
