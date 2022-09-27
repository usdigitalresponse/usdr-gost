
const path = require('path')

const express = require('express')
const supertest = require('supertest')
const { sign: signCookie } = require('cookie-signature')

const { configureApp } = requireSrc(path.resolve(__dirname, '../configure'))
const { requestProviderMiddleware } = require('../../../../src/arpa_reporter/use-request')
const { knex } = require('../mocha_init')

async function getSessionCookie (userIdOrEmail) {
  if (typeof userIdOrEmail === 'string') {
    const email = userIdOrEmail
    const user = await knex('users')
      .select('*')
      .where('email', email)
      .then(rows => rows[0])
    if (!user) {
      throw new Error('withSessionCookie got nonexistent email')
    }
    userIdOrEmail = user.id
  }

  const userId = userIdOrEmail

  // NOTE: the structure of this cookie value comes from Express itself, see implementation of
  // Response.cookie() and the cookie-parser middleware
  return `userId=s:${signCookie(String(userId), process.env.COOKIE_SECRET)}`
}

function makeTestServer () {
  const app = express()
  app.use(requestProviderMiddleware)
  configureApp(app, {
    // The normal request logging from Morgan just clutters Mocha's test runner output
    disableRequestLogging: true
  })
  const server = app.listen(0)
  const tester = supertest(server)

  if ('stop' in tester) {
    throw new Error('makeTestServer adds a stop method and expects Supertest not to have its own')
  }

  // We wrap Supertest's object in a proxy because they have inconsistent behavior around closing
  // server sockets (autoclose when calling end(), but not when using async/await) -- so instead we
  // manage the server socket ourselves and provide an extra method to close it.
  //
  // Intended use is makeTestServer is called in before/beforeEach and stop is called in
  // after/afterEach
  return new Proxy(tester, {
    get: function (target, prop, receiver) {
      if (prop === 'stop') {
        return () => server.close()
      }

      return Reflect.get(target, prop, receiver)
    }
  })
}

module.exports = { makeTestServer, getSessionCookie }

// NOTE: This file was copied from tests/server/routes/route_test_helpers.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
