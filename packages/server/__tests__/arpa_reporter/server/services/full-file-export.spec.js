const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const { expect } = require('chai');
const sinon = require('sinon');

const full_file_export = require('../../../../src/arpa_reporter/services/full-file-export');
const aws = require('../../../../src/lib/gost-aws');

const OLD_AUDIT_REPORT_BUCKET = process.env.AUDIT_REPORT_BUCKET;
describe('FullFileExport', () => {
    const sandbox = sinon.createSandbox();
    beforeEach(() => {
        process.env.AUDIT_REPORT_BUCKET = 'arpa-audit-reports';
    });
    afterEach(() => {
        process.env.AUDIT_REPORT_BUCKET = OLD_AUDIT_REPORT_BUCKET;
        sandbox.restore();
    });
    it('should generate and upload metadata', async () => {
        const organizationId = 1;
        const s3Key = 'test-key';
        const data = [
            {
                filename_in_zip: 'data', directory_location: 'test', agency_name: 'test', ec_code: 'test', reporting_period_name: 'test', validity: 'test',
            },
        ];
        const logger = { info: sandbox.stub(), error: sandbox.stub() };
        const s3 = aws.getS3Client();
        const putObjectCommand = sandbox.stub(s3, 'send').resolves();
        sandbox.stub(full_file_export, 'getUploadsForArchive').resolves(data);
        await full_file_export.generateAndUploadMetadata(organizationId, s3Key, logger);
        expect(logger.info.calledOnce).to.be.true;
        expect(logger.error.notCalled).to.be.true;
        expect(putObjectCommand.calledOnce).to.be.true;
        expect(putObjectCommand.firstCall.args[0].Bucket).to.equal('arpa-audit-reports');
        expect(putObjectCommand.firstCall.args[0].Key).to.equal(s3Key);
        expect(putObjectCommand.firstCall.args[0].Body).to.equal(data);
        expect(putObjectCommand.firstCall.args[0].ServerSideEncryption).to.equal('AES256');
    });
});
