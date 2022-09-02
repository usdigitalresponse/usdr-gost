// this is invoked by mocha_wrapper.sh

module.exports.mochaHooks = {

  beforeAll: async function () {
    //
  },
  afterAll: done => {
    done()
  }
}

// NOTE: This file was copied from tests/server-aws-ses/mocha_init.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
