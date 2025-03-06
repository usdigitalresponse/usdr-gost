const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');

const full_file_export = require('../../../../src/arpa_reporter/services/full-file-export');
const aws = require('../../../../src/lib/gost-aws');

const { knex } = require('../mocha_init');
const fixtures = require('../fixtures/fixtures');

const OLD_AUDIT_REPORT_BUCKET = process.env.AUDIT_REPORT_BUCKET;
const OLD_ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL;

describe('FullFileExport', () => {
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        // Override environment variables for testing
        process.env.AUDIT_REPORT_BUCKET = 'example-bucket-name';
        process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = 'http://sqs.example.com/full-file-export-queue';
    });
    afterEach(() => {
        // Restore environment variables as not doing so could impact other tests outside of this module
        process.env.AUDIT_REPORT_BUCKET = OLD_AUDIT_REPORT_BUCKET;
        process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = OLD_ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL;
        sandbox.restore();
    });
    it('ensures getUploadsForArchive queries the database and returns only uploads for one tenant', async () => {
        await fixtures.seed(knex);
        const testSpecificUploads = {
            xlsUpload: {
                filename: '1.134 Signed Off Report. ARPA Projects.xls',
                reporting_period_id: fixtures.reportingPeriods.q1_2021.id,
                user_id: fixtures.users.adminUser.id,
                agency_id: fixtures.agencies.accountancy.id,
                ec_code: '1.134',
                tenant_id: fixtures.TENANT_ID,
                id: '00000000-0000-0000-0000-000000000098',
                notes: null,
                validated_at: '2022-01-01',
                validated_by: fixtures.users.adminUser.id,
                invalidated_at: null,
                invalidated_by: null,
            },
            xlsxUpload: {
                filename: '1.1456 Report XLSX Type Example.xlsx',
                reporting_period_id: fixtures.reportingPeriods.q1_2021.id,
                user_id: fixtures.users.adminUser.id,
                agency_id: fixtures.agencies.accountancy.id,
                ec_code: '1.1456',
                tenant_id: fixtures.TENANT_ID,
                id: '00000000-0000-0000-0000-000000000099',
                notes: null,
                validated_at: '2022-01-01',
                validated_by: fixtures.users.adminUser.id,
                invalidated_at: null,
                invalidated_by: null,
            },
        };
        await knex('uploads').insert(Object.values(testSpecificUploads));

        // These results are based on the fixtures data within fixtures.js file.
        const expectedResult = [
            // fixtures.uploads.upload1
            {
                upload_id: '00000000-0000-0000-0000-000000000000',
                original_filename: 'test-filename-1.xlsm',
                filename_in_zip: 'test-filename-1--00000000-0000-0000-0000-000000000000.xlsm',
                path_in_zip: 'Quarterly 1/Final Treasury/test-filename-1--00000000-0000-0000-0000-000000000000.xlsm',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1',
                reporting_period_name: 'Quarterly 1',
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            {
                upload_id: '00000000-0000-0000-0000-000000000098',
                original_filename: '1.134 Signed Off Report. ARPA Projects.xls',
                filename_in_zip: '1.134 Signed Off Report. ARPA Projects--00000000-0000-0000-0000-000000000098.xls',
                path_in_zip: 'Quarterly 1/Final Treasury/1.134 Signed Off Report. ARPA Projects--00000000-0000-0000-0000-000000000098.xls',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.134',
                reporting_period_name: 'Quarterly 1',
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            {
                upload_id: '00000000-0000-0000-0000-000000000099',
                original_filename: '1.1456 Report XLSX Type Example.xlsx',
                filename_in_zip: '1.1456 Report XLSX Type Example--00000000-0000-0000-0000-000000000099.xlsx',
                path_in_zip: 'Quarterly 1/Final Treasury/1.1456 Report XLSX Type Example--00000000-0000-0000-0000-000000000099.xlsx',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1456',
                reporting_period_name: 'Quarterly 1',
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            // fixtures.uploads.upload2
            {
                upload_id: '00000000-0000-0000-0000-000000000001',
                original_filename: 'test-filename-2.xlsm',
                filename_in_zip: 'test-filename-2--00000000-0000-0000-0000-000000000001.xlsm',
                path_in_zip: 'Quarterly 1/Not Final Treasury/Invalid files/test-filename-2--00000000-0000-0000-0000-000000000001.xlsm',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1',
                reporting_period_name: 'Quarterly 1',
                validity: `Did not pass validation at 2023-03-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org`,
            },
            // fixtures.uploads.upload4_invalidated
            {
                upload_id: '00000000-0000-0000-0000-000000000003',
                original_filename: 'test-filename-4.xlsm',
                filename_in_zip: 'test-filename-4--00000000-0000-0000-0000-000000000003.xlsm',
                path_in_zip: 'Quarterly 1/Not Final Treasury/Invalid files/test-filename-4--00000000-0000-0000-0000-000000000003.xlsm',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1',
                reporting_period_name: 'Quarterly 1',
                validity: 'Invalidated at 2023-03-02T00:00:00 by mbroussard+unit-test-user2@usdigitalresponse.org',
            },
            // fixtures.uploads.upload5_new_quarter
            {
                upload_id: '00000000-0000-0000-0000-000000000004',
                original_filename: 'test-filename-5.xlsm',
                filename_in_zip: 'test-filename-5--00000000-0000-0000-0000-000000000004.xlsm',
                path_in_zip: 'Quarterly 2/Not Final Treasury/Invalid files/test-filename-5--00000000-0000-0000-0000-000000000004.xlsm',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1',
                reporting_period_name: 'Quarterly 2',
                validity: `Did not pass validation at 2023-03-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org`,
            },
        ];

        // Get uploads for the tenant with ID `TENANT_ID`
        const uploads = await full_file_export.getUploadsForArchive(fixtures.TENANT_ID);

        // Ensures that `upload3` which belongs in a different tenant is not included in the results
        expect(uploads).to.deep.equal(expectedResult);

        // Clean up and remove fixtures
        await fixtures.clean(knex);
    });
    it('should add message to the queue', async () => {
        // stub generateAndUploadMetadata as the unit test is not testing the database query and s3 upload functionality
        sandbox.stub(full_file_export, 'generateAndUploadMetadata').resolves(undefined);

        // stub sqs client and SendMessageCommand
        const messageFake = sandbox.fake.returns('just sqs');
        messageFake.send = sandbox.fake(() => {});
        const sqsFake = sandbox.fake.returns(messageFake);
        sandbox.replace(aws, 'getSQSClient', sqsFake);

        await full_file_export.addMessageToQueue(1, 'person@example.com');

        // Check if SQS client was called with correct parameters
        expect(messageFake.send.calledOnce).to.equal(true);
        const command = messageFake.send.firstCall.firstArg.input;
        expect(command.QueueUrl).to.equal(process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL);
        expect(command.MessageBody).to.contain('{"s3":{"bucket":"example-bucket-name","zip_key":"full-file-export/org_1/archive.zip","metadata_key":"full-file-export/org_1/metadata.csv"},"organization_id":1,"user_email":"person@example.com"}');
    });
    it('should generate and upload metadata', async () => {
        const organizationId = 1;
        const s3Key = 'test-key';
        const data = [
            {
                upload_id: 'abcdef',
                original_filename: 'Approved File.xlsm',
                path_in_zip: 'Quarter 1/Approved File_abcdef.xlsm',
                agency_name: 'Agency 1, with comma',
                ec_code: '99.1',
                reporting_period_name: 'Quarter 1, with comma',
                validity: 'Validated on 2025-01-01 by person@example.com',
            },
        ];
        const expectedCSV = `upload_id,original_filename,path_in_zip,agency_name,ec_code,reporting_period_name,validity
abcdef,Approved File.xlsm,Quarter 1/Approved File_abcdef.xlsm,"Agency 1, with comma",99.1,"Quarter 1, with comma",Validated on 2025-01-01 by person@example.com`;

        // stub S3 client and PutObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => {});
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        // stub getUploadsForArchive as the unit test is not testing the database query
        sandbox.stub(full_file_export, 'getUploadsForArchive').resolves(data);

        await full_file_export.generateAndUploadMetadata(organizationId, s3Key);

        // Check if S3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal(s3Key);
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
        expect(command.Body.toString()).to.equal(expectedCSV);
        expect(command.ServerSideEncryption).to.equal('AES256');
    });
});
