const { expect } = require('chai');

const { getSessionCookie, makeTestServer, knex } = require('./utils');
const { TABLES } = require('../../src/db/constants');

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
        fetchOptions.admin.headers.cookie = await getSessionCookie('admin1@nv.gov');
        fetchOptions.staff.headers.cookie = await getSessionCookie('user1@nv.gov');
        fetchOptions.dallasAdmin.headers.cookie = await getSessionCookie('user1@dallas.gov');

        testServer = await makeTestServer();
        fetchApi = testServer.fetchApi;
    });
    after(() => {
        testServer.stop();
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
        });
        context('by a user with staff role', () => {
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
        });
        context('by a user with admin role in another organization', () => {
            it('forbids requests for any agency outside of the main agency hierarchy', async () => {
                const badResponse = await fetchApi(`/grants/${assignedEndpoint}`, agencies.own, fetchOptions.dallasAdmin);
                expect(badResponse.statusText).to.equal('Forbidden');
            });
        });
    });
    context('PUT /api/grants/:grantId/assign/agencies', () => {
        const assignEndpoint = `333816/assign/agencies`;
        context('by a user with admin role', () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetchApi(`/grants/${assignEndpoint}`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('assigns subagencies of this user\'s own agency to a grant', async () => {
                const response = await fetchApi(`/grants/${assignEndpoint}`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/grants/${assignEndpoint}`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('assigns this user\'s own agency to a grant', async () => {
                const response = await fetchApi(`/grants/${assignEndpoint}`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.own] }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('forbids requests for any agency except this user\'s own agency', async () => {
                let response = await fetchApi(`/grants/${assignEndpoint}`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.ownSub] }),
                });
                expect(response.statusText).to.equal('Forbidden');
                response = await fetchApi(`/grants/${assignEndpoint}`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'put',
                    body: JSON.stringify({ agencyIds: [agencies.offLimits] }),
                });
                expect(response.statusText).to.equal('Forbidden');
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
    context('GET /api/grants/exportCSV', () => {
        it('produces correct column format', async () => {
            // We constrain the result to a single grant that's listed in seeds/dev/ref/grants.js
            const query = '?searchTerm=333816';
            const response = await fetchApi(`/grants/exportCSV${query}`, agencies.own, fetchOptions.staff);

            const expectedCsv = `Opportunity Number,Title,Viewed By,Interested Agencies,Status,Opportunity Category,Cost Sharing,Award Floor,Award Ceiling,Posted Date,Close Date,Agency Code,Grant Id,URL
HHS-2021-IHS-TPI-0001,Community Health Aide Program:  Tribal Planning &amp;`;

            expect(response.statusText).to.equal('OK');
            expect(response.headers.get('Content-Type')).to.include('text/csv');
            expect(response.headers.get('Content-Disposition')).to.include('attachment');

            expect(await response.text()).to.contain(expectedCsv);
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
                raw_body: 'raw body',
            }));

            this.timeout(2000);
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
                    response = await fetchApi(`/grants?currentPage=${pageNumber}&perPage=10&orderBy=open_date&ascending=false`, agencies.own, fetchOptions.staff);
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
});
