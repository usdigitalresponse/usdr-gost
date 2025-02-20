const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');

const full_file_export = require('../../../../src/arpa_reporter/services/full-file-export');
const aws = require('../../../../src/lib/gost-aws');

const OLD_AUDIT_REPORT_BUCKET = process.env.AUDIT_REPORT_BUCKET;
const OLD_ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL;

describe('FullFileExport', () => {
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        // Override environment variables for testing
        process.env.AUDIT_REPORT_BUCKET = 'arpa-audit-reports';
        process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = 'http://sqs.us-west-2.localhost.localstack.cloud:4566/000000000000/full-file-export-queue';
    });
    afterEach(() => {
        // Restore environment variables as not doing so could impact other tests outside of this module
        process.env.AUDIT_REPORT_BUCKET = OLD_AUDIT_REPORT_BUCKET;
        process.env.ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL = OLD_ARPA_FULL_FILE_EXPORT_SQS_QUEUE_URL;
        sandbox.restore();
    });
    it('should add message to the queue', async () => {
        // stub generateAndUploadMetadata as the unit test is not testing the database query and s3 upload functionality
        sandbox.stub(full_file_export, 'generateAndUploadMetadata').resolves(undefined);

        // stub sqs client and SendMessageCommand
        const messageFake = sandbox.fake.returns('just sqs');
        messageFake.send = sandbox.fake(() => { true; });
        const sqsFake = sandbox.fake.returns(messageFake);
        sandbox.replace(aws, 'getSQSClient', sqsFake);

        await full_file_export.addMessageToQueue(1, 'person@example.com');

        // Check if SQS client was called with correct parameters
        expect(messageFake.send.calledOnce).to.equal(true);
        const command = messageFake.send.firstCall.firstArg.input;
        expect(command.QueueUrl).to.equal('http://sqs.us-west-2.localhost.localstack.cloud:4566/000000000000/full-file-export-queue');
        expect(command.MessageBody).to.contain('{"s3":{"bucket":"arpa-audit-reports","zip_key":"full-file-export/org_1/archive.zip","metadata_key":"full-file-export/org_1/metadata.csv"},"organization_id":1,"user_email":"person@example.com"}');
    });
    it('should generate and upload metadata', async () => {
        const organizationId = 1;
        const s3Key = 'test-key';
        const data = [
            {
                upload_id: 'abcdef',
                original_filename: 'Approved File.xlsm',
                path_in_zip: '/Quarter 1/Approved File_abcdef.xlsm',
                agency_name: 'Agency 1',
                ec_code: '99.1',
                reporting_period_name: 'Quarter 1',
                validity: 'Validated on 2025-01-01 by person@example.com',
            },
        ];
        const expectedCSV = `upload_id,original_filename,path_in_zip,agency_name,ec_code,reporting_period_name,validity
abcdef,Approved File.xlsm,/Quarter 1/Approved File_abcdef.xlsm,Agency 1,99.1,Quarter 1,Validated on 2025-01-01 by person@example.com`;

        // stub S3 client and PutObjectCommand
        const uploadFake = sandbox.fake.returns('just s3');
        uploadFake.send = sandbox.fake(() => { true; });
        const s3Fake = sandbox.fake.returns(uploadFake);
        sandbox.replace(aws, 'getS3Client', s3Fake);

        // stub getUploadsForArchive as the unit test is not testing the database query
        sandbox.stub(full_file_export, 'getUploadsForArchive').resolves(data);

        await full_file_export.generateAndUploadMetadata(organizationId, s3Key);

        // Check if S3 client was called with correct parameters
        expect(uploadFake.send.calledOnce).to.equal(true);
        const command = uploadFake.send.firstCall.firstArg.input;
        expect(command.Key).to.equal(s3Key);
        expect(command.ContentType).to.equal('text/plain');
        expect(command.Bucket).to.equal('arpa-audit-reports');
        expect(command.Body.toString()).to.equal(expectedCSV);
        expect(command.ServerSideEncryption).to.equal('AES256');
    });
});
