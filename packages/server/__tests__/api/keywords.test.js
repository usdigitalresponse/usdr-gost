const { expect } = require('chai');
require('dotenv').config();

const { getSessionCookie, fetchApi } = require('./utils');

describe('`/api/keywords` endpoint', async () => {
    const UNIQUE_KEYWORDS = 7; // all agencies have the same keywords

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

    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('michael@nv.gov');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user1@nv.gov');
    });

    context('GET api/keywords', async () => {
        context('by a user with admin role', async () => {
            it('lists keywords of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi(`/keywords`, agencies.admin.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_KEYWORDS);
                expect((json.every((r) => r.agency_id === agencies.admin.own))).to.equal(true);
            });
            it('lists keywords of a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords`, agencies.admin.ownSub, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_KEYWORDS);
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
                expect(json.length).to.equal(UNIQUE_KEYWORDS);
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
                const response = await fetchApi(`/keywords/16`, agencies.admin.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('deletes a keyword of a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords/143`, agencies.admin.ownSub, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a keyword of an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords/4`, agencies.admin.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords/17`, agencies.staff.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/keywords/144`, agencies.staff.ownSub, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/keywords/4`, agencies.staff.offLimits, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
