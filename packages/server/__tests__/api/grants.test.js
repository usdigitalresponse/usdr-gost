const { expect } = require('chai');
const fetch = require('node-fetch');
const { getSessionCookie } = require('./utils');
require('dotenv').config();

/*
    In general, these tests ...
        DO validate the data returned by GET requests, but
        DO NOT validate database contents after POST, PUT, DELETE requests.
*/

describe('`/api/grants` endpoint', async () => {
    const endpoint = `${process.env.API_DOMAIN}/api/grants`;

    const agencies = {
        own: 384,
        ownSub: 2,
        ownSubAlternate: 1,
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

    context('PUT api/grants/:grantId/view/:agencyId', async () => {
        context('by a user with admin role', async () => {
            const viewEndpoint = `${endpoint}/335255/view`;
            it('marks the grant viewed for this user\'s own agency', async () => {
                const response = await fetch(`${viewEndpoint}/${agencies.own}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('marks the grant viewed for a subagency of this user\'s own agency', async () => {
                const response = await fetch(`${viewEndpoint}/${agencies.ownSub}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${viewEndpoint}/${agencies.offLimits}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            const viewEndpoint = `${endpoint}/333333/view`;
            it('marks the grant viewed for this user\'s own agency', async () => {
                const response = await fetch(`${viewEndpoint}/${agencies.own}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                let response = await fetch(`${viewEndpoint}/${agencies.ownSub}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');

                response = await fetch(`${viewEndpoint}/${agencies.offLimits}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('GET /api/grants/:grantId/assign/agencies', async () => {
        const assignedEndpoint = `${endpoint}/335255/assign/agencies`;
        context('by a user with admin role', async () => {
            let response;
            let json;
            before(async () => {
                response = await fetch(assignedEndpoint, fetchOptions.admin);
                json = await response.json();
            });
            it('includes this user\'s own agency when it is assigned to the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.own))).to.equal(true);
            });
            it('includes a subagency of this user\'s own agency when the subagency is assigned to the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.ownSub))).to.equal(true);
            });
            it('excludes assigned agencies outside this user\'s hierarchy', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('includes only the queried subagency of this user\'s own agency when the subagency is assigned to the grant', async () => {
                const queryResponse = await fetch(`${assignedEndpoint}?agency=${agencies.ownSub}`, fetchOptions.admin);
                expect(queryResponse.statusText).to.equal('OK');
                const queryJson = await queryResponse.json();
                expect(queryJson.length).to.equal(1);
                expect(queryJson[0].agency_id).to.equal(agencies.ownSub);
            });
            it('forbids requests for agencies outside this user\'s hierarchy', async () => {
                const badResponse = await fetch(`${assignedEndpoint}?agency=${agencies.offLimits}`, fetchOptions.admin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            let response;
            let json;
            before(async () => {
                response = await fetch(assignedEndpoint, fetchOptions.staff);
                json = await response.json();
            });
            it('includes this user\'s own agency when it is assigned to the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.own))).to.equal(true);
            });
            it('excludes a subagency of this user\'s own agency when the subagency is assigned to the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.ownSub)).to.equal(true);
            });
            it('excludes assigned agencies outside this user\'s hierarchy', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                const badResponse = await fetch(`${assignedEndpoint}?agency=${agencies.ownSub}`, fetchOptions.staff);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/grants/:grantId/assign/agencies', async () => {
        const assignEndpoint = `${endpoint}/333816/assign/agencies`;
        context('by a user with admin role', async () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetch(assignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('assigns subagencies of this user\'s own agency to a grant', async () => {
                const response = await fetch(assignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('completes valid assignment requests without regard to agency in query string', async () => {
                const response = await fetch(`${assignEndpoint}?agency=${agencies.ownSub}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                let response = await fetch(assignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(`${assignEndpoint}?agency=${agencies.offLimits}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetch(assignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetch(assignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(assignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(`${assignEndpoint}?agency=${agencies.offLimits}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('DELETE /api/grants/:grantId/assign/agencies', async () => {
        const unassignEndpoint = `${endpoint}/333816/assign/agencies`;
        context('by a user with admin role', async () => {
            it('unassigns this user\'s own agency from a grant', async () => {
                const response = await fetch(unassignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('unassigns subagencies of this user\'s own agency from a grant', async () => {
                const response = await fetch(unassignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('completes valid unassignment requests without regard to agency in query string', async () => {
                const response = await fetch(`${unassignEndpoint}?agency=${agencies.ownSub}`, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                let response = await fetch(unassignEndpoint, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(`${unassignEndpoint}?agency=${agencies.offLimits}`, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            it('unassigns this user\'s own agency to a grant', async () => {
                const response = await fetch(unassignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetch(unassignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(unassignEndpoint, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(`${unassignEndpoint}?agency=${agencies.offLimits}`, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('GET /api/grants/:grantId/interested', async () => {
        const interestEndpoint = `${endpoint}/335255/interested`;
        context('by a user with admin role', async () => {
            let response;
            let json;
            before(async () => {
                response = await fetch(interestEndpoint, fetchOptions.admin);
                json = await response.json();
            });
            it('includes this user\'s own agency when it is interested in the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.own))).to.equal(true);
            });
            it('includes a subagency of this user\'s own agency when the subagency is interested in the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.ownSub))).to.equal(true);
            });
            it('excludes interested agencies outside this user\'s hierarchy', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('includes only the queried subagency of this user\'s own agency when the subagency is interested in the grant', async () => {
                const queryResponse = await fetch(`${interestEndpoint}?agency=${agencies.ownSub}`, fetchOptions.admin);
                expect(queryResponse.statusText).to.equal('OK');
                const queryJson = await queryResponse.json();
                expect(queryJson.length).to.equal(1);
                expect(queryJson[0].agency_id).to.equal(agencies.ownSub);
            });
            it('forbids requests for agencies outside this user\'s hierarchy', async () => {
                const badResponse = await fetch(`${interestEndpoint}?agency=${agencies.offLimits}`, fetchOptions.admin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            let response;
            let json;
            before(async () => {
                response = await fetch(interestEndpoint, fetchOptions.staff);
                json = await response.json();
            });
            it('includes this user\'s own agency when it is interested in the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect((json.some((r) => r.agency_id === agencies.own))).to.equal(true);
            });
            it('excludes a subagency of this user\'s own agency when the subagency is interested in the grant', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.ownSub)).to.equal(true);
            });
            it('excludes interested agencies outside this user\'s hierarchy', async () => {
                expect(response.statusText).to.equal('OK');
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                const badResponse = await fetch(`${interestEndpoint}?agency=${agencies.ownSub}`, fetchOptions.staff);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/grants/:grantId/interested/:agencyId', async () => {
        context('by a user with admin role', async () => {
            const interestEndpoint = `${endpoint}/0/interested`;
            it('records this user\'s own agency\'s interest in a grant', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.own}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('records this user\'s own agency\'s subagencies\' interest in a grant', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.ownSub}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('rejects requests with agency in query string', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.ownSubAlternate}?agency=${agencies.own}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Bad Request');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.offLimits}`, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', async () => {
            const interestEndpoint = `${endpoint}/333333/interested`;
            it('records this user\'s own agency\'s interest in a grant', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.own}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests with agency in query string', async () => {
                const response = await fetch(`${interestEndpoint}/${agencies.ownSubAlternate}?agency=${agencies.own}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetch(`${interestEndpoint}/${agencies.ownSub}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetch(`${interestEndpoint}/${agencies.offLimits}`, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
});
