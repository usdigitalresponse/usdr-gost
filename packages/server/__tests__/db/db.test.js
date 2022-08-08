const { expect } = require('chai');
const knex = require('knex')({
    client: 'pg',
    connection: process.env.POSTGRES_TEST_URL || 'postgresql://localhost:5432/usdr_grants_test',
    // debug: 'true',
    seeds: {
        directory: './seeds',
    },
});
const db = require('../../src/db');
// const knex = require('../../src/db/connection');
const { TABLES } = require('../../src/db/constants');
const fixtures = require('./seeds/fixtures');

describe('db', () => {
    before(async () => {
        // await knex.raw('DROP DATABASE IF EXISTS usdr_grants_test');
        // await knex.raw('CREATE DATABASE usdr_grants_test');
        // await knex.migrate.forceFreeMigrationsLock();
        // await knex.migrate.rollback();
        // await knex.migrate.latest();
        // await knex.seed.run();
    });

    after(async () => {
        // await knex.migrate.rollback();
        await knex.destroy();
    });

    context('getGrantsInterested', () => {
        it('gets the most recent interested grant', async () => {
            const result = await db.getGrantsInterested({ perPage: 1, currentPage: 1 });
            // console.log(JSON.stringify(result.data[0]));
            // console.log(fixtures.grantsInterested.entry2);
            expect(result.data[0]).to.have.property('grant_id').with.lengthOf(6);
            expect(result.data[0].grant_id).to.equal(fixtures.grantsInterested.entry2.grant_id);
            expect(result.data[0].user_id).to.equal(fixtures.grantsInterested.entry2.user_id);
            expect(result.data[0].is_rejection).to.equal(fixtures.interestedCodes.inadequateCapacity.is_rejection);
            // in the grants interested table the grant with the most recent created_at has the grant id of 335255
            expect(result.data[0]).to.have.property('grant_id').equal('335255');
        });
        it('gets the two most recent interested grants', async () => {
            // testing pagination
            const result = await db.getGrantsInterested({ perPage: 2, currentPage: 1 });
            expect(result.data).to.have.lengthOf(2);
        });
    });
    context('getTotalInterestedGrants', () => {
        it('gets total interested grants count', async () => {
            const result = await db.getTotalInterestedGrants();
            expect(result).to.equal('3');
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

    context('getAgencyCriteriaForAgency', () => {
        it('gets agency criteria associated with an agency', async () => {
            const staffUserId = await knex(TABLES.users).where('email', fixtures.users.staffUser.email);
            const result = await db.getAgencyCriteriaForAgency(staffUserId[0].agency_id);

            expect(result).to.have.property('eligibilityCodes').with.lengthOf(2);
            expect(result.eligibilityCodes[0])
                .to.equal(fixtures.agencyEligibilityCodes.accountancyNative.code);
            expect(result).to.have.property('keywords').with.lengthOf(1);
            expect(result.keywords[0]).to.equal(fixtures.keywords.accountancyCovid.search_term);
        });
    });

    context('getGrantsAssignedAgency', () => {
        it('gets grants assigned to agency', async () => {
            const result = await db.getGrants({
                agencies: [],
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
