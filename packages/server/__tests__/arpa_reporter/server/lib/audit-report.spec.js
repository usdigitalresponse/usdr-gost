const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const { withTenantId } = require('../helpers/with-tenant-id');

describe('audit report generation', () => {
    it('generateAndSendEmail generates a report, uploads to s3, and sends an email', async () => {
        const sendFake = sinon.fake.returns('foo');
        const generateFake = sinon.fake.returns('bar');
        sinon.replace(email, 'sendAuditReportEmail', sendFake);
        sinon.replace(audit_report, 'generate', generateFake);

        const tenantId = 0;
        await withTenantId(tenantId, () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'));

        expect(generateFake.calledOnce).to.equal(true);
        expect(generateFake.firstCall.firstArg).to.equal('usdigitalresponse.org');
        expect(sendFake.calledOnce).to.equal(true);
        expect(sendFake.firstCall.args.length).to.equal(2);
        expect(sendFake.firstCall.firstArg).to.equal('foo@example.com');
        expect(sendFake.firstCall.lastArg).to.equal('https://google.com');
    });
});
