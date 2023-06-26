const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const aws = require('../../../../src/lib/gost-aws');
const { withTenantId } = require('../helpers/with-tenant-id');

function handleUploadFake(type) {
    if (type === 'success') {
        return () => {
            console.log('success path');
            return { valid: 'data' };
        };
    }

    return () => {
        throw new Error('some error message');
    };
}

describe('audit report generation', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
    });
    it('sendEmailWithLink creates a presigned url and sends email to recipient', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAsyncReportEmail', sendFake);

        await audit_report.sendEmailWithLink('1/99/example.xlsx', 'foo@example.com');

        expect(sendFake.calledOnce).to.equal(true);
        expect(sendFake.firstCall.firstArg).to.equal('foo@example.com');
        expect(sendFake.firstCall.secondArg).to.equal(`${process.env.API_DOMAIN}/api/audit_report/1/99/example.xlsx`);
        expect(sendFake.firstCall.lastArg).to.equal('audit');
    });
    it('generateAndSendEmail generates a report, uploads to s3, and sends an email', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAsyncReportEmail', sendFake);

        const sendEmailFake = sandbox.fake.returns('foo2');
        sandbox.replace(audit_report, 'sendEmailWithLink', sendEmailFake);

        const generateFake = sandbox.fake.returns({ periodId: 99, filename: 'example.xlsx', outputWorkBook: 'sample-text' });
        sandbox.replace(audit_report, 'generate', generateFake);

        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(handleUploadFake('success'));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        console.log('Asserting generate function');
        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');

        console.log('Asserting s3 upload function');
        expect(uploadFake.send.calledOnce).to.equal(true);

        const command = uploadFake.send.firstCall.firstArg.input;
        const params = Object.keys(command);
        expect(params).to.contain('Bucket');
        expect(params).to.contain('Key');
        expect(params).to.contain('Body');
        expect(params).to.contain('ServerSideEncryption');
        expect(command.Bucket).to.equal('arpa-audit-reports');
        expect(command.ServerSideEncryption).to.equal('AES256');

        console.log('Asserting presigned and email function');
        expect(sendEmailFake.calledOnce).to.equal(true);
        expect(sendEmailFake.firstCall.firstArg).to.equal('0/99/example.xlsx');
        expect(sendEmailFake.firstCall.lastArg).to.equal('foo@example.com');
    });
    it('generateAndSendEmail does not send an email if upload fails', async () => {
        const sendFake = sandbox.fake.returns('foo');
        sandbox.replace(email, 'sendAsyncReportEmail', sendFake);

        const sendEmailFake = sandbox.fake.returns('foo2');
        sandbox.replace(audit_report, 'sendEmailWithLink', sendEmailFake);

        const generateFake = sandbox.fake.returns({ periodId: 99, filename: 'example.xlsx', outputWorkBook: 'sample-text' });
        sandbox.replace(audit_report, 'generate', generateFake);

        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(handleUploadFake('error'));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        console.log('Asserting generate function');
        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');

        console.log('Asserting s3 upload function');
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        const params = Object.keys(command);
        expect(params).to.contain('Bucket');
        expect(params).to.contain('Key');
        expect(params).to.contain('Body');
        expect(params).to.contain('ServerSideEncryption');
        expect(command.Bucket).to.equal('arpa-audit-reports');
        expect(command.ServerSideEncryption).to.equal('AES256');

        console.log('Asserting presigned and email function');
        expect(sendEmailFake.notCalled).to.equal(true);
    });
});
