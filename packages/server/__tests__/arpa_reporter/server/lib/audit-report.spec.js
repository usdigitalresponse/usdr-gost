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
        expect(sendFake.firstCall.args[0]).to.equal('foo@example.com');
        expect(sendFake.firstCall.args[1]).to.equal(`${process.env.API_DOMAIN}/api/audit_report/1/99/example.xlsx`);
        expect(sendFake.firstCall.args[2]).to.equal('audit');
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
        await expect(withTenantId(
            tenantId,
            () => audit_report.generateAndSendEmail('usdigitalresponse.org', 'foo@example.com'),
        )).to.be.rejectedWith(Error);

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

    it('headers should be in the proper order', () => {
        const projects = [{
            '09-30-2021 Total Aggregate Expenditures': 150000,
            '09-30-2022 Total Aggregate Obligations': 300000,
            '09-30-2022 Total Expenditures for Awards Greater or Equal to $50k': 0,
            '09-30-2022 Total Obligations for Awards Greater or Equal to $50k': 0,
            'Capital Expenditure Amount': 0,
            'Project Description': 'Sample description',
            'Project Expenditure Category': '2.32-Business Incubators and Start-Up or Expansion Assistance',
            'Project Expenditure Category Group': '2-Negative Economic Impacts',
            'Project ID': '4',
        }, {
            '12-31-2022 Total Aggregate Expenditures': 150000,
            '12-31-2022 Total Aggregate Obligations': 300000,
            '12-31-2022 Total Expenditures for Awards Greater or Equal to $50k': 0,
            '12-31-2022 Total Obligations for Awards Greater or Equal to $50k': 0,
            'Capital Expenditure Amount': 0,
            'Project Description': 'Sample description',
            'Project Expenditure Category': '2.32-Business Incubators and Start-Up or Expansion Assistance',
            'Project Expenditure Category Group': '2-Negative Economic Impacts',
            'Project ID': '4',
        }, {
            '03-30-2023 Total Aggregate Expenditures': 150000,
            '03-30-2023 Total Aggregate Obligations': 300000,
            '03-30-2023 Total Expenditures for Awards Greater or Equal to $50k': 0,
            '03-30-2023 Total Obligations for Awards Greater or Equal to $50k': 0,
            'Capital Expenditure Amount': 0,
            'Project Description': 'Sample description',
            'Project Expenditure Category': '2.32-Business Incubators and Start-Up or Expansion Assistance',
            'Project Expenditure Category Group': '2-Negative Economic Impacts',
            'Project ID': '4',
        }];
        const headers = audit_report.createHeadersProjectSummariesV2(projects);
        const headersExpected = [
            'Project ID',
            'Project Description',
            'Project Expenditure Category Group',
            'Project Expenditure Category',
            'Capital Expenditure Amount',
            '09-30-2021 Total Aggregate Obligations',
            '12-31-2022 Total Aggregate Obligations',
            '03-30-2023 Total Aggregate Obligations',
            '09-30-2022 Total Aggregate Expenditures',
            '12-31-2022 Total Aggregate Expenditures',
            '03-30-2023 Total Aggregate Expenditures',
            '09-30-2022 Total Obligations for Awards Greater or Equal to $50k',
            '12-31-2022 Total Obligations for Awards Greater or Equal to $50k',
            '03-30-2023 Total Obligations for Awards Greater or Equal to $50k',
            '09-30-2022 Total Expenditures for Awards Greater or Equal to $50k',
            '12-31-2022 Total Expenditures for Awards Greater or Equal to $50k',
            '03-30-2023 Total Expenditures for Awards Greater or Equal to $50k',
        ];
        expect(headers[1]).to.equal(headersExpected[1]);
    });
});
