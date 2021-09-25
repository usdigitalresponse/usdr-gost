const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/eligibility-codes` endpoint', async () => {
    const endpoint = `${process.env.API_DOMAIN}/api/eligibility-codes`;

    const UNIQUE_CODES = 17; // all agencies have same number of codes

    const agencies = {
        admin: {
            own: 0,
            ownSub: 385,
            offLimits: 70,
        },
        staff: {
            own: 384,
            ownSub: 3,
            offLimits: 0,
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

    context('GET /api/eligibility-codes?agency=N (list eligibility codes for an agency)', async () => {
        context('by a user with admin role', async () => {
            it('lists eligibility codes of this user\'s agency', async () => {
                // Will default to user's own agency ID
                const response = await fetch(`${endpoint}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
            });
            it('lists eligibility codes of a subagency of this user\'s agency', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.admin.ownSub}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}?agency=${agencies.admin.offLimits}`, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists eligibility codes of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetch(`${endpoint}`, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
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
    context('PUT /api/eligibility-codes/:code/enable/:value?agency=N (modify an eligibilty code for an agency)', async () => {
        context('by a user with admin role', async () => {
            it('updates an eligibility code of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetch(`${endpoint}/01/enable/false`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('updates an eligibility code of a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/02/enable/false?agency=${agencies.admin.ownSub}`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/04/enable/false?agency=${agencies.admin.offLimits}`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetch(`${endpoint}/01/enable/false`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${endpoint}/02/enable/false?agency=${agencies.staff.ownSub}`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${endpoint}/04/enable/false?agency=${agencies.staff.offLimits}`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
