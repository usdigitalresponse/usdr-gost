/*
--------------------------------------------------------------------------------
-                     tests/db/arpa-subrecipients.spec.js
--------------------------------------------------------------------------------
  A arpa_subrecipients record in postgres looks like this:

*/
const { findRecipient, createRecipient } = requireSrc(__filename);
const assert = require('assert');
const knex = require('../../../../src/db/connection');
const { withTenantId } = require('../helpers/with-tenant-id');

const TENANT_A = 0;

describe('db/arpa-subrecipients.js', () => {
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
    };
    before(async () => {
        await knex.raw('TRUNCATE TABLE arpa_subrecipients CASCADE');
        await knex('arpa_subrecipients').insert(Object.values(recipients));
    });
    describe('findRecipient', () => {
        it('Returns a recipient with UEI', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipient('uei', 'UEI-1'));
            assert.equal(result.name, 'Contractor with UEI');
        });
        it('Returns a recipient with TIN', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipient('tin', 'TIN-1'));
            assert.equal(result.name, 'Beneficiary with TIN');
        });
        it('Returns a recipient with Name', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipient('name', 'IAA'));
            assert.equal(result.name, 'IAA');
        });
        it('Throws error when querying for a recipient with an invalid field type', async () => {
            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => findRecipient('invalid', 'IAA'));
                },
                (err) => {
                    assert.strictEqual(err.name, 'Error');
                    assert.strictEqual(err.message, 'Cannot query for recipient without a valid field type');
                    return true;
                },
            );
        });
    });

    describe('createRecipient', () => {
        it('Throws error when creating two contractors with the same UEI', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'Another Contractor with UEI',
                tin: null,
                uei: 'UEI-1',
            };

            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => createRecipient(recipient));
                },
                (err) => {
                    assert.strictEqual(err.name, 'Error');
                    assert.strictEqual(err.message, 'A recipient with this UEI already exists');
                    return true;
                },
            );
        });
        it('Throws error creating two beneficiaries with the same TIN', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'Another Beneficiary with TIN',
                tin: 'TIN-1',
                uei: null,
            };

            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => createRecipient(recipient));
                },
                (err) => {
                    assert.strictEqual(err.name, 'Error');
                    assert.strictEqual(err.message, 'A recipient with this TIN already exists');
                    return true;
                },
            );
        });
        it('Throws error creating two IAA with the same name and no UEI/TIN value', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'IAA',
                tin: null,
                uei: null,
            };

            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => createRecipient(recipient));
                },
                (err) => {
                    assert.strictEqual(err.name, 'Error');
                    assert.strictEqual(err.message, 'A recipient with this name already exists');
                    return true;
                },
            );
        });
        it('Throws error creating a subrecipient with no name, uei, or tin', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: null,
                tin: null,
                uei: null,
            };

            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => createRecipient(recipient));
                },
                (err) => {
                    assert.strictEqual(err.name, 'Error');
                    assert.strictEqual(err.message, 'recipient row must include a `uei`, `tin`, or `name` field');
                    return true;
                },
            );
        });
    });
});

// NOTE: This file was copied from tests/server/db/reporting-periods.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
