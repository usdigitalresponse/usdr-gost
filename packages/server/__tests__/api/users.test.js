const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/users` endpoint', () => {
    const agencies = {
        usdr: 0,
        nevada: 384,
        procurement: 113,
    };

    const fetchHeaders = {
        'Content-Type': 'application/json',
        cookie: undefined,
    };

    before(async function beforeHook() {
        this.timeout(3000); // Getting session cookie can exceed default timeout.
        fetchHeaders.cookie = await getSessionCookie('michael@nv.gov');
    });

    context('POST /users', () => {
        context('by a user with admin role', () => {
            it('creates a user in the user\'s own agency');
            it('creates a user in a subagency of the user\'s own agency');
            it('is forbidden for an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any agency (even the user\'s own)');
        });
    });

    context('GET /users', () => {
        context('by a user with admin role', () => {
            it('lists users for the user\'s own agency', async () => {
                const response = await fetch(`${process.env.API_DOMAIN}/api/users`, { headers: { organization: agencies.nevada, ...fetchHeaders } });
                expect(response.statusText).to.equal('OK');
                expect((await response.json()).length).to.equal(4);
            });
            it('lists users for a subagency of the user\'s own agency', async () => {
                const response = await fetch(`${process.env.API_DOMAIN}/api/users`, { headers: { organization: agencies.procurement, ...fetchHeaders } });
                expect(response.statusText).to.equal('OK');
                expect((await response.json()).length).to.equal(5);
            });
            it('is forbidden for an agency outside the user\'s hierarchy', async () => {
                const response = await fetch(`${process.env.API_DOMAIN}/api/users`, { headers: { organization: agencies.usdr, ...fetchHeaders } });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for any agency (even the user\'s own)');
        });
    });
    context('DELETE /users/:id', () => {
        context('by a user with admin role', () => {
            it('deletes a user in the user\'s own agency');
            it('deletes a user in a subagency of the user\'s own agency');
            it('is forbidden for a user in an agency outside the user\'s hierarchy');
        });
        context('by a user with staff role', () => {
            it('is forbidden for any user (even in the user\'s own agency)');
        });
    });
});
