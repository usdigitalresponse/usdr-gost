// This is named '_test_' instead of 'test' because it breaks other tests when run as part of db tests.
const { expect } = require('chai');
const path = require('path');
const XLSX = require('xlsx');
const UserImporter = require('../../src/lib/userImporter');
const fixtures = require('./seeds/fixtures');
const db = require('../../src/db');

describe('userImporter class test', () => {
    before(async () => {
        await fixtures.seed(db.knex);
        // TO eventually DO: figure out why seeding doesn't set sequence id.
        await db.knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users) + 1);');
    });

    after(async () => {
        await db.knex.destroy();
    });

    context('unit tests for UserImporter class', () => {
        it('verifies no new users are added from exported user list', async () => {
            const workbook = await UserImporter.export(fixtures.users.adminUser);
            const userImporter = new UserImporter();
            const ret = await userImporter.import(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.updated).to.equal(0);
            expect(ret.status.users.notChanged).to.equal(3);
            expect(ret.status.users.errored).to.equal(0);
            expect(ret.status.errors.length).to.equal(0);
        });
        it('checks that no users added, all return errors', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadErrors.xlsx'));
            const ret = await userImporter.import(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.updated).to.equal(0);
            expect(ret.status.users.notChanged).to.equal(0);
            expect(ret.status.users.errored).to.equal(5);
            expect(ret.status.errors.length).to.equal(9);
        });
        it('checks that correct number of users are added, updated or unchanged', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadSuccess.xlsx'));
            const ret = await userImporter.import(fixtures.users.adminUser, workbook);
            expect(ret.status.users.added).to.equal(2);
            expect(ret.status.users.updated).to.equal(1);
            expect(ret.status.users.notChanged).to.equal(1);
            expect(ret.status.users.errored).to.equal(0);
            expect(ret.status.errors.length).to.equal(0);
        });
    });
});
