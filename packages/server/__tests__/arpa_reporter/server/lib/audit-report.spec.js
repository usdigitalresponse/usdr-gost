const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const { withTenantId } = require('../helpers/with-tenant-id');

function handleUploadFake(type) {
    if (type === 'success') {
        return (options, callback) => {
            console.log('success path');
            callback(undefined, { valid: 'data' });
        };
    }

    return (options, callback) => {
        callback('some error message', {});
    };
}

describe('audit report generation', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
    });
    it('presignAndSendEmail creates a presigned url and sends email to recipient', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAuditReportEmail', sendFake);

        const signedUrlFake = sandbox.fake.returns('just s3');
        signedUrlFake.getSignedUrl = sandbox.fake.returns('http://example.usdigitalresponse.org');
        const s3Fake = sandbox.fake.returns(signedUrlFake);
        sandbox.replace(audit_report, 'getS3Client', s3Fake);

        await audit_report.presignAndSendEmail('99/example.xlsx', 'foo@example.com');

        expect(signedUrlFake.getSignedUrl.calledOnce).to.equal(true);
        expect(signedUrlFake.getSignedUrl.firstCall.firstArg).to.equal('getObject');
        expect(signedUrlFake.getSignedUrl.firstCall.lastArg.Bucket).to.equal('arpa-audit-reports');
        expect(signedUrlFake.getSignedUrl.firstCall.lastArg.Key).to.equal('99/example.xlsx');
        expect(signedUrlFake.getSignedUrl.firstCall.lastArg.Expires).to.equal(604800);

        expect(sendFake.calledOnce).to.equal(true);
        expect(sendFake.firstCall.firstArg).to.equal('foo@example.com');
        expect(sendFake.firstCall.lastArg).to.equal('http://example.usdigitalresponse.org');
    });
    it('generateAndSendEmail generates a report, uploads to s3, and sends an email', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAuditReportEmail', sendFake);

        const presignedFake = sandbox.fake.returns('foo2');
        sandbox.replace(audit_report, 'presignAndSendEmail', presignedFake);

        const generateFake = sandbox.fake.returns({ periodId: 99, filename: 'example.xlsx', outputWorkBook: 'sample-text' });
        sandbox.replace(audit_report, 'generate', generateFake);

        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.upload = sandbox.fake(handleUploadFake('success'));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(audit_report, 'getS3Client', s3Fake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        console.log('Asserting generate function');
        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');

        console.log('Asserting s3 upload function');
        expect(uploadFake.upload.calledOnce).to.equal(true);

        const params = Object.keys(uploadFake.upload.firstCall.firstArg);
        expect(params).to.contain('Bucket');
        expect(params).to.contain('Key');
        expect(params).to.contain('Body');
        expect(params).to.contain('ServerSideEncryption');
        expect(uploadFake.upload.firstCall.firstArg.Bucket).to.equal('arpa-audit-reports');
        expect(uploadFake.upload.firstCall.firstArg.ServerSideEncryption).to.equal('AES256');

        console.log('Asserting presigned and email function');
        expect(presignedFake.calledOnce).to.equal(true);
        expect(presignedFake.firstCall.firstArg).to.equal('99/example.xlsx');
        expect(presignedFake.firstCall.lastArg).to.equal('foo@example.com');
    });
    it('generateAndSendEmail does not send an email if upload fails', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAuditReportEmail', sendFake);

        const presignedFake = sandbox.fake.returns('foo2');
        sandbox.replace(audit_report, 'presignAndSendEmail', presignedFake);

        const generateFake = sandbox.fake.returns({ periodId: 99, filename: 'example.xlsx', outputWorkBook: 'sample-text' });
        sandbox.replace(audit_report, 'generate', generateFake);

        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.upload = sandbox.fake(handleUploadFake('error'));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(audit_report, 'getS3Client', s3Fake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        console.log('Asserting generate function');
        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');

        console.log('Asserting s3 upload function');
        expect(uploadFake.upload.calledOnce).to.equal(true);

        const params = Object.keys(uploadFake.upload.firstCall.firstArg);
        expect(params).to.contain('Bucket');
        expect(params).to.contain('Key');
        expect(params).to.contain('Body');
        expect(params).to.contain('ServerSideEncryption');
        expect(uploadFake.upload.firstCall.firstArg.Bucket).to.equal('arpa-audit-reports');
        expect(uploadFake.upload.firstCall.firstArg.ServerSideEncryption).to.equal('AES256');

        console.log('Asserting presigned and email function');
        expect(presignedFake.notCalled).to.equal(true);
    });
});
