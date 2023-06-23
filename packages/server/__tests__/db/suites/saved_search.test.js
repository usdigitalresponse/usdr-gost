const { expect } = require('chai');
const sinon = require('sinon');
const knex = require('../../../src/db/connection');
const db = require('../../../src/db');
const savedSearch = require('../../../src/db/saved_search');
const { TABLES } = require('../../../src/db/constants');
const fixtures = require('../seeds/fixtures');
const emailConstants = require('../../../src/lib/email/constants');

/*
    createSavedSearch,
    getSavedSearches,
    deleteSavedSearch,

    id?: number
    agencyId: number
    userId: number
    criteria: string
    createdAt?: string

*/
export default function suite() {
    describe('Saved Search', () => {
        before(async () => {
            await fixtures.seed(db.knex);
        });

        after(async () => {
            await db.knex.destroy();
        });

        context('CRUD Saved Search', () => {
            it('creates a new saved search', async () => {
                const rows = await savedSearch.createSavedSearch({
                    agencyId: 0,
                    userId: 0,
                    criteria: 'test-search-text',
                });
                console.log(rows);
                const row = rows.data[0];
                expect(row).to.have.property('grant_id').with.lengthOf(6);
                expect(row.grant_id).to.equal(fixtures.grantsInterested.entry2.grant_id);
                // in the grants interested table the grant with the most recent created_at has the grant id of 335255
                expect(row).to.have.property('grant_id').equal('335255');
            });
            /*
            it('reads an existing saved search', async () => {
                // testing pagination
                const rows = await savedSearch.getSavedSearches({ agencyId: fixtures.users.staffUser.agency_id, perPage: 2, currentPage: 1 });
                expect(rows.data).to.have.lengthOf(2);
                expect(rows.data.map((r) => r.created_at.getTime())).to.have.all.members([1663117521515, 1659827033570]);
            });
            it('deletes an existing saved search', async () => {
                // testing pagination
                const rows = await savedSearch.deleteSavedSearch({ agencyId: fixtures.users.staffUser.agency_id, perPage: 2, currentPage: 1 });
                expect(rows.data).to.have.lengthOf(2);
                expect(rows.data.map((r) => r.created_at.getTime())).to.have.all.members([1663117521515, 1659827033570]);
            });
            */
        });
    });
}
