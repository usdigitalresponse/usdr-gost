const { expect } = require('chai');
const path = require('path');
const XLSX = require('xlsx');
const UserImporter = require('../../src/lib/userImporter');
const fixtures = require('../db/seeds/fixtures');

describe('userImporter class test', () => {
    context('unit test only, no fetch', () => {
        it('check no users added, all errors', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadErrors.xlsx'));
            const ret = await userImporter.run(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.errored).to.equal(5);
            expect(ret.status.errors.length).to.equal(12);
        });
    });
});
