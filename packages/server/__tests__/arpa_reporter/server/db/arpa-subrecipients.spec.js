/*
--------------------------------------------------------------------------------
-                     tests/db/arpa-subrecipients.spec.js
--------------------------------------------------------------------------------
  To see what the `arpa_subrecipients` table looks like in postgres, run the following command:
    docker compose run --rm -it app /bin/bash
    PGPASSWORD=password123 psql -U postgres -d usdr_grants -h postgres
    \d arpa_subrecipients
*/
const { findRecipient, createRecipient } = requireSrc(__filename);
const assert = require('assert');
const knex = require('../../../../src/db/connection');
const { withTenantId } = require('../helpers/with-tenant-id');

const TENANT_A = 0;
const TENANT_B = 1;

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
    describe('testing database indexes and constraints', () => {
        const insertStatement = 'INSERT INTO arpa_subrecipients (tenant_id, name, tin, uei) VALUES ';
        it('throws an error when inserting a duplicate UEI within the same tenant', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'Another Contractor with UEI',
                tin: null,
                uei: 'UEI-1',
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', ${recipient.tin}, '${recipient.uei}')`;
            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => knex.raw(insertStatement + values));
                },
                (err) => {
                    assert.strictEqual(err.name, 'error');
                    assert.strictEqual(err.message, `INSERT INTO arpa_subrecipients (tenant_id, name, tin, uei) VALUES (0, 'Another Contractor with UEI', null, 'UEI-1') - duplicate key value violates unique constraint "idx_arpa_subrecipients_tenant_id_uei_unique"`);
                    return true;
                },
            );
        });
        it('successfully creates a new subrecipient with same UEI in a different tenant', async () => {
            const recipient = {
                tenant_id: TENANT_B,
                name: 'Another Contractor with UEI',
                tin: null,
                uei: 'UEI-1',
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', ${recipient.tin}, '${recipient.uei}')`;
            await withTenantId(TENANT_B, () => knex.raw(insertStatement + values));
            const result = await withTenantId(TENANT_B, () => findRecipient('uei', 'UEI-1'));
            assert.strictEqual(result.name, 'Another Contractor with UEI');
        });
        it('throws an error when inserting a duplicate TIN within the same tenant', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'Another Beneficiary with TIN',
                tin: 'TIN-1',
                uei: null,
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', '${recipient.tin}', ${recipient.uei})`;
            await assert.rejects(
                async () => {
                    await withTenantId(TENANT_A, () => knex.raw(insertStatement + values));
                },
                (err) => {
                    assert.strictEqual(err.name, 'error');
                    assert.strictEqual(err.message, `INSERT INTO arpa_subrecipients (tenant_id, name, tin, uei) VALUES (0, 'Another Beneficiary with TIN', 'TIN-1', null) - duplicate key value violates unique constraint "idx_arpa_subrecipients_tenant_id_tin_unique"`);
                    return true;
                },
            );
        });
        it('successfully creates a new subrecipient with same TIN in a different tenant', async () => {
            const recipient = {
                tenant_id: TENANT_B,
                name: 'Another Beneficiary with TIN',
                tin: 'TIN-1',
                uei: null,
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', '${recipient.tin}', ${recipient.uei})`;
            await withTenantId(TENANT_B, () => knex.raw(insertStatement + values));
            const result = await withTenantId(TENANT_B, () => findRecipient('tin', 'TIN-1'));
            assert.strictEqual(result.name, 'Another Beneficiary with TIN');
        });
        it('throws an error when inserting a duplicate name within the same tenant when UEI/TIN are null', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'IAA',
                tin: null,
                uei: null,
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', ${recipient.tin}, ${recipient.uei})`;
            await assert.rejects(
                () => knex.raw(insertStatement + values),
                (err) => {
                    assert.strictEqual(err.name, 'error');
                    assert.strictEqual(err.message, `INSERT INTO arpa_subrecipients (tenant_id, name, tin, uei) VALUES (0, 'IAA', null, null) - duplicate key value violates unique constraint "idx_arpa_subrecipients_tenant_id_name_unique"`);
                    return true;
                },
            );
        });
        it('successfuly creates a new subrecipient with duplicate name in same tenant when UEI/TIN are not null', async () => {
            const recipient = {
                tenant_id: TENANT_A,
                name: 'IAA',
                tin: 'TIN-2',
                uei: null,
            };
            const values = `(${recipient.tenant_id}, '${recipient.name}', '${recipient.tin}', ${recipient.uei})`;
            await withTenantId(TENANT_A, () => knex.raw(insertStatement + values));
            const result = await knex('arpa_subrecipients').where('tenant_id', TENANT_A).where('name', 'IAA');
            assert.strictEqual(result.length, 2);
        });
    });
});
