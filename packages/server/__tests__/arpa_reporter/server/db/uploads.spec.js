
const uploads = requireSrc(__filename)
const assert = require('assert')
const { withTenantId } = require('../helpers/with-tenant-id')
const { knex } = require('../mocha_init')

const TENANT_ID = 0

describe('db/uploads.js', function () {
  let upload

  beforeEach('init an upload row', async function () {
    upload = { filename: 'filename' }
  })

  describe('createUpload', function () {
    afterEach('clear uploads table', async function () {
      await knex.raw('TRUNCATE TABLE uploads CASCADE')
    })

    it('Returns the resulting row', async function () {
      const inserted = await withTenantId(TENANT_ID, () => uploads.createUpload(upload))
      assert.ok(inserted)
      assert.equal(inserted.filename, 'filename')
    })

    it('Requires a filename', async function () {
      upload.filename = null
      assert.rejects(async () => await withTenantId(TENANT_ID, () => uploads.createUpload(upload)))
    })

    describe('when there is invalid user id', function () {
      it('throws an error', async function () {
        upload.user_id = 12345
        assert.rejects(async () => await withTenantId(TENANT_ID, uploads.createUpload(upload)))
      })
    })

    describe('when there is invalid reporting period', function () {
      it('throws an error', async function () {
        upload.reporting_period_id = 12345
        assert.rejects(async () => await withTenantId(TENANT_ID, uploads.createUpload(upload)))
      })
    })
  })
})

// NOTE: This file was copied from tests/server/db/uploads.spec.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
