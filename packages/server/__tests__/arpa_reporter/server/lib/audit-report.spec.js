const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const { withTenantId } = require('../helpers/with-tenant-id');

describe('audit report generation', () => {
    it('generateAndSendEmail generates a report, uploads to s3, and sends an email', async () => {
        const sendFake = sinon.fake.returns('foo');
        sinon.replace(email, 'sendAuditReportEmail', sendFake);

        const generateFake = sinon.fake.returns('bar');
        sinon.replace(audit_report, 'generate', generateFake);

        const uploadFake = sinon.fake.returns(null);
        const s3Fake = sinon.fake.returns({ upload: uploadFake });
        sinon.replace(audit_report, 'getS3Client', s3Fake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');

        expect(s3Fake.upload.calledOnce.firstCall.firstArg).to.equal({});
    });
});
