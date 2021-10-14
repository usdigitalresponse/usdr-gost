const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/users` endpoint', async () => {
    const endpoint = `${process.env.API_DOMAIN}/api/users`;

    const agencies = {
        own: 384,
        ownSub: 113,
        offLimits: 0,
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

    context('POST /api/users (create a user for an agency)', async () => {
        const user = {
            email: 'test@example.com',
            name: 'Test Name',
            role: 2,
            agency: undefined,
        };

        context('by a user with admin role', async () => {
            it('creates a user in this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `1${user.email}`, agency: agencies.own }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('creates a user in a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `2${user.email}`, agency: agencies.ownSub }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `3${user.email}`, agency: agencies.offLimits }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user, agency: agencies.own }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user, agency: agencies.ownSub }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}`, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user, agency: agencies.offLimits }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('GET /api/users?agency=N (list users for an agency)', async () => {
        context('by a user with admin role', async () => {
            it('lists users for this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(11);
            });
            it('lists users for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.ownSub}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(6);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.offLimits}`, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.ownSub}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.offLimits}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('DELETE /api/users/:id', async () => {
        context('by a user with admin role', async () => {
            it('deletes a user in this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/8`, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('deletes a user in a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/9`, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a user in an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/4`, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/8`, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/9`, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/4`, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
