const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../../../src/lib/email');

const audit_report = require('../../../../src/arpa_reporter/lib/audit-report');
const aws = require('../../../../src/lib/gost-aws');
const { withTenantId } = require('../helpers/with-tenant-id');

const OLD_AUDIT_REPORT_BUCKET = process.env.AUDIT_REPORT_BUCKET;

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
    beforeEach(() => {
        process.env.AUDIT_REPORT_BUCKET = 'arpa-audit-reports';
    });
    afterEach(() => {
        process.env.AUDIT_REPORT_BUCKET = OLD_AUDIT_REPORT_BUCKET;
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

    it('getRecordsByProject should group with a mapping', async () => {
        const records = [
            {
                type: 'awards50k',
                subcategory: 'Subcategory 1',
                upload: {
                    filename: 'filename.xlsm',
                    created_at: '2023-07-13T02:24:07.848Z',
                    reporting_period_id: 1,
                    user_id: 1,
                    agency_id: 0,
                    validated_at: '2023-07-13T02:24:08.252Z',
                    validated_by: 1,
                    ec_code: '1.00',
                    tenant_id: 1,
                    id: '601a2011-91d5-4acb-b83e-f47ee8ae462f',
                    notes: null,
                    invalidated_at: null,
                    invalidated_by: null,
                    created_by: 'test@usdigitalresponse.org',
                    agency_code: 'USDR',
                },
                content: {
                    Recipient_UEI__c: 'TEST-UEI',
                    Recipient_EIN__c: 'TEST-EIN',
                    Entity_Type_2__c: 'Contractor',
                    Project_Identification_Number__c: 'ProjectID 1',
                    Award_No__c: 'AWARD 1',
                    Award_Type__c: 'Contract',
                    Award_Amount__c: 300000,
                    Award_Date__c: '2022-03-29T04:00:00.000Z',
                    Primary_Sector__c: 'Sector',
                    Purpose_of_Funds__c: 'A sample fund',
                    Period_of_Performance_Start__c: '2022-02-01T05:00:00.000Z',
                    Period_of_Performance_End__c: '2022-08-31T04:00:00.000Z',
                    Place_of_Performance_Address_1__c: '',
                    Place_of_Performance_Address_2__c: '',
                    Place_of_Performance_City__c: '',
                    State_Abbreviated__c: '',
                    Place_of_Performance_Zip__c: '',
                    Description__c: 'Sample description',
                    Subaward_Changed__c: 'No',
                },
            },
            {
                type: 'awards50k',
                subcategory: 'Subcategory 2',
                upload: {
                    filename: 'filename.xlsm',
                    created_at: '2023-07-13T02:24:07.848Z',
                    reporting_period_id: 1,
                    user_id: 1,
                    agency_id: 0,
                    validated_at: '2023-07-13T02:24:08.252Z',
                    validated_by: 1,
                    ec_code: '1.00',
                    tenant_id: 1,
                    id: '601a2011-91d5-4acb-b83e-f47ee8ae462f',
                    notes: null,
                    invalidated_at: null,
                    invalidated_by: null,
                    created_by: 'test@usdigitalresponse.org',
                    agency_code: 'USDR',
                },
                content: {
                    Recipient_UEI__c: 'TEST-UEI2',
                    Recipient_EIN__c: 'TEST-EIN2',
                    Entity_Type_2__c: 'Contractor',
                    Project_Identification_Number__c: 'ProjectID 2',
                    Award_No__c: 'AWARD 2',
                    Award_Type__c: 'Contract',
                    Award_Amount__c: 300000,
                    Award_Date__c: '2022-03-29T04:00:00.000Z',
                    Primary_Sector__c: 'Sector',
                    Purpose_of_Funds__c: 'A sample fund',
                    Period_of_Performance_Start__c: '2022-02-01T05:00:00.000Z',
                    Period_of_Performance_End__c: '2022-08-31T04:00:00.000Z',
                    Place_of_Performance_Address_1__c: '',
                    Place_of_Performance_Address_2__c: '',
                    Place_of_Performance_City__c: '',
                    State_Abbreviated__c: '',
                    Place_of_Performance_Zip__c: '',
                    Description__c: 'Sample description',
                    Subaward_Changed__c: 'No',
                },
            },
            {
                type: 'expenditures50k',
                subcategory: 'Subcategory',
                upload: {
                    filename: 'filename.xlsm',
                    created_at: '2023-07-13T02:24:07.848Z',
                    reporting_period_id: 2,
                    user_id: 1,
                    agency_id: 0,
                    validated_at: '2023-07-13T02:24:08.252Z',
                    validated_by: 1,
                    ec_code: '2.32',
                    tenant_id: 1,
                    id: '601a2011-91d5-4acb-b83e-f47ee8ae462f',
                    notes: null,
                    invalidated_at: null,
                    invalidated_by: null,
                    created_by: 'test@usdigitalresponse.org',
                    agency_code: 'USDR',
                },
                content: {
                    Sub_Award_Lookup__c: 'AWARD 1',
                    Expenditure_Start__c: '2022-03-04T05:00:00.000Z',
                    Expenditure_End__c: '2022-03-29T04:00:00.000Z',
                    Expenditure_Amount__c: 150000,
                },
            },
            {
                type: 'expenditures50k',
                subcategory: '2.32-Business Incubators and Start-Up or Expansion Assistance',
                upload: {
                    filename: 'filename.xlsm',
                    created_at: '2023-07-13T02:24:07.848Z',
                    reporting_period_id: 2,
                    user_id: 1,
                    agency_id: 0,
                    validated_at: '2023-07-13T02:24:08.252Z',
                    validated_by: 1,
                    ec_code: '2.32',
                    tenant_id: 1,
                    id: '601a2011-91d5-4acb-b83e-f47ee8ae462f',
                    notes: null,
                    invalidated_at: null,
                    invalidated_by: null,
                    created_by: 'test@usdigitalresponse.org',
                    agency_code: 'USDR',
                },
                content: {
                    Sub_Award_Lookup__c: 'AWARD 2',
                    Expenditure_Start__c: '2022-03-04T05:00:00.000Z',
                    Expenditure_End__c: '2022-03-29T04:00:00.000Z',
                    Expenditure_Amount__c: 150000,
                },
            },
            // different filename to test missing
            {
                type: 'expenditures50k',
                subcategory: '2.32-Business Incubators and Start-Up or Expansion Assistance',
                upload: {
                    filename: 'filename2.xlsm',
                    created_at: '2023-07-13T02:24:07.848Z',
                    reporting_period_id: 2,
                    user_id: 1,
                    agency_id: 0,
                    validated_at: '2023-07-13T02:24:08.252Z',
                    validated_by: 1,
                    ec_code: '2.32',
                    tenant_id: 1,
                    id: '601a2011-91d5-4acb-b83e-f47ee8ae462f',
                    notes: null,
                    invalidated_at: null,
                    invalidated_by: null,
                    created_by: 'test@usdigitalresponse.org',
                    agency_code: 'USDR',
                },
                content: {
                    Sub_Award_Lookup__c: 'AWARD 2',
                    Expenditure_Start__c: '2022-03-04T05:00:00.000Z',
                    Expenditure_End__c: '2022-03-29T04:00:00.000Z',
                    Expenditure_Amount__c: 150000,
                },
            },
        ];
        const groups = audit_report.getRecordsByProject(records);
        expect(groups['ProjectID 1'].length).to.equal(2);
        expect(groups['ProjectID 2'].length).to.equal(2);
        expect(groups['MISSING PROJECT'].length).to.equal(1);
    });
});
