const { expect } = require('chai');
const path = require('path');
const XLSX = require('xlsx');
const UserImporter = require('../../src/lib/userImporter');
const fixtures = require('./seeds/fixtures');
const db = require('../../src/db');

describe('userImporter class test', () => {
    before(async () => {
        await fixtures.seed(db.knex);
    });

    after(async () => {
        await db.knex.destroy();
    });

    context('unit tests only, no fetch', () => {
        it('no new users', async () => {
            const workbook = await UserImporter.export(fixtures.users.adminUser);
            const userImporter = new UserImporter();
            const ret = await userImporter.import(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.updated).to.equal(0);
            expect(ret.status.users.notChanged).to.equal(0);
            expect(ret.status.users.errored).to.equal(0);
            expect(ret.status.errors.length).to.equal(0);
        });
        it('check no users added, all errors', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadErrors.xlsx'));
            const ret = await userImporter.import(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.updated).to.equal(0);
            expect(ret.status.users.notChanged).to.equal(0);
            expect(ret.status.users.errored).to.equal(5);
            expect(ret.status.errors.length).to.equal(9);
        });
    });
});
