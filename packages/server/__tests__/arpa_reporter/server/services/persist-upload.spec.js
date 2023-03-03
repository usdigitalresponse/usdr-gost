const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs/promises');
const path = require('path');
const rewire = require('rewire');
const XLSX = require('xlsx');
const ValidationError = require('../../../../src/arpa_reporter/lib/validation-error');
const { UPLOAD_DIR } = require('../../../../src/arpa_reporter/environment');

const persistUpload = rewire('../../../../src/arpa_reporter/services/persist-upload');

// These are used in multiple places
const jsonFSName = persistUpload.__get__('jsonFSName');
const persistJson = persistUpload.__get__('persistJson');
const uploadFSName = persistUpload.__get__('uploadFSName');

const MOCK_WORKBOOK = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(MOCK_WORKBOOK, XLSX.utils.aoa_to_sheet([[0, 1, 2]]), 'sheet_1');

describe('persist-upload', () => {
    describe('validateBuffer', () => {
        const validateBuffer = persistUpload.__get__('validateBuffer');

        it('should return true for a valid excel file', async () => {
            const buffer = await fs.readFile(path.join(__dirname, '../fixtures/arpa-examples/OBM01-768622-09302020-v20220320.xlsm'));
            const result = await validateBuffer(buffer);
            expect(result).not.to.throw;
        });

        it('should throw an error for an invalid buffer', async () => {
            const buffer = Buffer.from([0x01]);
            expect(validateBuffer(buffer)).to.throw;
        });
    });

    describe('createUploadRow', () => {
        const createUploadRow = persistUpload.__get__('createUploadRow');

        it('should create an upload row with escaped notes', async () => {
            const body = { notes: '<script>alert("xss");</script>' };
            const user = { id: 1 };
            const reportingPeriod = { id: 2 };
            const uploadRow = await createUploadRow('filename.xlsx', reportingPeriod, user, body);
            expect(uploadRow.filename).to.equal('filename.xlsx');
            expect(uploadRow.reporting_period_id).to.equal(2);
            expect(uploadRow.user_id).to.equal(1);
            expect(uploadRow.notes).to.equal('&lt;script&gt;alert(&quot;xss&quot;);&lt;/script&gt;');
        });
    });

    describe('persistUploadToFS', () => {
        const persistUploadToFS = persistUpload.__get__('persistUploadToFS');
        let fsMock;
        const filename = 'test.xlsx';
        const upload = { filename, id: 1 };
        const filePath = uploadFSName(upload);
        const buffer = Buffer.from('test data');

        beforeEach(() => {
            fsMock = sinon.mock(fs);
        });

        afterEach(() => {
            fsMock.restore();
        });

        it('should write the file to disk', async () => {
            fsMock.expects('mkdir').once().withArgs(UPLOAD_DIR, { recursive: true }).resolves();
            fsMock.expects('writeFile').once().withArgs(filePath, buffer, { flag: 'wx' }).resolves();

            await persistUploadToFS(upload, buffer);

            fsMock.verify();
        });

        it('should throw a ValidationError if an error occurs', async () => {
            const expectedError = new ValidationError(`Cannot persist ${upload.filename} to filesystem: Error: EEXIST: file already exists`);
            fsMock.expects('mkdir').throws(new Error('EEXIST: file already exists'));

            try {
                await persistUploadToFS(upload, buffer);
                throw new Error('Expected an error to be thrown');
            } catch (err) {
                expect(err).to.be.an.instanceof(ValidationError);
                expect(err.message).to.equal(expectedError.message);
            }
        });
    });

    describe('uploadFSName', () => {
        it('generates a filesystem name based on upload ID', () => {
            expect(
                uploadFSName({
                    id: 'abcd',
                    filename: 'upload01.xlsm',
                }),
            ).include('abcd.xlsm');
        });
    });

    describe('jsonFSName', () => {
        it('generates a filesystem name based on upload ID', () => {
            expect(jsonFSName({ id: 'abcd', filename: 'upload01.xlsm' })).include(
                '/abcd.json',
            );
        });

        it('groups cache contents in subfolders by first character of upload ID', () => {
            expect(jsonFSName({ id: 'abcd', filename: 'upload01.xlsm' })).include(
                '/a/abcd.json',
            );
            expect(jsonFSName({ id: '01234', filename: 'upload02.xlsm' })).include(
                '/0/01234.json',
            );
        });
    });

    describe('persistJson', () => {
        let fsMock;
        beforeEach(() => {
            fsMock = sinon.mock(fs);
        });

        afterEach(() => {
            fsMock.restore();
        });

        it('serializes a workbook object and saves it to disk', async () => {
            const upload = { id: 'abcd', filename: 'upload01.xlsm' };
            fsMock.expects('mkdir').once();
            fsMock.expects('writeFile').once().withArgs(jsonFSName(upload));
            await persistJson(upload, MOCK_WORKBOOK);
            fsMock.verify();
        });
    });

    describe('jsonForUpload', () => {
        const jsonForUpload = persistUpload.__get__('jsonForUpload');

        it('serializing and deserializing an upload are reversible', async () => {
            const upload = { id: 'abcd', filename: 'upload01.xlsm' };
            await persistJson(upload, MOCK_WORKBOOK);
            const workbook = await jsonForUpload(upload);
            expect(workbook).deep.equal(MOCK_WORKBOOK);
        });

        it('preserves Date objects', async () => {
            const upload = { id: 'efgh', filename: 'upload02.xlsm' };
            const mockWorkbook = { ...MOCK_WORKBOOK, date: new Date(0) };
            await persistJson(upload, mockWorkbook);
            const workbook = await jsonForUpload(upload);
            expect(workbook).deep.equal(mockWorkbook);
            expect(workbook.date instanceof Date).is.true;
        });
    });
});
