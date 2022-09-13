const { expect } = require('chai');
const db = require('../../src/db');
const { TABLES } = require('../../src/db/constants');
const fixtures = require('./seeds/fixtures');

describe('db', () => {
    before(async () => {
        await fixtures.seed(db.knex);
        // await db.knex.migrate.rollback();
        // await db.knex.raw('DROP DATABASE IF EXISTS usdr_grants_test');
        // await db.knex.raw('CREATE DATABASE usdr_grants_test');
        // await db.knex.migrate.forceFreeMigrationsLock();
        // await db.knex.migrate.latest();
        // await db.knex.seed.run();
    });

    after(async () => {
        await db.knex.destroy();
    });

    context('getGrantsInterested', () => {
        it('gets the most recent interested grant', async () => {
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 1, currentPage: 1 });
            expect(rows[0]).to.have.property('grant_id').with.lengthOf(6);
            expect(rows[0].grant_id).to.equal(fixtures.grantsInterested.entry2.grant_id);
            // in the grants interested table the grant with the most recent created_at has the grant id of 335255
            expect(rows[0]).to.have.property('grant_id').equal('335255');
        });
        it('gets the two most recent interested grants', async () => {
            // testing pagination
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 2, currentPage: 1 });
            expect(rows).to.have.lengthOf(2);
            expect(rows.map(r => r.created_at.getTime())).to.have.all.members([ 1663117521515, 1659827033570 ]);
        });
    });
    context('getTotalInterestedGrants', () => {
        it('gets total interested grants count', async () => {
            const result = await db.getTotalInterestedGrants(fixtures.users.staffUser.agency_id);

            expect(result).to.equal(3);
        });
    });

    context('getTotalGrants', () => {
        it('gets total grant count with no parameters', async () => {
            const result = await db.getTotalGrants();
            expect(result).to.equal('4');
        });

        it('gets total grant count matching agency criteria', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['11'],
                keywords: ['Covid'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('1');
        });

        it('gets total grant count matching eligibilityCodes only', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['25'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('2');
        });

        it('gets total grant count matching keywords only', async () => {
            const agencyCriteria = {
                keywords: ['earth sciences'],
            };
            const result = await db.getTotalGrants({ agencyCriteria });
            expect(result).to.equal('1');
        });

        it('gets total grant count with created fromTs', async () => {
            const createdTsBounds = { fromTs: new Date(2021, 7, 9) };
            const result = await db.getTotalGrants({ createdTsBounds });
            expect(result).to.equal('1');
        });

        it('gets total grant count with updated fromTs', async () => {
            const updatedTsBounds = { fromTs: new Date(2021, 7, 9) };
            const result = await db.getTotalGrants({ updatedTsBounds });
            expect(result).to.equal('4');
        });

        it('gets total grant count with updated fromTs and matching agency criteria', async () => {
            const updatedTsBounds = { fromTs: new Date(2021, 7, 9) };
            const agencyCriteria = {
                eligibilityCodes: ['25'],
            };

            const result = await db.getTotalGrants({ updatedTsBounds, agencyCriteria });

            expect(result).to.equal('2');
        });
    });

    context('getClosestGrant', () => {
        it('gets closest grants', async () => {
            const searchTimestamp = new Date('2021-11-02');
            const result = await db.getClosestGrants({
                agency: 0,
                perPage: 10,
                currentPage: 1,
                timestampForTest: searchTimestamp,
            });
            expect(result.data.length).to.equal(1);
            expect(result.data[0].grant_id).to.equal('335255');
        });
    });

    context('getAgencyCriteriaForAgency', () => {
        it('gets agency criteria associated with an agency', async () => {
            const staffUserId = await db.knex(TABLES.users).where('email', fixtures.users.staffUser.email);
            const result = await db.getAgencyCriteriaForAgency(staffUserId[0].agency_id);

            expect(result).to.have.property('eligibilityCodes').with.lengthOf(2);
            expect(result.eligibilityCodes[0])
                .to.equal(fixtures.agencyEligibilityCodes.accountancyNative.code);
            expect(result).to.have.property('keywords').with.lengthOf(1);
            expect(result.keywords[0]).to.equal(fixtures.keywords.accountancyCovid.search_term);
        });
    });

    context('getSingleGrantDetails', () => {
        it('gets the desired grant', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.grant_id).to.equal('335255');
        });
        it('gets the interested agencies', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.interested_agencies.length).to.equal(1);
        });
        it('returns dates in string format without timezone', async () => {
            const grantId = '335255';
            const result = await db.getSingleGrantDetails({ grantId, tenantId: fixtures.users.staffUser.tenant_id });
            expect(result.open_date).to.equal('2021-08-11');
            expect(result.close_date).to.equal('2021-11-03');
        });
    });

    context('getGrantsAssignedAgency', () => {
        it('gets grants assigned to agency', async () => {
            const result = await db.getGrants({
                tenantId: fixtures.users.staffUser.tenant_id,
                filters: {
                    assignedToAgency: fixtures.users.staffUser.agency_id.toString(),
                },
            });
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id)
                .to.equal(fixtures.assignedAgencyGrants.earFellowshipAccountAssign.grant_id);
        });
    });
});
