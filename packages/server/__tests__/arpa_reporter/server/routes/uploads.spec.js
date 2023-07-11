const assert = require('assert');
const sinon = require('sinon');
const { makeTestServer, getSessionCookie } = require('./route_test_helpers');
const fixtures = require('../fixtures/fixtures');
const { knex } = require('../mocha_init');

describe('/api/invalidate', () => {
    let server;
    let tenantACookie;

    before(async () => {
        await fixtures.seed(knex);
        server = await makeTestServer();
        tenantACookie = await getSessionCookie('mbroussard+unit-test-admin@usdigitalresponse.org');
    });
    after(async () => {
        server.stop();
        await fixtures.clean(knex);
    });

    const sandbox = sinon.createSandbox();

    afterEach(async () => {
        sandbox.restore();
    });

    it('Ensures async audit report generation returns 200', async () => {
        const { upload1 } = fixtures.uploads;

        await server
            .post(`/api/uploads/${upload1.id}/invalidate`)
            .set('Cookie', tenantACookie)
            .expect(200);

        const rows = await knex('uploads')
            .where('id', upload1.id)
            .select('uploads.*');

        const row = rows[0];
        assert(row.invalidated_by !== null);
        assert(row.invalidated_at !== null);
        assert(row.validated_at === null);
        assert(row.validated_by === null);
    });
});
