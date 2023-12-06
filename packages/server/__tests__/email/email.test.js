/**  global context */

const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');
require('dotenv').config();
const emailService = require('../../src/lib/email/service-email');
const email = require('../../src/lib/email');
const fixtures = require('../db/seeds/fixtures');
const db = require('../../src/db');
const awsTransport = require('../../src/lib/gost-aws');
const emailConstants = require('../../src/lib/email/constants');
const knex = require('../../src/db/connection');

const {
    TEST_EMAIL_RECIPIENT,

    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION,
    AWS_REGION,
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
        process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        process.env.AWS_REGION = AWS_REGION;
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
        delete process.env.AWS_REGION;
        delete process.env.AWS_DEFAULT_REGION;
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
            process.env.AWS_ACCESS_KEY_ID = 'testing';
            process.env.AWS_SECRET_ACCESS_KEY = 'testing';
            process.env.AWS_DEFAULT_REGION = 'us-west-2';
            process.env.AWS_REGION = 'us-west-2';
            process.env.NOTIFICATIONS_EMAIL = 'fake@example.org';
        });

        it('Fails when NOTIFICATIONS_EMAIL is missing', async () => {
            delete process.env.NOTIFICATIONS_EMAIL;
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().sendEmail(testEmail);
            } catch (e) {
                err = e;
            }
            // expect(err.message).to.equal('No error');
            expect(err.message).to.be.a('string').and.satisfy(
                (msg) => msg.startsWith('NOTIFICATIONS_EMAIL is not set'),
            );
        });
    });
    context('Nodemailer', () => {
        beforeEach(() => {
            clearSESEnvironmentVariables();
            testEmail.subject = 'Test Nodemailer email';
        });
        it('Fails when NODEMAILER_PORT is missing', async () => {
            delete process.env.NODEMAILER_PORT;
            if (!process.env.NODEMAILER_HOST) {
                process.env.NODEMAILER_HOST = 'example.org';
            }
            const expects = 'Missing environment variable NODEMAILER_PORT!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().sendEmail(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL is missing', async () => {
            delete process.env.NODEMAILER_EMAIL;
            if (!process.env.NODEMAILER_HOST) {
                process.env.NODEMAILER_HOST = 'example.org';
            }
            const expects = 'Missing environment variable NODEMAILER_EMAIL!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().sendEmail(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL_PW is missing', async () => {
            delete process.env.NODEMAILER_EMAIL_PW;
            if (!process.env.NODEMAILER_HOST) {
                process.env.NODEMAILER_HOST = 'example.org';
            }
            const expects = 'Missing environment variable NODEMAILER_EMAIL_PW!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().sendEmail(testEmail);
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
                result = await emailService.getTransport().sendEmail(testEmail);
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
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

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

            expect(sendFake.firstCall.args.length).to.equal(3);
            expect(sendFake.firstCall.args[0].toAddress).to.equal(fixtures.users.adminUser.email);
            expect(sendFake.firstCall.args[0].emailHTML.includes('<table')).to.equal(true);
            expect(sendFake.firstCall.args[0].subject).to.equal('Grant Assigned to State Board of Accountancy');

            expect(sendFake.secondCall.args.length).to.equal(3);
            expect(sendFake.secondCall.args[0].toAddress).to.equal(fixtures.users.staffUser.email);
            expect(sendFake.secondCall.args[0].emailHTML.includes('<table')).to.equal(true);
            expect(sendFake.secondCall.args[0].subject).to.equal('Grant Assigned to State Board of Accountancy');
        });
    });
    context('async report email', () => {
        it('sendAsyncReportEmail delivers an email with the signedURL for audit report', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            await email.sendAsyncReportEmail('foo@example.com', 'https://example.usdigitalresponse.org', email.ASYNC_REPORT_TYPES.audit);
            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.firstArg.subject).to.equal('Your audit report is ready for download');
            expect(sendFake.firstCall.firstArg.emailPlain).to.equal('Your audit report is ready for download. Paste this link into your browser to download it: https://example.usdigitalresponse.org This link will remain active for 7 days.');
            expect(sendFake.firstCall.firstArg.toAddress).to.equal('foo@example.com');
            expect(sendFake.firstCall.firstArg.emailHTML).contains('https://example.usdigitalresponse.org');
        });
        it('sendAsyncReportEmail delivers an email with the signedURL for treasury report', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            await email.sendAsyncReportEmail('foo@example.com', 'https://example.usdigitalresponse.org', email.ASYNC_REPORT_TYPES.treasury);
            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.firstArg.subject).to.equal('Your treasury report is ready for download');
            expect(sendFake.firstCall.firstArg.emailPlain).to.equal('Your treasury report is ready for download. Paste this link into your browser to download it: https://example.usdigitalresponse.org This link will remain active for 7 days.');
            expect(sendFake.firstCall.firstArg.toAddress).to.equal('foo@example.com');
            expect(sendFake.firstCall.firstArg.emailHTML).contains('https://example.usdigitalresponse.org');
        });
    });
    context('saved search grant digest email', () => {
        beforeEach(async () => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('buildAndSendGrantDigest sends grants for all subscribed agencies', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantDigest', sendFake);

            /* ensure that admin user is subscribed to all notifications */
            await db.setUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.users.adminUser.agency_id);

            await email.buildAndSendGrantDigest();

            /* only fixtures.agency.accountancy has eligibility-codes, keywords, and users that match an existing grant */
            expect(sendFake.calledOnce).to.equal(true);
            await knex('email_subscriptions').del();
        });
    });
    context('grant digest email', () => {
        beforeEach(async () => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('buildAndSendGrantDigest sends grants for all subscribed agencies', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'sendGrantDigest', sendFake);

            /* ensure that admin user is subscribed to all notifications */
            await db.setUserEmailSubscriptionPreference(fixtures.users.adminUser.id, fixtures.users.adminUser.agency_id);

            await email.buildAndSendGrantDigest();

            /* only fixtures.agency.accountancy has eligibility-codes, keywords, and users that match an existing grant */
            expect(sendFake.calledOnce).to.equal(true);
            await knex('email_subscriptions').del();
        });
        it('sendGrantDigest sends no email when there are no grants to send', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            const agencies = await db.getAgency(0);
            const agency = agencies[0];
            agency.matched_grants = [];
            agency.recipients = ['foo@example.com'];

            await email.sendGrantDigest({
                name: agency.name,
                recipients: agency.recipients,
                matchedGrants: agency.matched_grants,
                openDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
            });

            expect(sendFake.called).to.equal(false);
        });
        it('sendGrantDigest sends email to all users when there are grants', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];

            agency.matched_grants = [fixtures.grants.healthAide];
            agency.recipients = [fixtures.users.adminUser.email, fixtures.users.staffUser.email];
            await email.sendGrantDigest({
                name: agency.name,
                recipients: agency.recipients,
                matchedGrants: agency.matched_grants,
                penDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
            });

            expect(sendFake.calledTwice).to.equal(true);
        });
        it('builds all the grants if fewer than 3 available', async () => {
            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];
            agency.matched_grants = [fixtures.grants.healthAide];
            const body = await email.buildDigestBody({ name: 'Saved search test', openDate: '2021-08-05', matchedGrants: agency.matched_grants });
            expect(body).to.include(fixtures.grants.healthAide.description);
        });
        it('builds only first 3 grants if >3 available', async () => {
            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];
            const ignoredGrant = { ...fixtures.grants.healthAide };
            const name = 'Saved search test';
            const openDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
            ignoredGrant.description = 'Added a brand new description';

            const updateFn = (int) => {
                const newGrant = { ...fixtures.grants.healthAide };
                newGrant.description = `description-${int}`;
                return newGrant;
            };
            const additionalGrants = [...Array(30).keys()].map(updateFn);
            agency.matched_grants = [...additionalGrants, ...[fixtures.grants.healthAide, fixtures.grants.earFellowship, fixtures.grants.redefiningPossible]];
            const body = await email.buildDigestBody({ name, openDate, matchedGrants: agency.matched_grants });

            /* the last 3 grants should not be included in the email */
            expect(body).to.not.include(fixtures.grants.healthAide.description);
            expect(body).to.not.include(fixtures.grants.earFellowship.description);
            expect(body).to.not.include(fixtures.grants.redefiningPossible.description);

            /* the first 30 grants should be included in the email */
            additionalGrants.forEach((grant) => expect(body).to.include(grant.description));
            expect(body).to.include(name);
            expect(body).to.include(moment(openDate).format('MMMM Do YYYY'));
        });
    });
    context('getAndSendGrantForSavedSearch', () => {
        it('Sends an email for a saved search', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            const userSavedSearch = {
                name: 'TestSavedSearch',
                tenantId: 0,
                email: 'foo@bar.com',
                criteria: '{"includeKeywords":"interestedGrant"}',
            };
            await email.getAndSendGrantForSavedSearch({ userSavedSearch, openDate: '2021-08-05' });

            expect(sendFake.calledOnce).to.equal(true);
        });
    });
    context('buildAndSendUserSavedSearchGrantDigest', () => {
        beforeEach(async () => {
            this.clockFn = (date) => sinon.useFakeTimers(new Date(date));
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('Sends an email for a saved search', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            await email.buildAndSendUserSavedSearchGrantDigest(1, '2021-08-05');
            expect(sendFake.calledOnce).to.equal(true);
        });
        it('Sends an email for a saved search', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(email, 'deliverEmail', sendFake);

            await email.buildAndSendUserSavedSearchGrantDigest();
            expect(sendFake.calledOnce).to.equal(true);
        });
    });
});
