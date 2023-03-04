const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs/promises');
const path = require('path');
const rewire = require('rewire');
const XLSX = require('xlsx');
const ValidationError = require('../../../../src/arpa_reporter/lib/validation-error');
const { UPLOAD_DIR } = require('../../../../src/arpa_reporter/environment');

const persistUploadModule = rewire('../../../../src/arpa_reporter/services/persist-upload');

// These are used in multiple places
const jsonFSName = persistUploadModule.__get__('jsonFSName');
const persistJson = persistUploadModule.__get__('persistJson');
const uploadFSName = persistUploadModule.__get__('uploadFSName');

const MOCK_WORKBOOK = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(MOCK_WORKBOOK, XLSX.utils.aoa_to_sheet([[0, 1, 2]]), 'sheet_1');

describe('persist-upload', () => {
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

    describe('validateBuffer', () => {
        const validateBuffer = persistUploadModule.__get__('validateBuffer');

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
        const createUploadRow = persistUploadModule.__get__('createUploadRow');

        it('should create an upload row with escaped notes', async () => {
            const notes = '<script>alert("xss");</script>';
            const userId = 1;
            const reportingPeriodId = 2;
            const agencyId = 2;
            const uploadRow = await createUploadRow('filename.xlsx', reportingPeriodId, userId, agencyId, notes);
            expect(uploadRow).to.deep.equal({
                filename: 'filename.xlsx',
                reporting_period_id: 2,
                user_id: 1,
                agency_id: 2,
                notes: '<script>alert("xss");</script>',
            });
        });
    });

    describe('persistUploadToFS', () => {
        const persistUploadToFS = persistUploadModule.__get__('persistUploadToFS');
        let fsMock;
        const filename = 'test.xlsx';
        const upload = { filename, id: 1 };
        const filePath = uploadFSName(upload);
        const buffer = Buffer.from('test data');

        beforeEach(() => {
            fsMock = sinon.mock(fs);
        });
        beforeEach(() => {
            fsMock = sinon.mock(fs);
        });

        afterEach(() => {
            fsMock.restore();
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
});

describe('getValidNotes', () => {
    const getValidNotes = persistUploadModule.__get__('getValidNotes');

    it('should return null if notes is undefined', () => {
        const notes = undefined;
        const validNotes = getValidNotes(notes);
        expect(validNotes).to.equal(null);
    });

    it('should escape html tags', () => {
        const notes = '<script>alert("xss");</script>';
        const validNotes = getValidNotes(notes);
        expect(validNotes).to.equal('&lt;script&gt;alert(&quot;xss&quot;);&lt;/script&gt;');
    });
});

describe('getValidAgencyId', () => {
    const getValidAgencyId = persistUploadModule.__get__('getValidAgencyId');
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        const getUserStub = sandbox.stub().returns({ tenant_id: 0 });
        const getTenantAgenciesStub = sandbox.stub().returns([{ id: 1, name: 'Agency1' }, { id: 2, name: 'Agency2' }]);
        persistUploadModule.__set__('getUser', getUserStub);
        persistUploadModule.__set__('getTenantAgencies', getTenantAgenciesStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return null if agencyId is undefined', async () => {
        const agencyId = undefined;
        const validAgencyId = await getValidAgencyId(agencyId);
        expect(validAgencyId).to.equal(null);
    });

    it('should throw a ValidationError if agencyId is not associated with current tenant', async () => {
        // In this case, the user is in tenant 0, which has agency list [Agency1, Agency2], and the agencyId is 3, which is not in the list
        const userId = 1;
        const agencyId = 3;

        try {
            // eslint-disable-next-line no-unused-vars
            const validAgencyId = await getValidAgencyId(agencyId, userId);
            throw new Error('Expected an error to be thrown');
        } catch (err) {
            expect(err).to.be.an.instanceof(ValidationError);
            expect(err.message).to.equal('Supplied agency ID 3 does not correspond to an agency in the user\'s tenant 0');
        }
    });

    it('should return the agencyId if it corresponds to the tenant agency list', async () => {
        // In this case, the user is in tenant 0, which has agency list [Agency1, Agency2], and the agencyId is 2, which is in the list
        const userId = 1;
        const agencyId = 2;

        const validAgencyId = await getValidAgencyId(agencyId, userId);
        expect(validAgencyId).to.equal(agencyId);
    });
});

describe('getValidReportingPeriodId', () => {
    const getValidReportingPeriodId = persistUploadModule.__get__('getValidReportingPeriodId');
    const getReportingPeriod = sinon.stub();
    persistUploadModule.__set__('getReportingPeriod', getReportingPeriod);
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getReportingPeriod.resetHistory();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should fall back to the current reporting period if reportingPeriodId is undefined', async () => {
        const reportingPeriodId = undefined;
        const getReportingPeriodStub = sandbox.stub().returns({ id: 1 });
        persistUploadModule.__set__('getReportingPeriod', getReportingPeriodStub);
        const validReportingPeriodId = await getValidReportingPeriodId(reportingPeriodId);
        expect(validReportingPeriodId).to.equal(1);
    });

    it('should return the ID of the reporting period when it exists', async () => {
        const reportingPeriod = { id: 123 };
        getReportingPeriod.resolves(reportingPeriod);
        persistUploadModule.__set__('getReportingPeriod', getReportingPeriod);

        const result = await getValidReportingPeriodId(reportingPeriod.id);

        expect(getReportingPeriod.calledOnceWith(reportingPeriod.id)).to.be.true;
        expect(result).to.equal(reportingPeriod.id);
    });

    it('should throw a ValidationError when the reporting period does not exist', async () => {
        const reportingPeriodId = 456;
        getReportingPeriod.resolves(null);
        persistUploadModule.__set__('getReportingPeriod', getReportingPeriod);

        try {
            await getValidReportingPeriodId(reportingPeriodId);
            // The test should fail if the function does not throw an error
            expect.fail('Expected function to throw an error');
        } catch (error) {
            expect(error).to.be.an.instanceOf(ValidationError);
            expect(error.message).to.equal(`Supplied reporting period ID ${reportingPeriodId} does not correspond to any existing reporting period`);
            expect(getReportingPeriod.calledOnceWith(reportingPeriodId)).to.be.true;
        }
    });
});

describe('persistJson', () => {
    let fsMock;
    beforeEach(() => {
        fsMock = sinon.mock(fs);
    });
    describe('persistJson', () => {
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
        const jsonForUpload = persistUploadModule.__get__('jsonForUpload');

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
