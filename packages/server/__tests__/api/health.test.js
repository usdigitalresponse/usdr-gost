const { makeTestServer } = require('./utils');

describe('/api/health', () => {
    let server;
    before(async () => {
        server = await makeTestServer();
    });
    after(() => {
        server.stop();
    });

    // This is an admittedly dumb thing to test, it's really just here to validate
    // supertest works properly.
    it('returns 200', async () => {
        await server
            .get('/api/health')
            .expect(200)
            .expect({ success: true, db: 'OK' });
    });
});
