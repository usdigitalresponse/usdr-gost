const { expect } = require('chai');
const { makeTestServer, getSessionCookie } = require('./route_test_helpers');
const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');

describe('/api/audit_report', () => {
    let server;
    let tenantACookie;
    before(async () => {
        server = await makeTestServer();
        tenantACookie = await getSessionCookie('mbroussard+unit-test-admin@usdigitalresponse.org');
    });
    after(() => {
        server.stop();
    });

    it('Ensures async audit report generation returns 200', async () => {
        audit_report.generateAndSendEmail = () => 'success';

        await server
            .get('/api/audit_report?async=true')
            .set('Cookie', tenantACookie)
            .expect(200);
    });
    it('Ensures it returns an error property when there is an issue', async () => {
        audit_report.generateAndSendEmail = () => {
            throw new Error('Some error message');
        };

        const response = await server
            .get('/api/audit_report?async=true')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(500);
        expect(response._body.error).to.equal('Unable to generate audit report and send email.');
    });
});
