
const { makeTestServer, getSessionCookie } = require('./route_test_helpers')

describe('/api/exports', () => {
  let server
  let tenantACookie
  let tenantBCookie
  before(async () => {
    server = makeTestServer()
    tenantACookie = await getSessionCookie('mbroussard+unit-test-admin@usdigitalresponse.org')
    tenantBCookie = await getSessionCookie('mbroussard+unit-test-user2@usdigitalresponse.org')
  })
  after(() => {
    server.stop()
  })

  it('returns a response for default period id', async () => {
    await server
      .get('/api/exports')
      .set('Cookie', tenantACookie)
      .expect(200)
  })

  it('returns a response for specific period id', async () => {
    await server
      .get('/api/exports?period_id=1')
      .set('Cookie', tenantACookie)
      .expect(200)
  })

  it('fails for invalid period id', async () => {
    await server
      .get('/api/exports?period_id=100')
      .set('Cookie', tenantACookie)
      .expect(404)
  })

  it('fails for period id belonging to wrong tenant', async () => {
    await server
      .get('/api/exports?period_id=22')
      .set('Cookie', tenantACookie)
      .expect(404)
  })

  it('names output file according to tenant', async () => {
    await server
      .get('/api/exports?period_id=22')
      .set('Cookie', tenantBCookie)
      .expect(200)
      .expect('Content-Disposition', /attachment; filename="California/)
  })
})

// NOTE: This file was copied from tests/server/routes/exports.spec.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
