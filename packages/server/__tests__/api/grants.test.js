const { expect } = require('chai');
const sinon = require('sinon');
const { getSessionCookie, makeTestServer, knex } = require('./utils');
const { TABLES } = require('../../src/db/constants');
const db = require('../../src/db');
const email = require('../../src/lib/email');

/*
    In general, these tests ...
        DO validate the data returned by GET requests, but
        DO NOT validate database contents after POST, PUT, DELETE requests.
*/

describe('`/api/grants` endpoint', () => {
    const agencies = {
        own: 384,
        ownSub: 2,
        ownSubAlternate: 1,
        offLimits: 0,
        dallasAdmin: 386,
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
        dallasAdmin: {
            headers: {
                'Content-Type': 'application/json',
                cookie: undefined,
            },
        },
    };

    let testServer;
    let fetchApi;
    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('admin1@nv.example.com');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user1@nv.example.com');
        fetchOptions.dallasAdmin.headers.cookie = await getSessionCookie('user1@dallas.gov');

        testServer = await makeTestServer();
        fetchApi = testServer.fetchApi;
    });
    after(() => {
        testServer.stop();
    });

    const sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
    });

    context('PUT api/grants/:grantId/view/:agencyId', () => {
        context('by a user with admin role', () => {
            const viewEndpoint = `335255/view`;
            it('marks the grant viewed for this user\'s own agency', async () => {
                const response = await fetchApi(`/grants/${viewEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('marks the grant viewed for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/grants/${viewEndpoint}/${agencies.ownSub}`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants/${viewEndpoint}/${agencies.offLimits}`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            const viewEndpoint = `/333333/view`;
            it('marks the grant viewed for this user\'s own agency', async () => {
                const response = await fetchApi(`/grants/${viewEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                let response = await fetchApi(`/grants/${viewEndpoint}/${agencies.ownSub}`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');

                response = await fetchApi(`/grants/${viewEndpoint}/${agencies.offLimits}`, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'put',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('GET /api/grants/:grantId/assign/agencies', () => {
        const assignedEndpoint = `335255/assign/agencies`;
        context('by a user with admin role', () => {
            const assignedBy = {
                NV1: {
                    assigned_by_name: 'nv.gov Admin User 1',
                    assigned_by_email: 'admin1@nv.example.com',
                    assigned_by_avatar_color: '#198754',
                },
                NV2: {
                    assigned_by_name: 'nv.gov User 2',
                    assigned_by_email: 'user2@nv.example.com',
                    assigned_by_avatar_color: '#FD7E14',
                },
            };
            let response;
            let json;
            before(async () => {
                response = await fetchApi(`/grants/${assignedEndpoint}`, agencies.own, fetchOptions.admin);
                json = await response.json();
            });
            it('should return OK', async () => {
                expect(response.statusText).to.equal('OK');
            });
            it('includes this user\'s own agency when it is assigned to the grant', async () => {
                expect((json.some((r) => r.agency_id === agencies.own))).to.equal(true);
            });
            it('includes a subagency of this user\'s own agency when the subagency is assigned to the grant', async () => {
                expect((json.some((r) => r.agency_id === agencies.ownSub))).to.equal(true);
            });
            it('excludes assigned agencies outside this user\'s hierarchy', async () => {
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('includes all agencies part of main_agency of this user\'s agency', async () => {
                const queryResponse = await fetchApi(`/grants/${assignedEndpoint}`, agencies.ownSub, fetchOptions.admin);
                expect(queryResponse.statusText).to.equal('OK');
                const queryJson = await queryResponse.json();
                expect(queryJson.length).to.equal(2);
                expect(queryJson.find((a) => a.agency_id === agencies.ownSub)).to.be.ok;
                expect(queryJson.find((a) => a.agency_id === agencies.own)).to.be.ok;
            });
            it('forbids requests for agencies outside this user\'s hierarchy', async () => {
                const badResponse = await fetchApi(`/grants/${assignedEndpoint}`, agencies.offLimits, fetchOptions.admin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
            it('includes assigned by information for the grant to an agency', async () => {
                expect(json.find((a) => a.assigned_by_name === assignedBy.NV1.assigned_by_name)).to.be.ok;
                expect(json.find((a) => a.assigned_by_name === assignedBy.NV2.assigned_by_name)).to.be.ok;
                expect(json.find((a) => a.assigned_by_email === assignedBy.NV1.assigned_by_email)).to.be.ok;
                expect(json.find((a) => a.assigned_by_email === assignedBy.NV2.assigned_by_email)).to.be.ok;
                expect(json.find((a) => a.assigned_by_avatar_color === assignedBy.NV1.assigned_by_avatar_color)).to.be.ok;
                expect(json.find((a) => a.assigned_by_avatar_color === assignedBy.NV2.assigned_by_avatar_color)).to.be.ok;
            });
        });
        context('by a user with staff role', () => {
            const assignedBy = {
                NV1: {
                    assigned_by_name: 'nv.gov Admin User 1',
                    assigned_by_email: 'admin1@nv.example.com',
                    assigned_by_avatar_color: '#198754',
                },
                NV2: {
                    assigned_by_name: 'nv.gov User 2',
                    assigned_by_email: 'user2@nv.example.com',
                    assigned_by_avatar_color: '#FD7E14',
                },
            };
            let response;
            let json;
            before(async () => {
                response = await fetchApi(`/grants/${assignedEndpoint}`, agencies.own, fetchOptions.staff);
                json = await response.json();
            });
            it('should return OK', async () => {
                expect(response.statusText).to.equal('OK');
            });
            it('includes this user\'s own agency when it is assigned to the grant', async () => {
                expect(json.some((r) => r.agency_id === agencies.own)).to.equal(true);
            });
            xit('includes a subagency of this user\'s own agency when the subagency is assigned to the grant', async () => {
                expect(json.find((r) => r.agency_id === agencies.ownSub)).to.not.be.undefined;
            });
            it('excludes assigned agencies outside this user\'s hierarchy', async () => {
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                const badResponse = await fetchApi(`/grants/${assignedEndpoint}`, agencies.ownSub, fetchOptions.staff);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
            it('includes assigned by information for the grant to an agency', async () => {
                expect(json.find((a) => a.assigned_by_name === assignedBy.NV1.assigned_by_name)).to.be.ok;
                expect(json.find((a) => a.assigned_by_name === assignedBy.NV2.assigned_by_name)).to.be.ok;
                expect(json.find((a) => a.assigned_by_email === assignedBy.NV1.assigned_by_email)).to.be.ok;
                expect(json.find((a) => a.assigned_by_email === assignedBy.NV2.assigned_by_email)).to.be.ok;
                expect(json.find((a) => a.assigned_by_avatar_color === assignedBy.NV1.assigned_by_avatar_color)).to.be.ok;
                expect(json.find((a) => a.assigned_by_avatar_color === assignedBy.NV2.assigned_by_avatar_color)).to.be.ok;
            });
        });
        context('by a user with admin role in another organization', () => {
            it('forbids requests for any agency outside of the main agency hierarchy', async () => {
                const badResponse = await fetchApi(`/grants/${assignedEndpoint}`, agencies.own, fetchOptions.dallasAdmin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
    });

    context('POST /api/grants/:grantId/assign/agencies', () => {
        const endpoint = '/grants/333816/assign/agencies';
        let emailSpy;

        beforeEach(() => {
            emailSpy = sandbox.spy(email, 'sendGrantAssignedEmails');
        });

        context('by a user with admin role', () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetchApi(endpoint, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.calledOnceWith({ grantId: '333816', agencyIds: [agencies.own], userId: 13 })).to.equal(true);
            });
            it('assigns subagencies of this user\'s own agency to a grant', async () => {
                const response = await fetchApi(endpoint, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.calledOnceWith({ grantId: '333816', agencyIds: [agencies.ownSub], userId: 13 })).to.equal(true);
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(endpoint, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                expect(emailSpy.called).to.equal(false);
            });
            it('only sends emails to the agency being assigned', async () => {
                // Assign another agency first, to ensure it doesn't receive emails
                await db.assignGrantsToAgencies({ grantId: '333816', agencyIds: [agencies.ownSubAlternate], userId: 13 });

                const response = await fetchApi(endpoint, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.calledOnceWith({ grantId: '333816', agencyIds: [agencies.ownSub], userId: 13 })).to.equal(true);
            });
        });

        context('by a user with staff role', () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetchApi(endpoint, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.calledOnceWith({ grantId: '333816', agencyIds: [agencies.own], userId: 6 })).to.equal(true);
            });
            it('forbids requests for subagency', async () => {
                const response = await fetchApi(endpoint, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                expect(emailSpy.called).to.equal(false);
            });
            it('forbids requests for agency outside user\'s hierarchy', async () => {
                const response = await fetchApi(endpoint, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                expect(emailSpy.called).to.equal(false);
            });
            it('only sends emails to the agency being assigned', async () => {
                // Assign another agency first, to ensure it doesn't receive emails
                await db.assignGrantsToAgencies({ grantId: '333816', agencyIds: [agencies.ownSubAlternate], userId: 6 });

                const response = await fetchApi(endpoint, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.calledOnceWith({ grantId: '333816', agencyIds: [agencies.own], userId: 6 })).to.equal(true);
            });
        });
    });

    context('DELETE /api/grants/:grantId/assign/agencies', () => {
        const unassignEndpoint = `333816/assign/agencies`;
        context('by a user with admin role', () => {
            it('unassigns this user\'s own agency from a grant', async () => {
                const response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('unassigns subagencies of this user\'s own agency from a grant', async () => {
                const response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('unassigns this user\'s own agency to a grant', async () => {
                const response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetchApi(`/grants/${unassignEndpoint}`, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('GET /api/grants/:grantId/interested', () => {
        const interestEndpoint = `335255/interested`;
        context('by a user with admin role', () => {
            let response;
            let json;
            before(async () => {
                response = await fetchApi(`/grants/${interestEndpoint}`, agencies.own, fetchOptions.admin);
                json = await response.json();
            });
            it('should return OK', async () => {
                expect(response.statusText).to.equal('OK');
            });
            it('includes this user\'s own agency when it is interested in the grant', async () => {
                expect(json.some((r) => r.agency_id === agencies.own)).to.equal(true);
            });
            it('includes a subagency of this user\'s own agency when the subagency is interested in the grant', async () => {
                expect(json.some((r) => r.agency_id === agencies.ownSub)).to.equal(true);
            });
            it('excludes interested agencies outside this user\'s hierarchy', async () => {
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('includes only the queried subagency of this user\'s own agency when the subagency is interested in the grant', async () => {
                const queryResponse = await fetchApi(`/grants/${interestEndpoint}`, agencies.ownSub, fetchOptions.admin);
                expect(queryResponse.statusText).to.equal('OK');
                const queryJson = await queryResponse.json();
                expect(queryJson.length).to.equal(2);
            });
            it('forbids requests for agencies outside this user\'s hierarchy', async () => {
                const badResponse = await fetchApi(`/grants/${interestEndpoint}`, agencies.offLimits, fetchOptions.admin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            let response;
            let json;
            before(async () => {
                response = await fetchApi(`/grants/${interestEndpoint}`, agencies.own, fetchOptions.staff);
                json = await response.json();
            });
            it('should return OK', async () => {
                expect(response.statusText).to.equal('OK');
            });
            it('includes this user\'s own agency when it is interested in the grant', async () => {
                expect(json.some((r) => r.agency_id === agencies.own)).to.equal(true);
            });
            it('excludes an agency outside of this user\'s own tenant', async () => {
                expect(json.find((r) => r.agency_id === 0)).to.be.undefined;
            });
            it('excludes interested agencies outside this user\'s hierarchy', async () => {
                expect(json.every((r) => r.agency_id !== agencies.offLimits)).to.equal(true);
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                const badResponse = await fetchApi(`/grants/${interestEndpoint}`, agencies.ownSub, fetchOptions.staff);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
    });
    context('DELETE /api/grants/:grantId/interested/:agencyId', () => {
        context('by an admin user', () => {
            const interestEndpoint = `335255/interested`;
            it('allows removing grant interest for a single agency', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/undefined`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own], interestedCode: null }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('allows removing grant interest for multiple authorized agencies', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/undefined`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own, agencies.ownSub], interestedCode: null }),
                });
                expect(response.statusText).to.equal('OK');
            });
        });
        context('by a user with a staff role', () => {
            const interestEndpoint = `335255/interested`;
            it('allows removing grant interest for a single agency', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own], interestedCode: null }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('allows removing grant interest for a multiple authorized agencies', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.own, agencies.ownSub], interestedCode: null }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids removing grant interest when one of the agencies is not in this user\'s tenant', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits, agencies.own], interestedCode: null }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('forbids removing grant interest when the agency is not in this user\'s tenant', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.offLimits}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                    body: JSON.stringify({ interestedCode: null }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/grants/:grantId/interested/:agencyId', () => {
        context('by a user with admin role', () => {
            const interestEndpoint = `0/interested`;
            it('records this user\'s own agency\'s interest in a grant', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('records this user\'s own agency\'s subagencies\' interest in a grant', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.ownSub}`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.offLimits}`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            const interestEndpoint = `333333/interested`;
            it('records this user\'s own agency\'s interest in a grant', async () => {
                const response = await fetchApi(`/grants/${interestEndpoint}/${agencies.own}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetchApi(`/grants/${interestEndpoint}/${agencies.ownSub}`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetchApi(`/grants/${interestEndpoint}/${agencies.offLimits}`, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ interestedCode: 1 }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });
    context('GET /api/grants/exportCSVNew', () => {
        it('produces correct column format', async () => {
            // We constrain the result to a single grant that's listed in seeds/dev/ref/grants.js
            const query = '?criteria[includeKeywords]=Community Health Aide Program  Tribal';
            const response = await fetchApi(`/grants/exportCSVNew${query}`, agencies.own, fetchOptions.staff);

            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');

            const expectedCsvHeaders = [
                'Opportunity Number',
                'Title',
                'Viewed By',
                process.env.ENABLE_NEW_TEAM_TERMINOLOGY === 'true' ? 'Interested Teams' : 'Interested Agencies',
                'Opportunity Status',
                'Opportunity Category',
                'Cost Sharing',
                'Award Ceiling',
                'Posted Date',
                'Close Date',
                'Agency Code',
                'Grant Id',
                'URL',
                'Funding Type',
                'Appropriations Bill',
                'Agency Code',
                'Eligibility',
                'Category of Funding Activity',
            ];

            const txt = await response.text();
            const rows = txt.split('\n');
            expect(rows[0]).to.equal(expectedCsvHeaders.join(','));

            const cells = rows[1].split(',');
            const valMap = new Map([...Array(cells.length).keys()].map((i) => [expectedCsvHeaders[i], cells[i]]));

            expect(valMap.get('Opportunity Number')).to.equal('HHS-2021-IHS-TPI-0001');
            expect(valMap.get('Title')).to.equal('Community Health Aide Program:  Tribal Planning & Implementation');
            expect(valMap.get('Funding Type')).to.equal('Other');
            expect(valMap.get('Agency Code')).to.equal('HHS-IHS');
            expect(valMap.get('Eligibility')).to.equal('"Native American tribal organizations (other than Federally recognized tribal governments)|Others(see text field entitled ""Additional Information on Eligibility"" for clarification)|Native American tribal governments(Federally recognized)"');
            expect(valMap.get('Category of Funding Activity')).to.equal('Health|Income Security and Social Services');
        });

        it('produces same number of rows as grid', async () => {
            let response = await fetchApi(`/grants/exportCSVNew`, agencies.own, fetchOptions.staff);
            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');
            const responseText = await response.text();
            const exportedRows = responseText.split(/\r?\n/);
            const rowsHash = {};
            let skipFirst = true;
            // eslint-disable-next-line no-restricted-syntax
            for (const row of exportedRows) {
                if (skipFirst) {
                    skipFirst = false;
                } else {
                    const cells = row.split(',');
                    if (cells[0]) {
                        rowsHash[cells[0]] = row;
                    }
                }
            }
            let pageNumber = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                response = await fetchApi(`/grants/next?pagination[currentPage]=${pageNumber}&pagination[perPage]=10&ordering[orderBy]=open_date&ordering[orderDesc]=true`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                // eslint-disable-next-line no-await-in-loop
                const queryJson = await response.json();
                if (queryJson.data.length === 0) {
                    break;
                }
                for (let j = 0; j < queryJson.data.length; j += 1) {
                    const opportunityNumber = queryJson.data[j].grant_number;
                    if (rowsHash[opportunityNumber]) {
                        delete rowsHash[opportunityNumber];
                    }
                }
                pageNumber += 1;
            }
            const extraRowCount = Object.keys(rowsHash).length;
            if (extraRowCount > 0) {
                console.log(JSON.stringify(rowsHash, null, 2));
                expect(extraRowCount).to.equal(0);
            }
        });

        it('limits number of output rows', async function testExport() {
            // First we insert 100 grants (in prod this limit it 10k but it is reduced in test
            // via NODE_ENV=test environment variable so this test isn't so slow)
            const numToInsert = 100;
            const grantsToInsert = Array(numToInsert).fill(undefined).map((val, i, arr) => ({
                status: 'inbox',
                grant_id: String(-(i + 1)),
                grant_number: String(-(i + 1)),
                agency_code: 'fake',
                cost_sharing: 'No',
                title: `fake grant #${i + 1}/${arr.length} for test`,
                cfda_list: 'fake',
                open_date: '2022-04-22',
                close_date: '2022-04-22',
                notes: 'auto-inserted by test',
                search_terms: '[in title/desc]+',
                reviewer_name: 'none',
                opportunity_category: 'Discretionary',
                description: 'fake grant inserted by test',
                eligibility_codes: '25',
                opportunity_status: 'posted',
            }));

            try {
                this.timeout(10000);
                await knex.batchInsert(TABLES.grants, grantsToInsert);

                const response = await fetchApi(`/grants/exportCSVNew`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');

                const csv = await response.text();
                const lines = csv.split('\n');

                // 10k rows + 1 header + 1 error message row + line break at EOF
                expect(lines.length).to.equal(numToInsert + 3);

                const lastRow = lines[lines.length - 2];
                expect(lastRow).to.include('Error:');
            } finally {
                await knex(TABLES.grants).where(knex.raw('cast(grant_id as INTEGER) < 0')).delete();
            }
        });
    });
    context('GET /api/grants/exportCSV', () => {
        it('produces correct column format', async () => {
            // We constrain the result to a single grant that's listed in seeds/dev/ref/grants.js
            const query = '?searchTerm=333816';
            const response = await fetchApi(`/grants/exportCSV${query}`, agencies.own, fetchOptions.staff);

            const expectedCsv = process.env.ENABLE_NEW_TEAM_TERMINOLOGY === 'true'
                ? `Opportunity Number,Title,Viewed By,Interested Teams,Status,Opportunity Category,Cost Sharing,Award Ceiling,Posted Date,Close Date,Agency Code,Grant Id,URL
HHS-2021-IHS-TPI-0001,Community Health Aide Program:  Tribal Planning &`
                : `Opportunity Number,Title,Viewed By,Interested Agencies,Status,Opportunity Category,Cost Sharing,Award Ceiling,Posted Date,Close Date,Agency Code,Grant Id,URL
HHS-2021-IHS-TPI-0001,Community Health Aide Program:  Tribal Planning &`;

            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');

            expect(await response.text()).to.contain(expectedCsv);
        });

        it('produces same number of rows as grid', async () => {
            let response = await fetchApi(`/grants/exportCSV`, agencies.own, fetchOptions.staff);
            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');
            const responseText = await response.text();
            const exportedRows = responseText.split(/\r?\n/);
            const rowsHash = {};
            let skipFirst = true;
            // eslint-disable-next-line no-restricted-syntax
            for (const row of exportedRows) {
                if (skipFirst) {
                    skipFirst = false;
                } else {
                    const cells = row.split(',');
                    if (cells[0]) {
                        rowsHash[cells[0]] = row;
                    }
                }
            }
            let pageNumber = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                // eslint-disable-next-line no-await-in-loop
                response = await fetchApi(`/grants?currentPage=${pageNumber}&perPage=10&orderBy=open_date&orderDesc=true`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
                // eslint-disable-next-line no-await-in-loop
                const queryJson = await response.json();
                if (queryJson.data.length === 0) {
                    break;
                }
                for (let j = 0; j < queryJson.data.length; j += 1) {
                    const opportunityNumber = queryJson.data[j].grant_number;
                    if (rowsHash[opportunityNumber]) {
                        delete rowsHash[opportunityNumber];
                    }
                }
                pageNumber += 1;
            }
            const extraRowCount = Object.keys(rowsHash).length;
            if (extraRowCount > 0) {
                console.log(JSON.stringify(rowsHash, null, 2));
                expect(extraRowCount).to.equal(0);
            }
        });

        it('limits number of output rows', async function testExport() {
            // First we insert 100 grants (in prod this limit it 10k but it is reduced in test
            // via NODE_ENV=test environment variable so this test isn't so slow)
            const numToInsert = 100;
            const grantsToInsert = Array(numToInsert).fill(undefined).map((val, i, arr) => ({
                status: 'inbox',
                grant_id: String(-(i + 1)),
                grant_number: String(-(i + 1)),
                agency_code: 'fake',
                cost_sharing: 'No',
                title: `fake grant #${i + 1}/${arr.length} for test`,
                cfda_list: 'fake',
                open_date: '2022-04-22',
                close_date: '2022-04-22',
                notes: 'auto-inserted by test',
                search_terms: '[in title/desc]+',
                reviewer_name: 'none',
                opportunity_category: 'Discretionary',
                description: 'fake grant inserted by test',
                eligibility_codes: '25',
                opportunity_status: 'posted',
            }));

            this.timeout(10000);
            await knex.batchInsert(TABLES.grants, grantsToInsert);

            const response = await fetchApi(`/grants/exportCSV`, agencies.own, fetchOptions.staff);
            expect(response.statusText).to.equal('OK');

            const csv = await response.text();
            const lines = csv.split('\n');

            // 10k rows + 1 header + 1 error message row + line break at EOF
            expect(lines.length).to.equal(numToInsert + 3);

            const lastRow = lines[lines.length - 2];
            expect(lastRow).to.include('Error:');
        });
    });
    context('GET /exportCSVRecentActivities', () => {
        let originalShareTerminologyEnabled;
        before(() => {
            originalShareTerminologyEnabled = process.env.SHARE_TERMINOLOGY_ENABLED;
        });

        after(() => {
            process.env.SHARE_TERMINOLOGY_ENABLED = originalShareTerminologyEnabled;
        });

        it('returns valid CSV response', async () => {
            const response = await fetchApi('/grants/exportCSVRecentActivities', agencies.own, fetchOptions.staff);
            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');
        });

        it('includes correct column headers with share terminology disabled', async () => {
            process.env.SHARE_TERMINOLOGY_ENABLED = 'false';
            const response = await fetchApi('/grants/exportCSVRecentActivities', agencies.own, fetchOptions.staff);
            expect(await response.text()).to.contain('Date,Team,Grant,Status Code,Grant Assigned By,Email');
        });

        it('includes correct column headers with share terminology enabled', async () => {
            process.env.SHARE_TERMINOLOGY_ENABLED = 'true';
            const response = await fetchApi('/grants/exportCSVRecentActivities', agencies.own, fetchOptions.staff);
            expect(await response.text()).to.contain('Date,Team,Grant,Status Code,Grant Shared By,Email');
        });
    });
    context('GET /api/organizations/:orgId/grants?currentPage=:pageNumber&perPage=:grantsPerPage', () => {
        context('by a user with staff role', () => {
            it('should return sorted rows', async () => {
                let response;
                let queryJson;
                let previousOpenDate = null;
                let pageNumber = 1;
                let moreRows = true;
                while (moreRows) {
                    // eslint-disable-next-line no-await-in-loop
                    response = await fetchApi(`/grants?currentPage=${pageNumber}&perPage=10&orderBy=open_date&orderDesc=true`, agencies.own, fetchOptions.staff);
                    expect(response.statusText).to.equal('OK');
                    // eslint-disable-next-line no-await-in-loop
                    queryJson = await response.json();
                    if (queryJson.data.length === 0) {
                        moreRows = false;
                    } else {
                        for (let j = 0; j < queryJson.data.length; j += 1) {
                            const currentOpenDate = new Date(`${queryJson.data[j].open_date}T00:00:00`);
                            if (previousOpenDate !== null) {
                                expect(previousOpenDate).to.be.greaterThanOrEqual(currentOpenDate);
                            }
                            previousOpenDate = currentOpenDate;
                        }
                        pageNumber += 1;
                    }
                }
            });
        });
    });
    context('GET /api/organizations/:orgId/grants/next?currentPage=:pageNumber&perPage=:grantsPerPage', () => {
        context('by a user with staff role', () => {
            it('should return sorted rows', async () => {
                let response;
                let queryJson;
                let previousOpenDate = null;
                let pageNumber = 1;
                let moreRows = true;
                while (moreRows) {
                    // eslint-disable-next-line no-await-in-loop
                    response = await fetchApi(`/grants/next?pagination[currentPage]=${pageNumber}&pagination[perPage]=10&ordering[orderBy]=open_date&ordering[orderDesc]=true`, agencies.own, fetchOptions.staff);
                    expect(response.statusText).to.equal('OK');
                    // eslint-disable-next-line no-await-in-loop
                    queryJson = await response.json();
                    if (queryJson.data.length === 0) {
                        moreRows = false;
                    } else {
                        for (let j = 0; j < queryJson.data.length; j += 1) {
                            const currentOpenDate = new Date(`${queryJson.data[j].open_date}T00:00:00`);
                            if (previousOpenDate !== null) {
                                expect(previousOpenDate).to.be.greaterThanOrEqual(currentOpenDate);
                            }
                            previousOpenDate = currentOpenDate;
                        }
                        pageNumber += 1;
                    }
                }
            });
            it('with empty includeKeywords', async () => {
                const response = await fetchApi(`/grants/next?pagination[currentPage]=1&pagination[perPage]=50&ordering[orderBy]=rank&criteria[includeKeywords]=&criteria[opportunityStatuses]=posted`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
            });
            it('with empty excludeKeywords', async () => {
                const response = await fetchApi(`/grants/next?pagination[currentPage]=1&pagination[perPage]=50&ordering[orderBy]=rank&criteria[excludeKeywords]=&criteria[opportunityStatuses]=posted`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('OK');
            });
            it('orderBy viewed_by is a 400 error', async () => {
                const response = await fetchApi(`/grants/next?pagination[currentPage]=1&pagination[perPage]=50&ordering[orderBy]=viewed_by&criteria[opportunityStatuses]=posted`, agencies.own, fetchOptions.staff);
                expect(response.status).to.equal(400);
            });
            it('orderBy interested_agencies is a 400 error', async () => {
                const response = await fetchApi(`/grants/next?pagination[currentPage]=1&pagination[perPage]=50&ordering[orderBy]=interested_agencies&criteria[opportunityStatuses]=posted`, agencies.own, fetchOptions.staff);
                expect(response.status).to.equal(400);
            });
        });
    });
});
