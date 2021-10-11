const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/agencies` endpoint', async () => {
    const endpoint = `${process.env.API_DOMAIN}/api/agencies`;

    const agencies = {
        admin: {
            own: 0,
            ownSub: 109,
            offLimits: 70,
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
        fetchOptions.admin.headers.cookie = await getSessionCookie('michael@stanford.notreal');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user2@nv.gov');
    });

    context('GET /agencies?agency=N (list an agency and its subagencies)', async () => {
        context('by a user with admin role', async () => {
            it('lists this user\'s own agency and its subagencies', async () => {
                // Will default to user's own agency ID
                const response = await fetch(`${endpoint}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(329);
            });
            it('lists a subagency of this user\'s own agency and that subagency\'s subagencies', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.admin.ownSub}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(8);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.admin.offLimits}`, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists this user\'s own agency', async () => {
                // Will default to user's own agency ID
                console.log(`url: ${endpoint}`);
                const response = await fetch(`${endpoint}`, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(1);
                expect(json[0].id).to.equal(agencies.staff.own);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.staff.ownSub}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.staff.offLimits}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /agencies/:id (modify an agency\'s data)', async () => {
        const body = JSON.stringify({ warningThreshold: 2, dangerThreshold: 1 });

        context('by a user with admin role', async () => {
            it('updates this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/${agencies.admin.own}`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('updates a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/${agencies.admin.ownSub}`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/${agencies.admin.offLimits}`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/${agencies.staff.own}`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/${agencies.staff.ownSub}`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/${agencies.staff.offLimits}`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
