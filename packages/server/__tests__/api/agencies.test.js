const { expect } = require('chai');
require('dotenv').config();

const { getSessionCookie, fetchApi } = require('./utils');

describe('`/api/organizations/:organizationId/agencies` endpoint', async () => {
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
        fetchOptions.admin.headers.cookie = await getSessionCookie('mindy@usdigitalresponse.org');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user2@nv.gov');
    });

    context('GET organizations/:organizationId/agencies (list an agency and its subagencies)', async () => {
        context('by a user with admin role', async () => {
            it('lists this user\'s own agency and its subagencies', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/agencies', agencies.admin.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(330);
            });
            it('lists a subagency of this user\'s own agency and that subagency\'s subagencies', async () => {
                const response = await fetchApi('/agencies', agencies.admin.ownSub, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(8);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/agencies', agencies.admin.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists this user\'s own agency', async () => {
                // Will default to user's own agency ID
                const response = await fetchApi('/agencies', agencies.staff.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(1);
                expect(json[0].id).to.equal(agencies.staff.own);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi('/agencies', agencies.staff.ownSub, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi('/agencies', agencies.staff.offLimits, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('PUT /organizations/:organizationId/agencies/:id (modify an agency\'s data)', async () => {
        const body = JSON.stringify({ warningThreshold: 2, dangerThreshold: 1 });

        context('by a user with admin role', async () => {
            it('updates this user\'s own agency', async () => {
                const response = await fetchApi(`/agencies/${agencies.admin.own}`, agencies.admin.own, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('updates a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/agencies/${agencies.admin.ownSub}`, agencies.admin.ownSub, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/agencies/${agencies.admin.offLimits}`, agencies.admin.offLimits, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/agencies/${agencies.staff.own}`, agencies.staff.own, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/agencies/${agencies.staff.ownSub}`, agencies.staff.ownSub, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/agencies/${agencies.staff.offLimits}`, agencies.staff.offLimits, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
