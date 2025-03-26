const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { NotFound, S3ServiceException } = require('@aws-sdk/client-s3');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');

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
    it('getUploadLastUpdate should return the last updated date of the upload', async () => {
        await fixtures.seed(knex);
        const upload1 = await full_file_export.getUploadLastUpdate(fixtures.uploads.upload1);
        expect(upload1).to.equal('2022-01-01');

        const upload2 = await full_file_export.getUploadLastUpdate(fixtures.uploads.upload2);
        expect(upload2).to.equal('2023-03-01');

        const upload4 = await full_file_export.getUploadLastUpdate(fixtures.uploads.upload4_invalidated);
        expect(upload4).to.equal('2023-03-02');

        await fixtures.clean(knex);
    });

    it('shouldRecreateArchive should return true if metadata does not exist in S3', async () => {
        const uploads = [
            fixtures.uploads.upload1,
            fixtures.uploads.upload2,
            fixtures.uploads.upload4_invalidated,
        ];

        // stub S3 client and HeadObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => {
            throw new NotFound('Not found');
        });
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const result = await full_file_export.shouldRecreateArchive(fixtures.TENANT_ID, uploads);
        expect(result).to.equal(true);

        // Checks to make sure s3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal('full-file-export/org_0/metadata.csv');
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
    });

    it('shouldRecreateArchive should return true if metadata is older than the uploads', async () => {
        const uploads = [
            fixtures.uploads.upload1,
            fixtures.uploads.upload2,
            fixtures.uploads.upload4_invalidated,
        ];

        // stub S3 client and HeadObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => ({ LastModified: new Date('2023-03-01') }));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const result = await full_file_export.shouldRecreateArchive(fixtures.TENANT_ID, uploads);
        expect(result).to.equal(true);

        // Checks to make sure s3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal('full-file-export/org_0/metadata.csv');
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
    });

    it('shouldRecreateArchive should return false if metadata is newer than the uploads', async () => {
        const uploads = [
            fixtures.uploads.upload1,
            fixtures.uploads.upload2,
            fixtures.uploads.upload4_invalidated,
        ];

        // stub S3 client and HeadObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => ({ LastModified: new Date('2027-01-01') }));
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        const result = await full_file_export.shouldRecreateArchive(fixtures.TENANT_ID, uploads);
        expect(result).to.equal(false);

        // Checks to make sure s3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal('full-file-export/org_0/metadata.csv');
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
    });

    it('shouldRecreateArchive throw an error if the S3 client throws an unknown error', async () => {
        const uploads = [
            fixtures.uploads.upload1,
            fixtures.uploads.upload2,
            fixtures.uploads.upload4_invalidated,
        ];

        // stub S3 client and HeadObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => {
            throw new S3ServiceException('Unknown error');
        });
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        await expect(full_file_export.shouldRecreateArchive(fixtures.TENANT_ID, uploads)).to.be.rejectedWith(S3ServiceException);

        // Checks to make sure s3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal('full-file-export/org_0/metadata.csv');
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
    });

    it('ensures getUploadsForArchive queries the database and returns only uploads for one tenant', async () => {
        await fixtures.seed(knex);
        const testSpecificUploads = {
            missingAgencyUpload: {
                filename: '1.9918 Missing Agency Name Upload.xls',
                reporting_period_id: fixtures.reportingPeriods.q1_2021.id,
                user_id: fixtures.users.adminUser.id,
                agency_id: null,
                ec_code: '1.134',
                tenant_id: fixtures.TENANT_ID,
                id: '00000000-0000-0000-0000-000000000096',
                notes: null,
                validated_at: null,
                validated_by: null,
                invalidated_at: '2021-07-03',
                invalidated_by: fixtures.users.adminUser.id,
            },
            missingECCodeUpload: {
                filename: '1.7829 Missing EC Code Upload.xlsx',
                reporting_period_id: fixtures.reportingPeriods.q1_2021.id,
                user_id: fixtures.users.adminUser.id,
                agency_id: fixtures.agencies.accountancy.id,
                ec_code: null,
                tenant_id: fixtures.TENANT_ID,
                id: '00000000-0000-0000-0000-000000000097',
                notes: null,
                validated_at: '2023-05-01',
                validated_by: fixtures.users.adminUser.id,
                invalidated_at: null,
                invalidated_by: null,
            },
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
                updated_at: moment('2022-01-01').toISOString(),
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            // missingECCodeUpload
            {
                upload_id: '00000000-0000-0000-0000-000000000097',
                original_filename: '1.7829 Missing EC Code Upload.xlsx',
                filename_in_zip: '1.7829 Missing EC Code Upload--00000000-0000-0000-0000-000000000097.xlsx',
                path_in_zip: 'Quarterly 1/Final Treasury/1.7829 Missing EC Code Upload--00000000-0000-0000-0000-000000000097.xlsx',
                agency_name: 'State Board of Accountancy',
                ec_code: 'Missing EC code',
                reporting_period_name: 'Quarterly 1',
                updated_at: '2023-05-01T00:00:00.000Z',
                validity: 'Validated at 2023-05-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            // xlsUpload
            {
                upload_id: '00000000-0000-0000-0000-000000000098',
                original_filename: '1.134 Signed Off Report. ARPA Projects.xls',
                filename_in_zip: '1.134 Signed Off Report. ARPA Projects--00000000-0000-0000-0000-000000000098.xls',
                path_in_zip: 'Quarterly 1/Final Treasury/1.134 Signed Off Report. ARPA Projects--00000000-0000-0000-0000-000000000098.xls',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.134',
                reporting_period_name: 'Quarterly 1',
                updated_at: moment('2022-01-01').toISOString(),
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            // xlsxUpload
            {
                upload_id: '00000000-0000-0000-0000-000000000099',
                original_filename: '1.1456 Report XLSX Type Example.xlsx',
                filename_in_zip: '1.1456 Report XLSX Type Example--00000000-0000-0000-0000-000000000099.xlsx',
                path_in_zip: 'Quarterly 1/Final Treasury/1.1456 Report XLSX Type Example--00000000-0000-0000-0000-000000000099.xlsx',
                agency_name: 'State Board of Accountancy',
                ec_code: 'EC1.1456',
                reporting_period_name: 'Quarterly 1',
                updated_at: moment('2022-01-01').toISOString(),
                validity: 'Validated at 2022-01-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
            },
            // missingAgencyUpload
            {
                upload_id: '00000000-0000-0000-0000-000000000096',
                original_filename: '1.9918 Missing Agency Name Upload.xls',
                filename_in_zip: '1.9918 Missing Agency Name Upload--00000000-0000-0000-0000-000000000096.xls',
                path_in_zip: 'Quarterly 1/Not Final Treasury/Invalid files/1.9918 Missing Agency Name Upload--00000000-0000-0000-0000-000000000096.xls',
                agency_name: 'Missing agency name',
                ec_code: 'EC1.134',
                reporting_period_name: 'Quarterly 1',
                updated_at: '2021-07-03T00:00:00.000Z',
                validity: 'Invalidated at 2021-07-03T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org',
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
                updated_at: moment('2023-03-02').toISOString(),
                validity: 'Invalidated at 2023-03-02T00:00:00 by mbroussard+unit-test-user2@usdigitalresponse.org',
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
                updated_at: moment('2023-03-01').toISOString(),
                validity: `Did not pass validation at 2023-03-01T00:00:00 by mbroussard+unit-test-admin@usdigitalresponse.org`,
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
                updated_at: moment('2023-03-01').toISOString(),
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
        sandbox.stub(full_file_export, 'generateAndUploadMetadata').resolves(true);

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
        console.log(command.MessageBody);
        expect(command.MessageBody).to.contain('{"s3":{"bucket":"example-bucket-name","zip_key":"full-file-export/org_1/archive.zip","metadata_key":"full-file-export/org_1/metadata.csv"},"organization_id":1,"user_email":"person@example.com","recreate_archive":true}');
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
        expect(uploadFake.send.calledTwice).to.equal(true);
        const command = uploadFake.send.secondCall.firstArg.input;
        expect(command.Key).to.equal(s3Key);
        expect(command.Bucket).to.equal(process.env.AUDIT_REPORT_BUCKET);
        expect(command.Body.toString()).to.equal(expectedCSV);
        expect(command.ServerSideEncryption).to.equal('AES256');
    });
});
