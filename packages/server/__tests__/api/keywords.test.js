const { expect } = require('chai');

const _ = require('lodash-checkit');
const { getSessionCookie, fetchApi, knex } = require('./utils');
const { TABLES } = require('../../src/db/constants');

describe('`/api/keywords` endpoint', async () => {
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

    let testKeywordsByAgency = null;

    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('admin1@nv.gov');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user1@nv.gov');

        // Tests below assume the presence of at least one keyword per agency. Previously, we had
        // a db seed that created some default COVID-related keywords but now that that is gone, we
        // create some here to avoid dependence on the global keywords seed.
        // Note: this does not dedupe agency IDs and that's by design; some of the tests need to
        // delete multiple keywords from the same agency.
        const allAgencyIds = Object.values(agencies.admin).concat(Object.values(agencies.staff));
        const testKeywords = allAgencyIds.map((agency_id) => ({
            mode: 'autoinsert ALL keywords matches',
            search_term: 'test_keyword',
            notes: '',
            agency_id,
        }));
        const createdKeywords = await knex(TABLES.keywords)
            .insert(testKeywords)
            .onConflict('id')
            .merge()
            .returning(['id', 'agency_id']);
        testKeywordsByAgency = _.groupBy(createdKeywords, 'agency_id');
    });

    after(async () => {
        // Delete keywords created by this test to avoid impacting other tests
        const allTestKeywordIds = _.chain(testKeywordsByAgency)
            .values()
            .flatten()
            .map('id')
            .value();
        await knex(TABLES.keywords)
            .whereIn('id', allTestKeywordIds)
            .del();
    });

    context('GET api/keywords', async () => {
        context('by a user with admin role', async () => {
            it('lists keywords of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi(`/keywords`, agencies.admin.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect((json.every((r) => r.agency_id === agencies.admin.own))).to.equal(true);
            });
            it('lists keywords of a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.ownSub, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect((json.every((r) => r.agency_id === agencies.admin.ownSub))).to.equal(true);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists keywords of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi(`/keywords`, agencies.staff.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect((json.every((r) => r.agency_id === agencies.staff.own))).to.equal(true);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.staff.ownSub, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords`, agencies.staff.offLimits, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('POST /keywords (create a keyword for an agency)', async () => {
        const keyword = {
            search_term: 'test keyword',
            mode: '',
            notes: 'notes',
        };

        const idsToDelete = [];
        after(async () => {
            await knex(TABLES.keywords).whereIn('id', idsToDelete).del();
        });

        context('by a user with admin role', async () => {
            it('creates a keyword for this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(Number(json.agency_id)).to.equal(agencies.admin.own);
                idsToDelete.push(json.id);
            });
            it('creates a keyword for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.ownSub, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(Number(json.agency_id)).to.equal(agencies.admin.ownSub);
                idsToDelete.push(json.id);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.offLimits, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.staff.own, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.staff.ownSub, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords`, agencies.staff.offLimits, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...keyword }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('DELETE /keywords/:id (delete a keyword for an agency)', async () => {
        context('by a user with admin role', async () => {
            it('deletes a keyword of this user\'s own agency', async () => {
                const keywordId = testKeywordsByAgency[agencies.admin.own][0].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('deletes a keyword of a subagency of this user\'s own agency', async () => {
                const keywordId = testKeywordsByAgency[agencies.admin.ownSub][0].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.admin.ownSub, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a keyword of an agency outside this user\'s hierarchy', async () => {
                const keywordId = testKeywordsByAgency[agencies.admin.offLimits][0].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.admin.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                // Note: staff and admin test users share the same "own" agency id
                const keywordId = testKeywordsByAgency[agencies.staff.own][1].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.staff.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const keywordId = testKeywordsByAgency[agencies.staff.ownSub][0].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.staff.ownSub, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const keywordId = testKeywordsByAgency[agencies.staff.offLimits][0].id;
                const response = await fetchApi(`/keywords/${keywordId}`, agencies.staff.offLimits, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
