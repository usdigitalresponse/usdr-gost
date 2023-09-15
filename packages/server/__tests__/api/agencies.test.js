const { expect } = require('chai');
const sinon = require('sinon');
const { getSessionCookie, makeTestServer } = require('./utils');
const emailService = require('../../src/lib/email/service-email');
const email = require('../../src/lib/email');
const {
    createAgency, createUser, deleteUser, deleteAgency,
} = require('../../src/db');
const fixtures = require('../db/seeds/fixtures');

describe('`/api/organizations/:organizationId/agencies` endpoint', () => {
    const agencies = {
        admin: {
            own: 0,
            ownSub: 400,
            offLimits: 109,
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
        nonUSDRAdmin: {
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
    const sandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox.spy(emailService);
    });

    afterEach(() => {
        sinon.restore();
        sandbox.restore();
    });

    let testServer;
    let fetchApi;
    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('mindy@usdigitalresponse.org');
        fetchOptions.nonUSDRAdmin.headers.cookie = await getSessionCookie('joecomeau01@gmail.com');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user2@nv.gov');

        testServer = await makeTestServer();
        fetchApi = testServer.fetchApi;
    });
    after(() => {
        testServer.stop();
    });

    context('GET organizations/:organizationId/agencies', () => {
        it('lists all agencies within a tenant', async () => {
            // Will default to user's own agency ID
            const response = await fetchApi('/agencies', agencies.admin.own, fetchOptions.admin);
            expect(response.statusText).to.equal('OK');
            const json = await response.json();
            expect(json.length).to.equal(4);
            expect(json.map((j) => j.id)).to.have.all.members([0, 400, 401, 402]);
        });
        it('is forbidden for an agency outside this user\'s tenant', async () => {
            const response = await fetchApi('/agencies', agencies.admin.offLimits, fetchOptions.admin);
            expect(response.statusText).to.equal('Forbidden');
        });
    });

    context('DELETE /api/organizations/:organizationId/agencies/del/:agency', () => {
        let admin;
        let deleteRequest;
        let agency;
        before(async () => {
            admin = await createUser({
                name: 'Test Admin',
                email: 'admin@example.com',
                agency_id: 0,
                tenant_id: 1,
                role_id: fixtures.roles.adminRole.id,
            });
            agency = await createAgency({
                name: 'Agency To Delete',
                abbreviation: 'ATD',
                code: 'ATD',
                parent: 0,
                tenant_id: 1,
                warning_threshold: 12,
                danger_threshold: 34,
            }, admin.id);
            deleteRequest = async (agencyToDelete) => fetchApi(
                `/agencies/del/${agencyToDelete.id}`,
                admin.agency_id,
                {
                    headers: {
                        cookie: await getSessionCookie(admin.id),
                        'Content-Type': 'application/json',
                    },
                    method: 'delete',
                    body: JSON.stringify({
                        warningThreshold: 12, dangerThreshold: 34, ...agencyToDelete,
                    }),
                },
            );
        });
        after(async () => {
            const {
                id, parent, name, abbreviation, warning_threshold, danger_threshold,
            } = agency;
            await deleteAgency(id, parent, name, abbreviation, warning_threshold, danger_threshold);
            await deleteUser(admin.id);
        });

        it('issues 400 Bad Request when agency has users', async () => {
            const blockingUser = await createUser({
                name: 'Some One',
                email: 'staff@example.com',
                agency_id: agency.id,
                tenant_id: agency.tenant_id,
                role_id: fixtures.roles.staffRole.id,
            });
            const response = await deleteRequest(agency);
            expect(response.status).to.equal(400);
            expect(await response.text()).to.equal('agency has assigned users');
            // Cleanup
            await deleteUser(blockingUser.id);
        });

        it('issues 400 Bad Request when agency has sub-agencies', async () => {
            const subAgency = await createAgency({
                name: 'Child of Agency To Delete',
                abbreviation: 'COATD',
                code: 'COATD',
                parent: agency.id,
                tenant_id: agency.tenant_id,
                warning_threshold: 12,
                danger_threshold: 34,
            }, admin.id);
            const response = await deleteRequest(agency);
            expect(response.status).to.equal(400);
            expect(await response.text()).to.equal('agency has sub-agencies');
            // Cleanup
            const {
                id, parent, name, abbreviation, warning_threshold, danger_threshold,
            } = subAgency;
            await deleteAgency(id, parent, name, abbreviation, warning_threshold, danger_threshold);
        });

        it('issues 200 OK when agency has no users or sub-agencies', async () => {
            const subAgency = await createAgency({
                name: 'Another Child of Agency To Delete',
                abbreviation: 'ACOATD',
                code: 'ACOATD',
                parent: agency.id,
                tenant_id: agency.tenant_id,
                warning_threshold: 12,
                danger_threshold: 34,
            }, admin.id);
            console.log(JSON.stringify(subAgency));
            const response = await deleteRequest(subAgency);
            expect(response.status).to.equal(200);
        });
    });

    context('GET organizations/:organizationId/agencies/sendDigestEmail', () => {
        it('kicks off the digest email for usdr admin users', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantDigest', sendFake);
            const response = await fetchApi('/agencies/sendDigestEmail', agencies.admin.own, fetchOptions.admin);
            expect(response.statusText).to.equal('OK');
            expect(sendFake.getCalls()[0].firstArg.name).to.equal('USDR');
            expect(sendFake.calledOnce).to.equal(true);
        });
        it('is forbidden for non-usdr admin users', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantDigest', sendFake);
            const response = await fetchApi('/agencies/sendDigestEmail', agencies.admin.own, fetchOptions.nonUSDRAdmin);
            expect(response.statusText).to.equal('Forbidden');
        });
    });

    context('PUT /organizations/:organizationId/agencies/:id (modify an agency\'s data)', () => {
        const body = JSON.stringify({ warningThreshold: 2, dangerThreshold: 1 });

        context('by a user with admin role', () => {
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
        context('by a user with staff role', () => {
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
