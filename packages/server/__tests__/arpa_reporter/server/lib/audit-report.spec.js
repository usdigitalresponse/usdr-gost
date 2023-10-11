const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const aws = require('../../../../src/lib/gost-aws');
const { withTenantId } = require('../helpers/with-tenant-id');
const { response } = require('./response');

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
        expect(sendEmailFake.firstCall.args[1]).to.equal('foo@example.com');
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
        )).to.be.rejected;

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

    it('generate audit report components', async () => {
        const allData = response;
        const cachedData = Object.keys(response).reduce((x, y) => { x[y] = response[y].slice(0, -1); return x; }, {});
        const dataWithCache = Object.keys(response).reduce((x, y) => { x[y] = [response[y][response[y].length - 1]]; return x; }, {});
        const periodId = 1;
        const tenantId = 0;
        const domain = 'test';

        const obligationStub = sandbox.stub(audit_report, 'getObligationData');
        obligationStub.returns(allData.obligations);
        const obligationsNoCache = await audit_report.createObligationSheet(periodId, domain, tenantId, null);
        obligationStub.returns(dataWithCache.obligations);
        const obligationsWithCache = await audit_report.createObligationSheet(periodId, domain, tenantId, cachedData.obligations);
        expect(JSON.stringify(obligationsNoCache)).to.equal(JSON.stringify(obligationsWithCache));

        const projectSummariesStub = sandbox.stub(audit_report, 'getProjectSummariesData');
        projectSummariesStub.returns(allData.projectSummaries);
        const projectSummariesNoCache = await audit_report.createProjectSummariesSheet(periodId, domain, tenantId, null);
        projectSummariesStub.returns(dataWithCache.projectSummaries);
        const projectSummariesWithCache = await audit_report.createProjectSummariesSheet(periodId, domain, tenantId, cachedData.projectSummaries);
        expect(JSON.stringify(projectSummariesNoCache)).to.equal(JSON.stringify(projectSummariesWithCache));

        const projectSummaryGroupedByProjectStub = sandbox.stub(audit_report, 'getReportsGroupedByProjectData');
        projectSummaryGroupedByProjectStub.returns(allData.projectSummaryGroupedByProject);
        const projectSummaryGroupedByProjectNoCache = await audit_report.createReportsGroupedByProjectSheet(periodId, tenantId, null);
        projectSummaryGroupedByProjectStub.returns(dataWithCache.projectSummaryGroupedByProject);
        const projectSummaryGroupedByProjectWithCache = await audit_report.createReportsGroupedByProjectSheet(periodId, tenantId, cachedData.projectSummaryGroupedByProject);
        expect(JSON.stringify(projectSummaryGroupedByProjectNoCache)).to.equal(JSON.stringify(projectSummaryGroupedByProjectWithCache));

        const kpiDataStub = sandbox.stub(audit_report, 'getKpiDataGroupedByProjectData');
        kpiDataStub.returns(allData.KPIDataGroupedByProject);
        const kpiDataNoCache = await audit_report.createKpiDataGroupedByProjectSheet(periodId, tenantId, null);
        kpiDataStub.returns(dataWithCache.KPIDataGroupedByProject);
        const kpiDataWithCache = await audit_report.createKpiDataGroupedByProjectSheet(periodId, tenantId, cachedData.KPIDataGroupedByProject);
        expect(JSON.stringify(kpiDataNoCache)).to.equal(JSON.stringify(kpiDataWithCache));
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
