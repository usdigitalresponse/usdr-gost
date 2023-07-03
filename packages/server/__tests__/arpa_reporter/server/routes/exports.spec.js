const { expect } = require('chai');
const sinon = require('sinon');

const { makeTestServer, getSessionCookie } = require('./route_test_helpers');
const arpa = require('../../../../src/arpa_reporter/services/generate-arpa-report');
const aws = require('../../../../src/lib/gost-aws');

function headObjectFake(type, callback) {
    if (type === 'error') {
        return () => { throw new Error('issue with finding s3 object'); };
    }

    return callback;
}

function signedUrlFake(type) {
    if (type === 'error') {
        return () => { throw new Error('issue with generating signed URL'); };
    }

    return () => 'http://s3.amazonaws.com/sample.xlsx';
}

describe('/api/exports', () => {
    let server;
    let tenantACookie;
    let tenantBCookie;
    before(async () => {
        server = await makeTestServer();
        tenantACookie = await getSessionCookie('mbroussard+unit-test-admin@usdigitalresponse.org');
        tenantBCookie = await getSessionCookie('mbroussard+unit-test-user2@usdigitalresponse.org');
    });
    after(() => {
        server.stop();
    });

    const sandbox = sinon.createSandbox();

    afterEach(async () => {
        sandbox.restore();
    });

    it('returns a response for default period id', async () => {
        await server
            .get('/api/exports')
            .set('Cookie', tenantACookie)
            .expect(200);
    });

    it('returns a response for specific period id', async () => {
        await server
            .get('/api/exports?period_id=1')
            .set('Cookie', tenantACookie)
            .expect(200);
    });

    it('fails for invalid period id', async () => {
        await server
            .get('/api/exports?period_id=100')
            .set('Cookie', tenantACookie)
            .expect(404);
    });

    it('fails for period id belonging to wrong tenant', async () => {
        await server
            .get('/api/exports?period_id=22')
            .set('Cookie', tenantACookie)
            .expect(404);
    });

    it('names output file according to tenant', async () => {
        await server
            .get('/api/exports?period_id=22')
            .set('Cookie', tenantBCookie)
            .expect(200)
            .expect('Content-Disposition', /attachment; filename="California/);
    });

    it('Ensures async treasury report generation returns 200', async () => {
        arpa.generateAndSendEmail = () => 'success';

        await server
            .get('/api/exports?async=true')
            .set('Cookie', tenantACookie)
            .expect(200);
    });
    it('Ensures async treasury report generation returns an error property when there is an issue', async () => {
        arpa.generateAndSendEmail = () => {
            throw new Error('Some error message');
        };

        const response = await server
            .get('/api/exports?async=true')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(500);
        expect(response._body.error).to.equal('Unable to generate treasury report and send email.');
    });
    it('Signed URL - redirects for unauthorized users', async () => {
        const response = await server
            .get('/api/exports/0/99/example.xlsx');

        expect(response.status).to.equal(302);
        expect(response.headers.location).to.equal('http://localhost:8080/arpa_reporter/login?redirect_to=/api/exports/0/99/example.xlsx&message=Please%20login%20to%20visit%20the%20link.');
    });
    it('Signed URL - redirects when object is not found', async () => {
        const s3InstanceFake = sandbox.fake.returns('just s3');
        const headObject = sandbox.fake.returns('h object');
        headObjectFake.promise = sandbox.fake.returns('promise');
        s3InstanceFake.headObject = sandbox.fake(headObjectFake('error', headObject));
        const s3Fake = sandbox.fake.returns(s3InstanceFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const response = await server
            .get('/api/exports/0/99/example.xlsx')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(302);
        expect(response.headers.location).to.equal(`http://localhost:8080/arpa_reporter?alert_text=The%20treasury%20report%20you%20requested%20has%20expired.%20Please%20try%20again%20by%20clicking%20the%20'Send%20Treasury%20Report%20By%20Email'.&alert_level=err`);
    });
    it('Signed URL - redirects to login page when user is accessing wrong tenant', async () => {
        const s3InstanceFake = sandbox.fake.returns('just s3');
        const headObject = sandbox.fake.returns('h object');
        headObjectFake.promise = sandbox.fake.returns('promise');
        s3InstanceFake.headObject = sandbox.fake(headObjectFake('error', headObject));
        const s3Fake = sandbox.fake.returns(s3InstanceFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const response = await server
            .get('/api/exports/1/99/example.xlsx')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(302);
        expect(response.headers.location).to.equal(`http://localhost:8080/arpa_reporter/login?redirect_to=/api/exports/1/99/example.xlsx&message=Please%20login%20to%20visit%20the%20link.`);
    });
    it('Signed URL - returns redirect with message when there is an issue generating URL', async () => {
        const s3InstanceFake = sandbox.fake.returns('just s3');
        const objReturnFake = sandbox.fake.returns('some_return');
        objReturnFake.promise = sandbox.fake.returns('promise return');
        const headObject = sandbox.fake.returns(objReturnFake);
        s3InstanceFake.send = sandbox.fake(headObjectFake('success', headObject));
        sandbox.replace(aws, 'getSignedUrl', sandbox.fake(signedUrlFake('error')));
        const s3Fake = sandbox.fake.returns(s3InstanceFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const response = await server
            .get('/api/exports/0/99/example.xlsx')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(302);
        expect(response.headers.location).to.equal(`http://localhost:8080/arpa_reporter?alert_text=Something%20went%20wrong.%20Please%20reach%20out%20to%20grants-helpdesk@usdigitalresponse.org.&alert_level=err`);
    });
    it('Signed URL - Success response', async () => {
        const s3InstanceFake = sandbox.fake.returns('just s3');
        const objReturnFake = sandbox.fake.returns('some_return');
        objReturnFake.promise = sandbox.fake.returns('promise return');
        const headObject = sandbox.fake.returns(objReturnFake);
        s3InstanceFake.send = sandbox.fake(headObjectFake('success', headObject));
        sandbox.replace(aws, 'getSignedUrl', sandbox.fake(signedUrlFake('success')));
        const s3Fake = sandbox.fake.returns(s3InstanceFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const response = await server
            .get('/api/exports/0/99/example.xlsx')
            .set('Cookie', tenantACookie);

        expect(response.status).to.equal(302);
        expect(response.headers.location).to.equal(`http://s3.amazonaws.com/sample.xlsx`);
    });
});

// NOTE: This file was copied from tests/server/routes/exports.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
