// This is named '_test_' instead of 'test' because it breaks other tests when run as part of db tests.
const { expect } = require('chai');
const path = require('path');
const XLSX = require('xlsx');
const AgencyImporter = require('../../src/lib/agencyImporter');
const fixtures = require('./seeds/fixtures');
const db = require('../../src/db');

describe('agencyImporter class test', () => {
    before(async () => {
        await fixtures.seed(db.knex);
        // seeding doesn't set sequence id.
        await db.knex.raw('SELECT setval(\'agencies_id_seq\', (SELECT MAX(id) FROM agencies) + 1);');
    });

    after(async () => {
        await db.knex.destroy();
    });

    async function doImport(fileName) {
        const workbook = XLSX.readFile(path.join(__dirname, `${fileName}.xlsx`));
        const rowsList = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const agencyImporter = new AgencyImporter();
        return await agencyImporter.import(fixtures.users.adminUser, rowsList);
    };

    context('unit tests for AgencyImporter class', () => {
        it('verifies that correct number of agencies are added', async () => {
            const ret = await doImport('testAgencyUploadOnePass');
            expect(ret.status.agencies.added).to.equal(8);
            expect(ret.status.agencies.errored).to.equal(0);
            expect(ret.status.errors.length).to.equal(0);

        });
        it('verifies that appropriate number of errors is returned', async () => {
            const ret = await doImport('testAgencyUploadErrors');
            expect(ret.status.agencies.added).to.equal(1);
            expect(ret.status.agencies.errored).to.equal(6);
            expect(ret.status.errors.length).to.equal(12);
        });
    });
});
