const { expect } = require('chai');

const { getSessionCookie, fetchApi } = require('./utils');

describe('`/api/eligibility-codes` endpoint', () => {
    const UNIQUE_CODES = 17; // all agencies have same number of codes

    const agencies = {
        admin: {
            own: 3,  // Test Agency, part of Test Tenant
            ownSub: 4,  // Test Sub-agency, part of Test Tenant
            offLimits: 0,  // USDR Agency, part of USDR Tenant
        },
        staff: {
            own: 3,  // Test Agency, part of Test Tenant
            ownSub: 4,  // Test Sub-agency, part of Test Tenant
            offLimits: 0,  // USDR Agency, part of USDR Tenant
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
        fetchOptions.admin.headers.cookie = await getSessionCookie('grants.dev+test.admin@usdigitalresponse.org');
        fetchOptions.staff.headers.cookie = await getSessionCookie('grants.dev+test.staff@usdigitalresponse.org');
    });

    context('GET /api/eligibility-codes?agency=N (list eligibility codes for an agency)', () => {
        context('by a user with admin role', () => {
            it('lists eligibility codes of this user\'s agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/eligibility-codes', agencies.admin.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
            });
            it('lists eligibility codes of a subagency of this user\'s agency', async () => {
                const response = await fetchApi('/eligibility-codes', agencies.admin.ownSub, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/eligibility-codes', agencies.admin.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('lists eligibility codes of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/eligibility-codes', agencies.staff.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(UNIQUE_CODES);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi('/eligibility-codes', agencies.staff.ownSub, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/eligibility-codes', agencies.staff.offLimits, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/eligibility-codes/:code/enable/:value?agency=N (modify an eligibility code for an agency)', () => {
        context('by a user with admin role', () => {
            it('updates an eligibility code of this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/eligibility-codes/01/enable/false', agencies.admin.own, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('updates an eligibility code of a subagency of this user\'s own agency', async () => {
                const response = await fetchApi('/eligibility-codes/02/enable/false', agencies.admin.ownSub, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/eligibility-codes/04/enable/false', agencies.admin.offLimits, { ...fetchOptions.admin, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/eligibility-codes/01/enable/false', agencies.staff.own, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi('/eligibility-codes/02/enable/false', agencies.staff.ownSub, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/eligibility-codes/04/enable/false', agencies.staff.offLimits, { ...fetchOptions.staff, method: 'put' });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
