const { expect } = require('chai');

const _ = require('lodash-checkit');

const { getSessionCookie, makeTestServer, knex } = require('./utils');
const { TABLES } = require('../../src/db/constants');

describe('`/api/grants-saved-search` endpoint', () => {
    const agencies = {
        admin: {
            own: 384,
            ownSub: 2,
            offLimits: 0,
        },
        staff: {
            own: 384,
            ownSub: 18,
            offLimits: 70,
        },
    };

    const fetchOptions = {
        admin: {
            headers: {
                'Content-Type': 'application/json',
                cookie: undefined,
            },
        },
        staff: {
            headers: {
                'Content-Type': 'application/json',
                cookie: undefined,
            },
        },
    };

    let createdSearches = null;
    let testServer;
    let fetchApi;
    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('admin1@nv.gov');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user1@nv.gov');

        const allAgencyIds = new Set(Object.values(agencies.admin).concat(Object.values(agencies.staff)));
        const testSavedSearches = [];

        allAgencyIds.forEach((agency_id) => (testSavedSearches.push({
            name: `Saved Search ${agency_id}`,
            criteria: `Criteria for ${agency_id}`,
            created_by: 13,
        })));
        createdSearches = await knex(TABLES.grants_saved_searches)
            .insert(testSavedSearches)
            .onConflict('id')
            .merge()
            .returning(['id']);

        testServer = await makeTestServer();
        fetchApi = testServer.fetchApi;
    });
    after(() => {
        testServer.stop();
    });

    after(async () => {
        // Delete saved seraches created by this test to avoid impacting other tests
        const allTestSearchIds = _.chain(createdSearches)
            .values()
            .flatten()
            .map('id')
            .value();
        await knex(TABLES.grants_saved_searches)
            .whereIn('id', allTestSearchIds)
            .del();
    });

    context('GET api/grants-saved-search', () => {
        context('by an authorized user', () => {
            it('lists searches of a user when non-zero', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.data.length).to.equal(5);
            });
            it('lists saved searches of a user when there are none', async () => {
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.data.length).to.equal(0);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('POST /grants-saved-search (create a saved search for an agency)', () => {
        const savedSearch = {
            name: `New Search`,
            criteria: `Sample criteria`,
        };

        const idsToDelete = [];
        after(async () => {
            await knex(TABLES.grants_saved_searches).whereIn('id', idsToDelete).del();
        });

        context('by an authorized user', () => {
            it('creates a saved search for this user', async () => {
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...savedSearch }),
                });
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                idsToDelete.push(json.id);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.offLimits, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...savedSearch }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('cannot create a second saved search of the same name', async () => {
                const response = await fetchApi(`/grants-saved-search`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ name: 'Search2', criteria: '' }),
                });
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                idsToDelete.push(json.id);

                const response2 = await fetchApi(`/grants-saved-search`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ name: 'Search2', criteria: '' }),
                });
                expect(response2.statusText).to.equal('Bad Request');
                expect(await response2.text()).to.contain('already exists');
            });
        });
    });
    context('DELETE /grants-saved-search/:id (delete a saved search for an agency)', () => {
        context('by an authorized user', () => {
            it('deletes a saved search of this user', async () => {
                const searchId = createdSearches[0].id;
                const response = await fetchApi(`/grants-saved-search/${searchId}`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a saved search of an agency outside this user\'s hierarchy', async () => {
                const searchId = createdSearches[0].id;
                const response = await fetchApi(`/grants-saved-search/${searchId}`, agencies.admin.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
