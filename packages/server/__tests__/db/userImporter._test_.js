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
        // seeding doesn't set sequence id.
        await db.knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) FROM users) + 1);');
    });

    after(async () => {
        await db.knex.destroy();
    });

    async function testExportImport(expectedNotChanged) {
        const exportedUsers = await UserImporter.export(fixtures.users.adminUser);
        const userImporter = new UserImporter();
        const ret = await userImporter.import(fixtures.users.adminUser, exportedUsers);
        expect(ret.status.users.added).to.equal(0);
        expect(ret.status.users.updated).to.equal(0);
        expect(ret.status.users.notChanged).to.equal(expectedNotChanged);
        expect(ret.status.users.errored).to.equal(0);
        expect(ret.status.errors.length).to.equal(0);
        return exportedUsers;
    }

    function usersFromWorkbook(workbook) {
        return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    }

    context('unit tests for UserImporter class', () => {
        it('verifies no new users are added from exported user list', async () => {
            await testExportImport(3);
        });
        it('verifies that no users added when all should return errors', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadErrors.xlsx'));
            const rowsList = usersFromWorkbook(workbook);
            const ret = await userImporter.import(fixtures.users.adminUser, rowsList);
            expect(ret.status.users.added).to.equal(0);
            expect(ret.status.users.updated).to.equal(0);
            expect(ret.status.users.notChanged).to.equal(0);
            expect(ret.status.users.errored).to.equal(5);
            expect(ret.status.errors.length).to.equal(9);
        });
        it('verifies that correct number of users are added, updated or unchanged', async () => {
            const userImporter = new UserImporter();
            const workbook = XLSX.readFile(path.join(__dirname, 'testUSDRUserUploadSuccess.xlsx'));
            const rowsList = usersFromWorkbook(workbook);
            const ret = await userImporter.import(fixtures.users.adminUser, rowsList);
            expect(ret.status.users.added).to.equal(2);
            expect(ret.status.users.updated).to.equal(1);
            expect(ret.status.users.notChanged).to.equal(1);
            expect(ret.status.users.errored).to.equal(0);
            expect(ret.status.errors.length).to.equal(0);
            const rowsList2 = await testExportImport(5);
            for (let rowIndex = 0; rowIndex < rowsList2.length; rowIndex += 1) {
                if (rowsList2[rowIndex].email === 'staff.user@test.com') {
                    expect(rowsList2[rowIndex].role_name).to.equal('admin');
                    break;
                }
            }
        });
    });
});
