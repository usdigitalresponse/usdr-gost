/**  global context */

const { expect } = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');
require('dotenv').config();
const emailService = require('../../src/lib/email/service-email');
const email = require('../../src/lib/email');
const fixtures = require('../db/seeds/fixtures');
const knex = require('../../src/db/connection');
const db = require('../../src/db');
const awsTransport = require('../../src/lib/email/email-aws');
const emailConstants = require('../../src/lib/email/constants');

const {
    TEST_EMAIL_RECIPIENT,

    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    SES_REGION,
    NOTIFICATIONS_EMAIL,

    NODEMAILER_HOST,
    NODEMAILER_PORT,
    NODEMAILER_EMAIL,
    NODEMAILER_EMAIL_PW,
} = process.env;

const testEmail = {
    toAddress: TEST_EMAIL_RECIPIENT || 'nobody@example.com',
    subject: 'Test email',
    body: 'This is a test email.',
};

describe('Email module', () => {
    function restoreEnvironmentVariables() {
        process.env.TEST_EMAIL_RECIPIENT = TEST_EMAIL_RECIPIENT;
        process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
        process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
        process.env.SES_REGION = SES_REGION;
        process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;
        process.env.NODEMAILER_HOST = NODEMAILER_HOST;
        process.env.NODEMAILER_PORT = NODEMAILER_PORT;
        process.env.NODEMAILER_EMAIL = NODEMAILER_EMAIL;
        process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;
    }

    function clearNodemailerEnvironmentVariables() {
        delete process.env.NODEMAILER_HOST;
        delete process.env.NODEMAILER_PORT;
        delete process.env.NODEMAILER_EMAIL;
        delete process.env.NODEMAILER_EMAIL_PW;
    }

    function clearSESEnvironmentVariables() {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.SES_REGION;
        delete process.env.NOTIFICATIONS_EMAIL;
    }

    const sandbox = sinon.createSandbox();
    afterEach(() => {
        restoreEnvironmentVariables();
        testEmail.subject = 'Test email';
        sandbox.restore();
    });

    context('Transport missing', () => {
        it('Defaults to AWS transport when nodemailer is not configured', async () => {
            clearSESEnvironmentVariables();
            clearNodemailerEnvironmentVariables();

            const transport = emailService.getTransport();
            expect(transport).to.equal(awsTransport);
        });
    });
    context('AWS SES', () => {
        beforeEach(() => {
            clearNodemailerEnvironmentVariables();
        });

        context('SES_REGION', () => {
            const awsTransportPatched = rewire('../../src/lib/email/email-aws');
            let sendEmailPromiseSpy;
            let MockSDK;
            beforeEach(() => {
                sendEmailPromiseSpy = sandbox.spy();
                MockSDK = {
                    SES: sandbox.stub().returns({
                        sendEmail: () => ({ promise: sendEmailPromiseSpy }),
                    }),
                };
            });
            afterEach(() => {
                sandbox.restore();
            });

            it('Sets transport region when SES_REGION is set', async () => {
                awsTransportPatched.__with__({ AWS: MockSDK })(() => {
                    process.env.SES_REGION = 'eu-central-1';
                    awsTransportPatched.send(sandbox.spy());
                });

                expect(MockSDK.SES.callCount).to.equal(1);
                expect(MockSDK.SES.calledWithExactly({ region: 'eu-central-1' })).to.equal(true);
                expect(sendEmailPromiseSpy.callCount).to.equal(1);
            });
            it('Does not configure an explicit region when SES_REGION is not set', async () => {
                awsTransportPatched.__with__({ AWS: MockSDK })(() => {
                    delete process.env.SES_REGION;
                    awsTransportPatched.send(sandbox.spy());
                });

                expect(MockSDK.SES.callCount).to.equal(1);
                expect(MockSDK.SES.calledWithExactly({})).to.equal(true);
                expect(sendEmailPromiseSpy.callCount).to.equal(1);
            });
        });

        it('Fails when NOTIFICATIONS_EMAIL is missing', async () => {
            delete process.env.NOTIFICATIONS_EMAIL;
            const expects = 'Missing environment variable NOTIFICATIONS_EMAIL!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        xit('Works when AWS credentials are valid but expect email to be unverified', async () => {
            const expects = 'Email address is not verified.';
            let err;
            let result;
            try {
                result = await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.contain(expects);
            expect(typeof result.MessageId).to.equal('string');
        });
    });
    context('Nodemailer', () => {
        beforeEach(() => {
            clearSESEnvironmentVariables();
            testEmail.subject = 'Test Nodemailer email';
        });
        it('Fails when NODEMAILER_PORT is missing', async () => {
            delete process.env.NODEMAILER_PORT;
            const expects = 'Missing environment variable NODEMAILER_PORT!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL is missing', async () => {
            delete process.env.NODEMAILER_EMAIL;
            const expects = 'Missing environment variable NODEMAILER_EMAIL!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL_PW is missing', async () => {
            delete process.env.NODEMAILER_EMAIL_PW;
            const expects = 'Missing environment variable NODEMAILER_EMAIL_PW!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        xit('Works when Nodemailer credentials are valid', async () => {
            const expects = 'No error';
            let err = { message: expects };

            let result;
            try {
                result = await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }

            expect(err.message).to.equal(expects);
            expect(result.accepted[0]).to.equal(testEmail.toAddress);
        });
    });
});

describe('Email sender', () => {
    const sandbox = sinon.createSandbox();
    before(async () => {
        await fixtures.seed(db.knex);
    });
    after(async () => {
        await db.knex.destroy();
    });

    beforeEach(() => {
        sandbox.spy(emailService);
    });

    afterEach(() => {
        sinon.restore();
        sandbox.restore();
    });

    context('grant assigned email', () => {
        it('deliverEmail calls the transport function with appropriate parameters', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ send: sendFake }));

            email.deliverEmail({
                toAddress: 'foo@bar.com',
                emailHTML: '<p>foo</p>',
                emailPlain: 'foo',
                subject: 'test foo email',
            });

            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.args).to.deep.equal([{
                toAddress: 'foo@bar.com',
                subject: 'test foo email',
                body: '<p>foo</p>',
                text: 'foo',
            }]);
        });
        it('sendGrantAssignedEmail ensures email is sent for all agencies', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantAssignedNotficationForAgency', sendFake);

            await email.sendGrantAssignedEmail({ grantId: '335255', agencyIds: [0, 1], userId: 1 });

            expect(sendFake.calledTwice).to.equal(true);

            expect(sendFake.firstCall.firstArg.name).to.equal('State Board of Accountancy');
            expect(sendFake.firstCall.args[1].includes('<table')).to.equal(true);
            expect(sendFake.firstCall.lastArg).to.equal(1);

            expect(sendFake.secondCall.firstArg.name).to.equal('State Board of Sub Accountancy');
            expect(sendFake.secondCall.args[1].includes('<table')).to.equal(true);
            expect(sendFake.secondCall.lastArg).to.equal(1);
        });
        it('sendGrantAssignedNotficationForAgency delivers email for all users within agency', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                },
            );
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.staffUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantAssignment]: emailConstants.emailSubscriptionStatus.subscribed,
                },
            );

            await email.sendGrantAssignedNotficationForAgency(fixtures.agencies.accountancy, '<p>sample html</p>', fixtures.users.adminUser.id);

            expect(sendFake.calledTwice).to.equal(true);

            expect(sendFake.firstCall.args.length).to.equal(1);
            expect(sendFake.firstCall.args[0].toAddress).to.equal(fixtures.users.adminUser.email);
            expect(sendFake.firstCall.args[0].emailHTML.includes('<table')).to.equal(true);
            expect(sendFake.firstCall.args[0].subject).to.equal('Grant Assigned to State Board of Accountancy');

            expect(sendFake.secondCall.args.length).to.equal(1);
            expect(sendFake.secondCall.args[0].toAddress).to.equal(fixtures.users.staffUser.email);
            expect(sendFake.secondCall.args[0].emailHTML.includes('<table')).to.equal(true);
            expect(sendFake.secondCall.args[0].subject).to.equal('Grant Assigned to State Board of Accountancy');
        });
    });
    context('grant digest email', () => {
        before(async () => {
            await fixtures.seed(db.knex);
        });
        after(async () => {
            await db.knex.destroy();
        });
        beforeEach(async () => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2022-06-22');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('buildAndSendGrantDigest sends grants for all subscribed agencies', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantDigestForAgency', sendFake);

            await email.buildAndSendGrantDigest();
            console.log(sendFake.getCalls());

            expect(sendFake.calledTwice).to.equal(true);
        });
        it('sendGrantDigestForAgency sends no email when there are no grants to send', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            const agencies = await db.getAgency(0);
            const agency = agencies[0];
            agency.matched_grants = [];
            agency.recipients = ['foo@example.com'];

            await email.sendGrantDigestForAgency(agencies[0]);

            expect(sendFake.called).to.equal(false);
        });
        it('sendGrantDigestForAgency sends email to all users when there are grants', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);
            const newGrant = fixtures.grants.healthAide;
            newGrant.grant_id = '444816';
            newGrant.open_date = '2022-06-21';
            await knex('grants').insert(Object.values([newGrant]));
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.adminUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.subscribed,
                },
            );
            await db.setUserEmailSubscriptionPreference(
                fixtures.users.staffUser.id,
                fixtures.agencies.accountancy.id,
                {
                    [emailConstants.notificationType.grantDigest]: emailConstants.emailSubscriptionStatus.subscribed,
                },
            );

            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];

            await email.sendGrantDigestForAgency(agency);

            expect(sendFake.calledTwice).to.equal(true);
        });
    });
});
