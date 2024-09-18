/*
--------------------------------------------------------------------------------
-                     tests/db/arpa-subrecipients.spec.js
--------------------------------------------------------------------------------
  A arpa_subrecipients record in postgres looks like this:

*/
const { findRecipient } = requireSrc(__filename);
const assert = require('assert');
const _ = require('lodash');
const { requestProviderMiddleware } = require('../../../../src/arpa_reporter/use-request');
const { withTenantId } = require('../helpers/with-tenant-id');
const knex = require('../../../../src/db/connection');

const TENANT_A = 0;
const TENANT_B = 1;
const NONEXISTENT_TENANT = 100;

describe('db/reporting-periods.js', () => {
    const recipients = {
        beneficiaryWithTIN: {
            tenant_id: TENANT_A,
            name: 'Beneficiary with TIN',
            tin: 'TIN-1',
            uei: null,
        },
        iaa: {
            tenant_id: TENANT_A,
            name: 'IAA',
            tin: null,
            uei: null,
        },
        contractorWithUEI: {
            tenant_id: TENANT_A,
            name: 'Contractor with UEI',
            tin: null,
            uei: 'UEI-1',
        },
    }
    before(async () => {
        await knex.raw('TRUNCATE TABLE arpa_subrecipients CASCADE');
        await knex('arpa_subrecipients').insert(Object.values(recipients));
    });
    describe('findRecipient', () => {
        it('Returns a recipient with UEI', async () => {
            const result = await requestProviderMiddleware({ session: { user: { tenant_id: TENANT_A } } }, null, findRecipient('uei', 'UEI-1'));
            console.log(result);
            assert.equal(result.length, 21);
        });
    });
});

// NOTE: This file was copied from tests/server/db/reporting-periods.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
