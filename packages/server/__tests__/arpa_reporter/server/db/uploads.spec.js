const uploads = requireSrc(__filename);
const assert = require('assert');
const fixtures = require('../fixtures/fixtures');
const { withTenantId } = require('../helpers/with-tenant-id');
const { knex } = require('../mocha_init');

const TENANT_ID = 0;

describe('db/uploads.js', () => {
    let upload;

    beforeEach('init an upload row', async () => {
        upload = { filename: 'filename' };
        await fixtures.clean(knex);
        await fixtures.seed(knex);
    });

    afterEach(async () => {
        await fixtures.clean(knex);
    });

    describe('createUpload', () => {
        afterEach('clear uploads table', async () => {
            await knex.raw('TRUNCATE TABLE uploads CASCADE');
        });

        it('Returns the resulting row', async () => {
            const inserted = await withTenantId(TENANT_ID, () => uploads.createUpload(upload));
            assert.ok(inserted);
            assert.equal(inserted.filename, 'filename');
        });

        it('Requires a filename', async () => {
            upload.filename = null;
            assert.rejects(async () => withTenantId(TENANT_ID, () => uploads.createUpload(upload)));
        });

        describe('when there is invalid user id', () => {
            it('throws an error', async () => {
                upload.user_id = 12345;
                assert.rejects(async () => withTenantId(TENANT_ID, uploads.createUpload(upload)));
            });
        });

        describe('when there is invalid reporting period', () => {
            it('throws an error', async () => {
                upload.reporting_period_id = 12345;
                assert.rejects(async () => withTenantId(TENANT_ID, uploads.createUpload(upload)));
            });
        });
    });

    describe('usedForTreasuryExport', () => {
        it('should only have two results', async () => {
            const rows = await withTenantId(fixtures.TENANT_ID, async () => {
                const r = await uploads.usedForTreasuryExport(fixtures.reportingPeriods.q1_2021.id);
                return r;
            });
            const uploadsFiltered = Object.values(fixtures.uploads)
                .filter((f) => f.tenant_id === fixtures.TENANT_ID)
                .filter((f) => f.invalidated_at === null)
                .filter((f) => f.reporting_period_id === fixtures.reportingPeriods.q1_2021.id);
            assert.equal(rows.length, uploadsFiltered.length);
        });
    });

    describe('markInvalidated', () => {
        it('should be invalidated', async () => {
            const { upload1 } = fixtures.uploads;
            const user = fixtures.users.staffUser;
            await uploads.markInvalidated(upload1.id, user.id, knex);
            const rows = await knex('uploads')
                .where('id', upload1.id)
                .select('uploads.*');
            const row = rows[0];
            assert.equal(row.invalidated_by, user.id);
            assert(row.invalidated_at !== null);
            assert(row.validated_at === null);
            assert(row.validated_by === null);
        });
    });

    describe('markValidated', () => {
        it('should be validated', async () => {
            const { upload2 } = fixtures.uploads;
            const user = fixtures.users.staffUser;
            await uploads.markValidated(upload2.id, user.id, knex);
            const rows = await knex('uploads')
                .where('id', upload2.id)
                .select('uploads.*');
            const row = rows[0];
            assert.equal(row.validated_by, user.id);
            assert(row.validated_at !== null);
            assert(row.invalidated_at === null);
            assert(row.invalidated_by === null);
        });
    });
});

// NOTE: This file was copied from tests/server/db/uploads.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
