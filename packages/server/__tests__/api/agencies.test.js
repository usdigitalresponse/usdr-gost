const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

describe('`/api/agencies` endpoint', async () => {
    const urlPrefix = `${process.env.API_DOMAIN}/api`;

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

    context('GET /agencies', async () => {
        context('by a user with admin role', async () => {
            it('lists this user\'s own agency and its subagencies', async () => {
                // Will default to user's agency ID: 0
                const response = await fetch(`${urlPrefix}/agencies`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(329);
            });
            it('lists a subagency of this user\'s own agency and that subagency\'s subagencies', async () => {
                const response = await fetch(`${urlPrefix}/agencies?agency=109`, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(8);
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/agencies?agency=70`, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('lists this user\'s own agency', async () => {
                // Will default to user's agency ID: 384
                const response = await fetch(`${urlPrefix}/agencies`, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(327);
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/agencies?agency=40`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/agencies?agency=70`, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /agencies/:id', async () => {
        const body = JSON.stringify({ warningThreshold: 2, dangerThreshold: 1 });

        context('by a user with admin role', async () => {
            it('updates this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/agencies/0`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('updates a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/agencies/109`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/agencies/70`, { ...fetchOptions.admin, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/agencies/384`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${urlPrefix}/agencies/40`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetch(`${urlPrefix}/agencies/70`, { ...fetchOptions.staff, method: 'put', body });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
