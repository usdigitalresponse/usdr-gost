
const { makeTestServer } = require('./route_test_helpers')

describe('/api/health', () => {
  let server
  before(() => {
    server = makeTestServer()
  })
  after(() => {
    server.stop()
  })

  // This is an admittedly dumb thing to test, it's really just here to validate
  // supertest works properly.
  it('returns 200', async () => {
    await server
      .get('/api/health')
      .expect(200)
      .expect({ success: true, db: 'OK' })
  })
})

// NOTE: This file was copied from tests/server/routes/health.spec.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
