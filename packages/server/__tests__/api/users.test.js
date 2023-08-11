const { expect } = require('chai');
const sinon = require('sinon');
const { getSessionCookie, makeTestServer } = require('./utils');
const email = require('../../src/lib/email');
const emailConstants = require('../../src/lib/email/constants');

describe('`/api/users` endpoint', () => {
    const agencies = {
        own: 0,
        staffOwn: 400,
        ownSub: 401,
        offLimits: 384,
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

    let testServer;
    let fetchApi;
    before(async function beforeHook() {
        this.timeout(9000); // Getting session cookies can exceed default timeout.
        fetchOptions.admin.headers.cookie = await getSessionCookie('mindy@usdigitalresponse.org');
        fetchOptions.nonUSDRAdmin.headers.cookie = await getSessionCookie('joecomeau01@gmail.com');
        fetchOptions.staff.headers.cookie = await getSessionCookie('mindy+testsub@usdigitalresponse.org');

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

    context('POST /api/users (create a user for an agency)', () => {
        const user = {
            email: 'test@example.com',
            name: 'Test Name',
            role: 2,
            agency: undefined,
        };

        context('by a user with admin role', () => {
            it('creates a user in this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `1${user.email}` }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('creates a user in a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `2${user.email}` }),
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `3${user.email}` }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });

            // This really just exists to verify with new Supertest setup that we can use Chai spies
            it('sends a welcome email when creating user', async () => {
                // Note: in order for this spy to work, the callsite that uses sendWelcomeEmail must
                // import the module as an object and access the sendWelcomeEmail property when calling
                // it, i.e.
                //   const email = require('../lib/email');
                //   email.sendWelcomeEmail(...);
                // instead of the following, which won't work:
                //   const {sendWelcomeEmail} = require('../lib/email');
                //   sendWelcomeEmail(...);
                const emailSpy = sandbox.spy(email, 'sendWelcomeEmail');

                const response = await fetchApi(`/users`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'post',
                    body: JSON.stringify({ ...user, email: `4${user.email}` }),
                });
                expect(response.statusText).to.equal('OK');
                expect(emailSpy.called).to.equal(true);
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, {
                    ...fetchOptions.staff,
                    method: 'post',
                    body: JSON.stringify({ ...user }),
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('GET /api/users?agency=N (list users for a tenant)', () => {
        context('by a user with admin role', () => {
            it('lists all users in the tenant', async () => {
                const response = await fetchApi(`/users`, agencies.own, fetchOptions.admin);
                expect(response.statusText).to.equal('OK');
                const json = await response.json();
                expect(json.length).to.equal(12);
            });
            it('lists users for an agency outside this user\'s hierarchy but in the same tenant', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, fetchOptions.admin);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.own, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(`/users`, agencies.ownSub, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for an agency outside this user\'s hierarchy', async () => {
                const response = await fetchApi(`/users`, agencies.offLimits, fetchOptions.staff);
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('DELETE /api/users/:id', () => {
        context('by a user with admin role', () => {
            it('deletes a user in this user\'s tenant', async () => {
                const response = await fetchApi(`/users/4`, agencies.own, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a user in an agency outside this user\'s tenant', async () => {
                const response = await fetchApi(`/users/8`, agencies.offLimits, {
                    ...fetchOptions.admin,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
        context('by a user with staff role', () => {
            it('is forbidden for this user\'s own tenant', async () => {
                const response = await fetchApi(`/users/3`, agencies.own, {
                    ...fetchOptions.staff,
                    method: 'delete',
                });
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('PUT /users/:userId/email_subscription (modify a user\'s email subscription preferences)', () => {
        const body = JSON.stringify(
            {
                preferences: {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.subscribed,
                    [emailConstants.notificationType.grantInterest]: emailConstants.emailSubscriptionStatus.unsubscribed,
                },
            },
        );

        context('by a user with admin role', () => {
            it('updates this user\'s own agency', async () => {
                const response = await fetchApi(
                    `/users/2/email_subscription`,
                    agencies.own,
                    { ...fetchOptions.admin, method: 'put', body },
                );
                expect(response.statusText).to.equal('OK');
            });
            context('when it is a USDR super admin', () => {
                it('updates for subagency of this user\'s own agency', async () => {
                    const response = await fetchApi(
                        `/users/2/email_subscription`,
                        agencies.own,
                        { ...fetchOptions.admin, method: 'put', body },
                    );
                    expect(response.statusText).to.equal('OK');
                });
                it('updates for agencies outside this user\'s hierarchy', async () => {
                    const response = await fetchApi(
                        `/users/2/email_subscription`,
                        agencies.own,
                        { ...fetchOptions.admin, method: 'put', body },
                    );
                    expect(response.statusText).to.equal('OK');
                });
            });
            context('when it is a non-USDR admin', () => {
                it('is forbidden for a subagency of this user\'s own agency', async () => {
                    const response = await fetchApi(
                        `/users/3/email_subscription`,
                        agencies.ownSub,
                        { ...fetchOptions.nonUSDRAdmin, method: 'put', body },
                    );
                    expect(response.statusText).to.equal('Forbidden');
                });
                it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                    const response = await fetchApi(
                        `/users/3/email_subscription`,
                        agencies.offLimits,
                        { ...fetchOptions.nonUSDRAdmin, method: 'put', body },
                    );
                    expect(response.statusText).to.equal('Forbidden');
                });
            });
        });

        context('by a user with staff role', () => {
            it('updates this user\'s own agency', async () => {
                const response = await fetchApi(
                    `/users/14/email_subscription`,
                    agencies.staffOwn,
                    { ...fetchOptions.staff, method: 'put', body },
                );
                expect(response.statusText).to.equal('OK');
            });
            it('is forbidden for a subagency of this user\'s own agency', async () => {
                const response = await fetchApi(
                    `/users/14/email_subscription`,
                    agencies.ownSub,
                    { ...fetchOptions.staff, method: 'put', body },
                );
                expect(response.statusText).to.equal('Forbidden');
            });
            it('is forbidden for agencies outside this user\'s hierarchy', async () => {
                const response = await fetchApi(
                    `/users/14/email_subscription`,
                    agencies.offLimits,
                    { ...fetchOptions.staff, method: 'put', body },
                );
                expect(response.statusText).to.equal('Forbidden');
            });
        });
    });

    context('GET /users/:userId/sendDigestEmail (admin send digest email for a specific user)', () => {
        beforeEach(async () => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        context('by a user with admin role', () => {
            it('Sends an email based on this user\'s saved searches', async () => {
                const deliverEmailSpy = sinon.fake.returns('foo');
                sinon.replace(email, 'deliverEmail', deliverEmailSpy);
                const response = await fetchApi(
                    `/users/2/sendDigestEmail`,
                    agencies.own,
                    { ...fetchOptions.admin },
                );
                expect(response.statusText).to.equal('OK');
                expect(deliverEmailSpy.calledOnce).to.equal(true);
            });
        });
    });
});
