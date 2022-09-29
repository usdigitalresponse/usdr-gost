const { expect } = require('chai');
const { getSessionCookie, makeTestServer } = require('./utils');

describe('`/api/users` endpoint', () => {
    const agencies = {
        own: 0,
        ownSub: 401,
        offLimits: 384,
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

    let testServer;
    let fetchApi;
    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('mindy@usdigitalresponse.org');
        fetchOptions.staff.headers.cookie = await getSessionCookie('mindy+testsub@usdigitalresponse.org');

        testServer = await makeTestServer();
        fetchApi = testServer.fetchApi;
    });
    after(() => {
        testServer.stop();
    });

    context('POST /api/users (create a user for an agency)', () => {
        const user = {
            email: 'test@example.com',
            name: 'Test Name',
            role: 2,
            agency: undefined,
        };

        context('by a user with admin role', () => {
            it('creates a user in this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `1${user.email}` }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('creates a user in a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `2${user.email}` }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `3${user.email}` }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('GET /api/users?agency=N (list users for a tenant)', () => {
        context('by a user with admin role', () => {
            it('lists all users in the tenant', async () => {
                const response = await fetchApi(`/users`, agencies.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(9);
            });
            it('lists users for an agency outside this user\'s hierarchy but in the same tenant', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('DELETE /api/users/:id', () => {
        context('by a user with admin role', () => {
            it('deletes a user in this user\'s tenant', async () => {
                const response = await fetchApi(`/users/4`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a user in an agency outside this user\'s tenant', async () => {
                const response = await fetchApi(`/users/8`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own tenant', async () => {
                const response = await fetchApi(`/users/3`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
