const { expect } = require('chai');
const sinon = require('sinon');
const knex = require('../../src/db/connection');
const db = require('../../src/db');
const { TABLES } = require('../../src/db/constants');
const fixtures = require('./seeds/fixtures');
const emailConstants = require('../../src/lib/email/constants');
const { migrate_keywords_to_saved_search } = require('../../src/db/saved_search_migration');

const BASIC_SEARCH_CRITERIA = JSON.stringify({
    includeKeywords: 'Grant',
    excludeKeywords: 'post',
    opportunityNumber: null,
    opportunityStatuses: [],
    fundingType: null,
    agency: null,
    costSharing: false,
    opportunityCategories: [],
    reviewStatus: [],
    postedWithin: [],
});

describe('db', () => {
    before(async () => {
        await fixtures.seed(db.knex);
    });

    after(async () => {
        await db.knex.destroy();
    });
    context('migrate keywords to saved search', () => {
        it('migrates keywords to saved search', async () => {
            await migrate_keywords_to_saved_search();
        });
    });
    context('Validate Search Filters', () => {
        it('throws an error when non-existent option is passed', async () => {
            const badFilters = {
                nonExistentFilter: 'non existent values',
            };
            const errors = db.validateSearchFilters(badFilters);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal('Received invalid filter nonExistentFilter, does not exist');
        });
        it('throws an error when List filter-type is not an array', async () => {
            const badFilters = {
                reviewStatuses: 'not an array',
                eligibilityCodes: 99,
                includeKeywords: { 'non existent values': 'not an array' },
                excludeKeywords: [99],
                fundingTypes: new Set('not an array'),
                opportunityStatuses: ['invalid'],
                opportunityCategories: 'not an array',
            };
            const errors = db.validateSearchFilters(badFilters);
            expect(errors.length).to.equal(7);
            expect(errors[0]).to.equal('Received invalid filter reviewStatuses, expected List');
            expect(errors[1]).to.equal('Received invalid filter eligibilityCodes, expected List');
            expect(errors[2]).to.equal('Received invalid filter includeKeywords, expected List');
            expect(errors[3]).to.equal('Received invalid filter excludeKeywords, expected List of String');
            expect(errors[4]).to.equal('Received invalid filter fundingTypes, expected List');
            expect(errors[5]).to.equal('Received invalid filter opportunityStatuses, expected List of Enum, found value invalid that is not in posted,forecasted,closed,archived');
            expect(errors[6]).to.equal('Received invalid filter opportunityCategories, expected List');
        });
        it('throws an error when String filter-type is not a string or enum', async () => {
            const badFilters = {
                opportunityNumber: 99,
                costSharing: 'not a yes or no',
                agencyCode: 99,
                bill: 99,
            };
            const errors = db.validateSearchFilters(badFilters);
            expect(errors.length).to.equal(4);
            expect(errors[0]).to.equal('Received invalid filter opportunityNumber, expected String, received 99');
            expect(errors[1]).to.equal('Received invalid filter costSharing, expected Enum, found value not a yes or no that is not in Yes,No');
            expect(errors[2]).to.equal('Received invalid filter agencyCode, expected String, received 99');
            expect(errors[3]).to.equal('Received invalid filter bill, expected String, received 99');
        });
        it('throws an error when Number filter-type is not a number', async () => {
            const badFilters = {
                postedWithinDays: 'not a number',
                assignedToAgencyId: 'not a number',
            };
            const errors = db.validateSearchFilters(badFilters);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal('Received invalid filter postedWithinDays, expected number, received not a number');
            expect(errors[1]).to.equal('Received invalid filter assignedToAgencyId, expected number, received not a number');
        });
        it('throws an error when Date filter-type is not a date', async () => {
            const badFilters = {
                openDate: 'not a date',
            };
            const errors = db.validateSearchFilters(badFilters);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal('Received invalid filter openDate, expected YYYY-MM-DD, received not a date');
        });
        it('returns no errors when all filters are valid', async () => {
            const goodFilters = {
                reviewStatuses: ['Applied', 'Not Applying', 'Interested'],
                eligibilityCodes: ['11', '07'],
                includeKeywords: ['Grant', 'Wetlands Phrase'],
                excludeKeywords: ['post Doctorate'],
                opportunityNumber: null,
                opportunityStatuses: ['archived'],
                fundingTypes: ['CA', 'G', 'PC', 'O'],
                opportunityCategories: ['Other', 'Discretionary', 'Mandatory', 'Continuation'],
                costSharing: 'Yes',
                agencyCode: 'HHS',
                postedWithinDays: 30,
                assignedToAgencyId: 1,
                bill: 'Infrastructure Investment and Jobs Act',
            };
            const errors = db.validateSearchFilters(goodFilters);
            expect(errors.length).to.equal(0);
        });
    });
    context('CRUD Saved Search', () => {
        it('creates a new saved search', async () => {
            const row = await db.createSavedSearch({
                name: 'Example search 1',
                userId: fixtures.users.adminUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });
            expect(row.id).to.be.greaterThan(0);
            expect(row.createdAt).to.not.be.null;
            expect(row.createdBy).to.equal(fixtures.users.adminUser.id);
            expect(row.criteria).to.equal(BASIC_SEARCH_CRITERIA);
        });
        it('reads an existing saved search', async () => {
            // testing pagination
            const firstSearch = await db.createSavedSearch({
                name: 'Example search 1',
                userId: fixtures.users.staffUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });
            await db.createSavedSearch({
                name: 'Example search 2',
                userId: fixtures.users.staffUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });
            await db.createSavedSearch({
                name: 'Example search 3',
                userId: fixtures.users.staffUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });
            const rows = await db.getSavedSearches(fixtures.users.staffUser.id, { perPage: 2, currentPage: 1 });
            expect(rows.data).to.have.lengthOf(2);
            expect(rows.data[0].name).to.equal('Example search 3');
            expect(rows.data[1].name).to.equal('Example search 2');

            const rows2 = await db.getSavedSearches(fixtures.users.staffUser.id, { perPage: 2, currentPage: 2 });
            expect(rows2.data).to.have.lengthOf(1);
            expect(rows2.data[0].name).to.equal('Example search 1');

            const row = await db.getSavedSearch(firstSearch.id);
            expect(row.name).to.equal('Example search 1');
        });
        it('deletes an existing saved search', async () => {
            const row = await db.createSavedSearch({
                name: 'Example search to Delete',
                userId: fixtures.users.subStaffUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });

            const result = await db.deleteSavedSearch(row.id, fixtures.users.subStaffUser.id);
            expect(result).to.equal(true);

            // verify by attempting to get the searches as well
            const getRes = await db.getSavedSearches(fixtures.users.subStaffUser.id, { perPage: 10, currentPage: 1 });
            expect(getRes.data).to.have.lengthOf(0);
        });
    });

    context('getAllUserSavedSearches', () => {
        it('get all user saved searches', async () => {
            const data = await db.getAllUserSavedSearches();
            expect(data.length).to.equal(5);
            for (const row of data) {
                expect(() => { JSON.parse(row.criteria); }).not.to.throw();
            }
        });
        it('get all user saved searches for a specific user', async () => {
            await db.createSavedSearch({
                name: 'Example search',
                userId: fixtures.users.subStaffUser.id,
                criteria: BASIC_SEARCH_CRITERIA,
            });

            const data = await db.getAllUserSavedSearches(fixtures.users.subStaffUser.id);
            expect(data.length).to.equal(1);
            for (const row of data) {
                expect(() => { JSON.parse(row.criteria); }).not.to.throw();
            }
        });
    });

    context('getGrantsInterested', () => {
        it('gets the most recent interested grant', async () => {
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 1, currentPage: 1 });
            const row = rows.data[0];
            expect(row).to.have.property('grant_id').with.lengthOf(6);
            expect(row.grant_id).to.equal(fixtures.grantsInterested.entry2.grant_id);
            // in the grants interested table the grant with the most recent created_at has the grant id of 335255
            expect(row).to.have.property('grant_id').equal('335255');
        });
        it('gets the two most recent interested grants', async () => {
            // testing pagination
            const rows = await db.getGrantsInterested({ agencyId: fixtures.users.staffUser.agency_id, perPage: 2, currentPage: 1 });
            expect(rows.data).to.have.lengthOf(2);
            expect(rows.data.map((r) => r.created_at.getTime())).to.have.all.members([1663117521515, 1659827033570]);
        });
    });
    context('getTotalInterestedGrants', () => {
        it('gets total interested grants count', async () => {
            const result = await db.getTotalInterestedGrants(fixtures.users.staffUser.agency_id);

            expect(result).to.equal(5);
        });
    });

    context('getTotalGrants', () => {
        it('gets total grant count with no parameters', async () => {
            const result = await db.getTotalGrants();
            expect(result).to.equal('6');
        });

        it('gets total grant count matching agency criteria', async () => {
            const agencyCriteria = {
                eligibilityCodes: ['11'],
                includeKeywords: ['Covid'],
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
                includeKeywords: ['earth sciences'],
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
            expect(result).to.equal('6');
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
            expect(result.data.length).to.equal(2);
            expect(result.data[0].grant_id).to.equal('1');
        });
    });

    context('getAgencyCriteriaForAgency', () => {
        it('gets agency criteria associated with an agency', async () => {
            const staffUserId = await db.knex(TABLES.users).where('email', fixtures.users.staffUser.email);
            const result = await db.getAgencyCriteriaForAgency(staffUserId[0].agency_id);

            expect(result).to.have.property('eligibilityCodes').with.lengthOf(2);
            expect(result.eligibilityCodes[0])
                .to.equal(fixtures.agencyEligibilityCodes.accountancyNative.code);
            expect(result).to.have.property('includeKeywords').with.lengthOf(1);
            expect(result).to.have.property('excludeKeywords').with.lengthOf(1);
            expect(result.includeKeywords[0]).to.equal(fixtures.keywords.accountancyCovid.search_term);
            expect(result.excludeKeywords[0]).to.equal(fixtures.keywords.accountancyClimate.search_term);
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

    context('getGrants with various filters', () => {
        /*
            filters: {
                reviewStatuses: List[Enum['Applied', 'Not Applying', 'Interested']],
                eligibilityCodes: List[String],
                includeKeywords: List[String],
                excludeKeywords: List[String],
                opportunityNumber: String,
                fundingTypes: List[Enum['CA, 'G', 'PC' ,'O']]
                opportunityStatuses: List[Enum['posted', 'forecasted', 'closed']],
                opportunityCategories: List[Enum['Other', 'Discretionary', 'Mandatory', 'Continuation']],
                costSharing: Enum['Yes', 'No'],
                agencyCode: String,
                postedWithinDays: number,
                assignedToAgencyId: Optional[number],
                bill: String,
            },
            paginationParams: { currentPage: number, perPage: number, isLengthAware: boolean },
            orderingParams: { orderBy: List[string], orderDesc: boolean}
            tenantId: number
            agencyId: number
        */
        it('gets grants that originate from specific bills', async () => {
            const result = await db.getGrantsNew(
                { bill: 'Infrastructure Investment and Jobs Act' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(2);
            result.data.forEach((grant) => { expect(grant.bill).to.contain('IIJA'); });
            expect(result.pagination.total).to.equal(2);
            expect(result.pagination.lastPage).to.equal(1);

            const result2 = await db.getGrantsNew(
                { bill: 'Inflation Reduction Act' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result2).to.have.property('data').with.lengthOf(1);
            expect(result2.data[0].bill).to.contain('Inflation Reduction Act');
            expect(result2.pagination.total).to.equal(1);
            expect(result2.pagination.lastPage).to.equal(1);
        });
        it('gets grants with agency codes', async () => {
            const result = await db.getGrantsNew(
                { agencyCode: 'HHS' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(4);
            result.data.forEach((grant) => { expect(grant.agency_code).to.contain('HHS'); });
            expect(result.pagination.total).to.equal(4);
            expect(result.pagination.lastPage).to.equal(1);

            const result2 = await db.getGrantsNew(
                { agencyCode: 'DOD-DARPA-TTO' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result2).to.have.property('data').with.lengthOf(1);
            expect(result2.data[0].agency_code).to.contain('DOD-DARPA-TTO');
            expect(result2.pagination.total).to.equal(1);
            expect(result2.pagination.lastPage).to.equal(1);
        });
        it('gets grants that either have or do not have cost sharing', async () => {
            const result = await db.getGrantsNew(
                { costSharing: 'Yes' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(0);
            expect(result.pagination.total).to.equal(0);
            expect(result.pagination.lastPage).to.equal(0);

            const result2 = await db.getGrantsNew(
                { costSharing: 'No' },
                { currentPage: 1, perPage: 3, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result2).to.have.property('data').with.lengthOf(3);
            expect(result2.pagination.total).to.equal(6);
            expect(result2.pagination.lastPage).to.equal(2);
        });
        it('gets grants with a specific opportunity categories', async () => {
            const result = await db.getGrantsNew(
                { opportunityCategories: ['Mandatory', 'Continuation'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(0);
            expect(result.pagination.total).to.equal(0);
            expect(result.pagination.lastPage).to.equal(0);

            const result2 = await db.getGrantsNew(
                { opportunityCategories: ['Discretionary', 'Other'] },
                { currentPage: 1, perPage: 4, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result2).to.have.property('data').with.lengthOf(4);
            expect(result2.pagination.total).to.equal(6);
            expect(result2.pagination.lastPage).to.equal(2);
        });
        it('gets grants with a specific funding types aka funding instrument codes', async () => {
            const result = await db.getGrantsNew(
                { fundingTypes: ['CA'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(2);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.earFellowship.grant_id);
            expect(result.data[1].grant_id).to.equal(fixtures.grants.resultGrant.grant_id);
            expect(result.pagination.total).to.equal(2);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants with a specific opportunity number', async () => {
            const result = await db.getGrantsNew(
                { opportunityNumber: 'HHS-2021-IHS-TPI-0001' },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.healthAide.grant_id);
            expect(result.pagination.total).to.equal(1);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that have any of the eligibility codes', async () => {
            const result = await db.getGrantsNew(
                { eligibilityCodes: ['11', '07'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(2);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.redefiningPossible.grant_id);
            expect(result.data[1].grant_id).to.equal(fixtures.grants.healthAide.grant_id);
            expect(result.pagination.total).to.equal(2);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that are marked as interested', async () => {
            const result = await db.getGrantsNew(
                { reviewStatuses: ['Interested'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.interestedGrant.grant_id);
            expect(result.pagination.total).to.equal(1);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that are marked as Result', async () => {
            const result = await db.getGrantsNew(
                { reviewStatuses: ['Applied'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.resultGrant.grant_id);
            expect(result.pagination.total).to.equal(1);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that are marked as Rejected', async () => {
            const result = await db.getGrantsNew(
                { reviewStatuses: ['Not Applying'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(2);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.earFellowship.grant_id);
            expect(result.data[1].grant_id).to.equal(fixtures.grants.healthAide.grant_id);
            expect(result.pagination.total).to.equal(2);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that are Assigned', async () => {
            const result = await db.getGrantsNew(
                { assignedToAgencyId: fixtures.agencies.accountancy.id },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: 'true' },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
            expect(result.data[0].grant_id).to.equal(fixtures.grants.earFellowship.grant_id);
            expect(result.pagination.total).to.equal(1);
            expect(result.pagination.lastPage).to.equal(1);
        });
        it('gets grants that match any include keywords', async () => {
            const result = await db.getGrantsNew(
                { includeKeywords: ['earth', 'sciences'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: true },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
        });
        it('gets grants that match any include phrases', async () => {
            const result = await db.getGrantsNew(
                { includeKeywords: ['earth sciences'] },
                { currentPage: 1, perPage: 10, isLengthAware: true },
                { orderBy: 'open_date', orderDesc: true },
                fixtures.tenants.SBA.id,
                fixtures.agencies.accountancy.id,
            );
            expect(result).to.have.property('data').with.lengthOf(1);
        });
    });

    context('getAgency', () => {
        it('returns undefined if no agency matches argument', async () => {
            const result = await db.getAgency(999);
            expect(result.length).to.equal(0);
        });
        it('returns single agency if valid ID is supplied', async () => {
            const result = await db.getAgency(fixtures.agencies.accountancy.id);
            expect(result[0].name).to.equal('State Board of Accountancy');
        });
    });

    context('getAgenciesByIds', () => {
        it('returns all agencies matching ID list', async () => {
            const result = await db.getAgenciesByIds([
                fixtures.agencies.accountancy.id,
                fixtures.agencies.fleetServices.id,
            ]);
            expect(result[0].name).to.equal('State Board of Accountancy');
            expect(result[1].name).to.equal('Administration: Fleet Services Division');
        });
        it('returns empty list if IDs do not match any agency', async () => {
            const result = await db.getAgenciesByIds([
                999,
                998,
            ]);
            expect(result).to.have.lengthOf(0);
        });
    });

    context('getUsersByAgency', () => {
        it('returns all users part of the agency', async () => {
            const result = await db.getUsersByAgency(fixtures.agencies.accountancy.id);
            expect(result.length).to.equal(2);
        });
        it('returns empty list if no users are part of the agency', async () => {
            const result = await db.getUsersByAgency(fixtures.agencies.fleetServices.id);
            expect(result.length).to.equal(0);
        });
    });

    context('getUsersEmailAndName', () => {
        it('returns email and name from users', async () => {
            const result = await db.getUsersEmailAndName([
                fixtures.users.adminUser.id,
                fixtures.users.staffUser.id,
            ]);
            expect(result[0]).to.deep.equal({ id: 1, name: 'Admin User', email: 'admin.user@test.com' });
            expect(result[1]).to.deep.equal({ id: 2, name: 'Staff User', email: 'staff.user@test.com' });
        });
        it('returns empty array when invalid ID is passed in', async () => {
            const result = await db.getUsersEmailAndName([
                999,
                998,
            ]);
            expect(result).to.have.lengthOf(0);
        });
    });

    context('getAgenciesSubscribedToDigest', () => {
        beforeEach(() => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(() => {
            this.clock.restore();
        });
        it('returns agencies with keywords and eligibility codes setup with explicit subscriptions setup', async () => {
            /* ensure that admin user is subscribed to all notifications */
            await db.setUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.users.adminUser.agency_id);

            /* ensure that staff user is not subscribed to any notifications */
            const emailUnsubscribePreference = Object.assign(
                ...Object.values(emailConstants.notificationType).map(
                    (k) => ({ [k]: emailConstants.emailSubscriptionStatus.unsubscribed }),
                ),
            );
            await db.setUserEmailSubscriptionPreference(fixtures.users.staffUser.id, fixtures.users.staffUser.agency_id, emailUnsubscribePreference);

            const result = await db.getAgenciesSubscribedToDigest();
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal('State Board of Accountancy');
            expect(result[0].recipients.length).to.equal(1);
            expect(result[0].recipients[0]).to.equal(fixtures.users.adminUser.email);

            await knex('email_subscriptions').del();
        });
        it('returns agencies with keywords and eligibility codes setup with default subscribed', async () => {
            /* ensure that staff user is not subscribed to any notifications */
            const emailUnsubscribePreference = Object.assign(
                ...Object.values(emailConstants.notificationType).map(
                    (k) => ({ [k]: emailConstants.emailSubscriptionStatus.unsubscribed }),
                ),
            );
            await db.setUserEmailSubscriptionPreference(fixtures.users.staffUser.id, fixtures.users.staffUser.agency_id, emailUnsubscribePreference);

            const result = await db.getAgenciesSubscribedToDigest();
            expect(result.length).to.equal(1);
            expect(result[0].name).to.equal('State Board of Accountancy');
            expect(result[0].recipients.length).to.equal(1);
            expect(result[0].recipients[0]).to.equal(fixtures.users.adminUser.email);

            await knex('email_subscriptions').del();
        });
    });

    context('getNewGrantsForAgency', () => {
        beforeEach(() => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2022-06-22');
        });
        afterEach(() => {
            this.clock.restore();
        });
        it('returns zero grants if no grants match criteria and opened yesterday', async () => {
            const result = await db.getNewGrantsForAgency(fixtures.agencies.accountancy);
            expect(result.length).to.equal(0);
        });
        it('returns a grant whose modification date is one day ago', async () => {
            const newGrant = fixtures.grants.healthAide;
            newGrant.grant_id = '444816';
            // Note the use of `Date` -- this ensures compatibility with our mocked time
            newGrant.open_date = new Date('2022-06-21');
            await knex(TABLES.grants).insert(Object.values([newGrant]));
            const result = await db.getNewGrantsForAgency(fixtures.agencies.accountancy);
            expect(result.length).to.equal(1);
        });
    });

    context('getTotalInterestedGrantsByAgencies', () => {
        it('returns total interested grants by agencies', async () => {
            const agencyId = fixtures.users.staffUser.agency_id;
            const result = await db.getTotalInterestedGrantsByAgencies(agencyId);
            const agencyResult = result[0];
            expect(agencyResult.agency_id).to.equal(fixtures.agencies.accountancy.id);
            expect(agencyResult.interested).to.equal('1');
            expect(agencyResult.rejections).to.equal('2');

            expect(agencyResult.count).to.equal('4');
            expect(agencyResult.total_grant_money).to.equal('1506500');
            expect(agencyResult.total_interested_grant_money).to.equal('500000');
            expect(agencyResult.total_rejected_grant_money).to.equal('506500');
        });
    });

    context('createUser', () => {
        it('sets default email unsubuscribe when new users are created', async () => {
            const response = await db.createUser(
                {
                    email: 'foo@example.com',
                    name: 'sample name',
                    role_id: fixtures.roles.adminRole.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    tenant_id: fixtures.tenants.SBA.id,
                    id: 99991,
                },
            );
            const createdUser = await db.getUser(response.id);
            expect(createdUser.emailPreferences.GRANT_ASSIGNMENT).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            expect(createdUser.emailPreferences.GRANT_DIGEST).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            expect(createdUser.emailPreferences.GRANT_INTEREST).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            await db.deleteUser(response.id);
        });
    });

    context('deleteUser', () => {
        it('deletes email subscriptions when users are deleted', async () => {
            const response = await db.createUser(
                {
                    email: 'foo@example.com',
                    name: 'sample name',
                    role_id: fixtures.roles.adminRole.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    tenant_id: fixtures.tenants.SBA.id,
                    id: 99991,
                },
            );
            const createdUser = await db.getUser(response.id);
            expect(createdUser.emailPreferences.GRANT_ASSIGNMENT).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            expect(createdUser.emailPreferences.GRANT_DIGEST).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            expect(createdUser.emailPreferences.GRANT_INTEREST).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            await db.deleteUser(response.id);

            const existingSubscriptions = await knex('email_subscriptions').where('user_id', response.id);
            expect(existingSubscriptions.length).to.equal(0);
        });
    });

    context('userEmailSubscriptionPreferences', () => {
        beforeEach(() => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2022-06-22');
        });
        afterEach(() => {
            this.clock.restore();
        });
        it('gets default email subscription preferences if none exist', async () => {
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('gets user preferences if custom email subscriptions exist', async () => {
            const preferences = [
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantAssignment,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantDigest,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
                {
                    user_id: fixtures.users.adminUser.id,
                    agency_id: fixtures.agencies.accountancy.id,
                    notification_type: emailConstants.notificationType.grantInterest,
                    status: emailConstants.emailSubscriptionStatus.subscribed,
                },
            ];
            await knex('email_subscriptions').insert(preferences);
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('sets default email subscription preferences if none exist', async () => {
            await db.setUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id, {});
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(1);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
        });
        it('sets custom email subscription preferences', async () => {
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            const result = await db.getUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.agencies.accountancy.id);
            expect(result).to.have.all.keys(...Object.values(emailConstants.notificationType));
            expect(result[emailConstants.notificationType.grantAssignment]).to.equal(emailConstants.emailSubscriptionStatus.unsubscribed);
            const resultSet = new Set(Object.values(result));
            expect(resultSet.size).to.equal(2);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.subscribed)).to.equal(true);
            expect(resultSet.has(emailConstants.emailSubscriptionStatus.unsubscribed)).to.equal(true);
        });
        it('raises error if unknown notification type is supplied', async () => {
            let expectedError = '';

            const test = async () => {
                try {
                    await db.setUserEmailSubscriptionPreference(
                        fixtures.users.adminUser.id,
                        fixtures.agencies.accountancy.id,
                        {
                            UNKNOWN: emailConstants.emailSubscriptionStatus.subscribed,
                        },
                    );
                } catch (e) {
                    if (e instanceof Error) {
                        expectedError = e;
                    }
                }
            };

            await test();

            expect(expectedError instanceof Error).to.equal(true);
        });
        it('raises error if unknown subscription status is supplied', async () => {
            let expectedError = '';

            const test = async () => {
                try {
                    await db.setUserEmailSubscriptionPreference(
                        fixtures.users.adminUser.id,
                        fixtures.agencies.accountancy.id,
                        {
                            [emailConstants.notificationType.grantAssignment]: 'UNKNOWN',
                        },
                    );
                } catch (e) {
                    if (e instanceof Error) {
                        expectedError = e;
                    }
                }
            };

            await test();

            expect(expectedError instanceof Error).to.equal(true);
        });
        it('default subscribes all users to a notification if no rows exist', async () => {
            await knex('email_subscriptions').del();
            const assignmentResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantAssignment);
            const assignmentSubscribers = assignmentResult.map((r) => r.email);
            const digestResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantDigest);
            const digestSubscribers = digestResult.map((r) => r.email);
            const interestResult = await db.getSubscribersForNotification(fixtures.agencies.accountancy.id, emailConstants.notificationType.grantInterest);
            const interestSubscribers = interestResult.map((r) => r.email);

            expect(assignmentResult.length).to.equal(2);
            expect(assignmentSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(assignmentSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(digestResult.length).to.equal(2);
            expect(digestSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(digestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(interestResult.length).to.equal(2);
            expect(interestSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(interestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);
        });
        it('gets subscribed users for an agency', async () => {
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantInterest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.staffUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                    [emailConstants.notificationType.grantInterest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            );
            const assignmentResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantAssignment,
            );
            const assignmentSubscribers = assignmentResult.map((r) => r.email);
            const digestResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantDigest,
            );
            const digestSubscribers = digestResult.map((r) => r.email);
            const interestResult = await db.getSubscribersForNotification(
                fixtures.agencies.accountancy.id,
                emailConstants.notificationType.grantInterest,
            );
            expect(assignmentResult.length).to.equal(2);
            expect(assignmentSubscribers.includes(fixtures.users.staffUser.email)).to.equal(true);
            expect(assignmentSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(digestResult.length).to.equal(1);
            expect(digestSubscribers.includes(fixtures.users.adminUser.email)).to.equal(true);

            expect(interestResult.length).to.equal(0);
        });
    });
});
