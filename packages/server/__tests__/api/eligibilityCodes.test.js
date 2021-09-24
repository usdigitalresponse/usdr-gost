const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/eligibility-codes` endpoint', async () => {
    const urlPrefix = `${process.env.API_DOMAIN}/api`;

    const agencies = {
        own: 0,
        ownSub: 385,
        offLimits: 70,
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
        fetchOptions.admin.headers.cookie = await getSessionCookie('michael@stanford.cc');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user2@nv.gov');
    });

    context('GET /api/eligibility-codes', async () => {
        context('by a user with admin role', async () => {
            it('lists eligibility codes of this user\'s own agency and its subagencies', async () => {
                // Will default to user's agency ID: 0
                const response = await fetch(`${urlPrefix}/eligibility-codes`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(17);
            });
            it('lists eligibility codes of a subagency of this user\'s own agency and that subagency\'s subagencies', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes?agency=${agencies.ownSub}`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(17);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes?agency=${agencies.offLimits}`, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists eligibility codes of this user\'s own agency', async () => {
                // Will default to user's agency ID: 0
                const response = await fetch(`${urlPrefix}/eligibility-codes`, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(17);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes?agency=${agencies.ownSub}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes?agency=${agencies.offLimits}`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/eligibility-codes/:code/enable/:value', async () => {
        context('by a user with admin role', async () => {
            it('updates an eligibility code of this user\'s own agency', async () => {
                // Will default to user's agency ID: 0
                const response = await fetch(`${urlPrefix}/eligibility-codes/01/enable/false`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('updates an eligibility code of a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes/02/enable/false?agency=${agencies.ownSub}`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes/04/enable/false?agency=${agencies.offLimits}`, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                // Will default to user's agency ID: 0
                const response = await fetch(`${urlPrefix}/eligibility-codes/01/enable/false`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes/02/enable/false?agency=${agencies.ownSub}`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/eligibility-codes/04/enable/false?agency=${agencies.offLimits}`, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
