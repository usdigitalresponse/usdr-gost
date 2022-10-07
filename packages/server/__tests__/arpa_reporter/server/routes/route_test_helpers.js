
const { getSessionCookie, makeTestServer: gost_makeTestServer } = require('../../../../__tests__/api/utils');
const { configureApp } = require('../../../../src/arpa_reporter/configure');
const {requestProviderMiddleware} = require('../../../../src/arpa_reporter/use-request');

function makeTestServer () {
  return gost_makeTestServer(app => {
    // GOST's configureApp does this automatically, but ARPA's does not (because it expects to
    // be called after GOST's). However, while tests are still separate, we create a server with
    // only ARPA routes. Thus, we need to set this up manually here. If we unify tests and have
    // all routes registered, we won't need this extra call.
    app.use(requestProviderMiddleware);

    configureApp(app, {
      // The normal request logging from Morgan just clutters Mocha's test runner output
      disableRequestLogging: true,
    });
  });
}

module.exports = { makeTestServer, getSessionCookie }

// NOTE: This file was copied from tests/server/routes/route_test_helpers.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
