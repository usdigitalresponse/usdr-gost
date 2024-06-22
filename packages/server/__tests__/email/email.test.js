/**  global context */

const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');
const _ = require('lodash');
require('dotenv').config();
const emailService = require('../../src/lib/email/service-email');
const email = require('../../src/lib/email');
const fixtures = require('../db/seeds/fixtures');
const db = require('../../src/db');
const awsTransport = require('../../src/lib/gost-aws');

const {
    TEST_EMAIL_RECIPIENT,

    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_DEFAULT_REGION,
    AWS_REGION,
    NOTIFICATIONS_EMAIL,
    SES_CONFIGURATION_SET_DEFAULT,

    NODEMAILER_HOST,
    NODEMAILER_PORT,
    NODEMAILER_EMAIL,
    NODEMAILER_EMAIL_PW,
} = process.env;

const testEmail = {
    toAddress: TEST_EMAIL_RECIPIENT || 'nobody@example.com',
    subject: 'Test email',
    body: 'This is a test email.',
    tags: ['key=value'],
};

describe('Email module', () => {
    function restoreEnvironmentVariables() {
        process.env.TEST_EMAIL_RECIPIENT = TEST_EMAIL_RECIPIENT;
        process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
        process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
        process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        process.env.AWS_REGION = AWS_REGION;
        process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;
        process.env.SES_CONFIGURATION_SET_DEFAULT = SES_CONFIGURATION_SET_DEFAULT;
        process.env.NODEMAILER_HOST = NODEMAILER_HOST;
        process.env.NODEMAILER_PORT = NODEMAILER_PORT;
        process.env.NODEMAILER_EMAIL = NODEMAILER_EMAIL;
        process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;
        process.env.SHARE_TERMINOLOGY_ENABLED = false;
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
        delete process.env.SES_CONFIGURATION_SET_DEFAULT;
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
            process.env.SES_CONFIGURATION_SET_DEFAULT = 'default-configuration-set';
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

        it('sends configuration set name if SES_CONFIGURATION_SET_DEFAULT is set', async () => {
            const sendSpy = sandbox.spy();
            sandbox.stub(awsTransport, 'getSESClient').returns({ send: sendSpy });
            await awsTransport.sendEmail(testEmail);
            expect(sendSpy.called).is.true;
            expect(sendSpy.args[0][0].input.ConfigurationSetName).to.equal('default-configuration-set');
        });
        it('does not require a configuration set name', async () => {
            delete process.env.SES_CONFIGURATION_SET_DEFAULT;
            const sendSpy = sandbox.spy();
            sandbox.stub(awsTransport, 'getSESClient').returns({ send: sendSpy });
            await awsTransport.sendEmail(testEmail);
            expect(sendSpy.called).is.true;
            expect(sendSpy.args[0][0].input).to.not.have.property('ConfigurationSetName');
        });

        it('correctly formats from email without name', async () => {
            const sendSpy = sandbox.spy();
            sandbox.stub(awsTransport, 'getSESClient').returns({ send: sendSpy });
            await awsTransport.sendEmail(testEmail);
            const source = sendSpy.args[0][0].input.Source;
            expect(source).to.equal('fake@example.org');
        });

        it('correctly formats from email with name', async () => {
            const sendSpy = sandbox.spy();
            sandbox.stub(awsTransport, 'getSESClient').returns({ send: sendSpy });
            const fromNameEmail = { ...testEmail, fromName: 'From Name' };
            await awsTransport.sendEmail(fromNameEmail);
            const source = sendSpy.args[0][0].input.Source;
            expect(source).to.equal('"From Name" <fake@example.org>');
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

    context('send passcode email', () => {
        it('calls the transport function with appropriate parameters', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendPassCodeEmail('staff.user@test.com', '83c7c74a-6b38-4392-84fa-d1f3993f448d', 'https://api.grants.usdigitalresponse.org');

            expect(sendFake.calledOnce).to.equal(true);
            expect(_.omit(sendFake.firstCall.args[0], ['body'])).to.deep.equal({
                fromName: 'USDR Grants',
                ccAddress: undefined,
                toAddress: 'staff.user@test.com',
                subject: 'USDR Grants Tool Access Link',
                text: 'Your link to access USDR\'s Grants tool is https://api.grants.usdigitalresponse.org/api/sessions?passcode=83c7c74a-6b38-4392-84fa-d1f3993f448d. It expires in 30 minutes',
                tags: ['notification_type=passcode', 'user_role=staff', 'organization_id=0', 'team_id=0'],
            });
            expect(sendFake.firstCall.args[0].body).contains('<title>Login Passcode</title>');
        });
    });
    context('send welcome email', () => {
        it('calls the transport function with appropriate parameters', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendWelcomeEmail('sub.staff.user@test.com', 'https://staging.grants.usdr.dev');

            expect(sendFake.calledOnce).to.equal(true);
            expect(_.omit(sendFake.firstCall.args[0], ['body'])).to.deep.equal({
                fromName: 'USDR Grants',
                ccAddress: undefined,
                toAddress: 'sub.staff.user@test.com',
                subject: 'Welcome to USDR Grants Tool',
                text: 'Visit USDR\'s Grants Tool at: https://staging.grants.usdr.dev.',
                tags: ['notification_type=welcome', 'user_role=staff', 'organization_id=0', 'team_id=1'],
            });
        });
    });
    context('send grant assigned email', () => {
        it('calls the transport function with appropriate parameters', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendGrantAssignedEmails({ grantId: '335255', agencyIds: [0, 1], userId: 1 });

            // There are 3 total users in agencies 0 and 1 and none are explicitly unsubscribed for grant assignment
            // notifications which means they are all implicitly subscribed.
            expect(sendFake.callCount).to.equal(3);
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'staff.user@test.com',
                    subject: 'Grant Assigned to State Board of Accountancy',
                    tags: ['notification_type=grant_assignment', 'user_role=staff', 'organization_id=0', 'team_id=0'],
                },
            )).to.be.true;
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'sub.staff.user@test.com',
                    subject: 'Grant Assigned to State Board of Sub Accountancy',
                    tags: ['notification_type=grant_assignment', 'user_role=staff', 'organization_id=0', 'team_id=1'],
                },
            )).to.be.true;
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'admin.user@test.com',
                    subject: 'Grant Assigned to State Board of Accountancy',
                    tags: ['notification_type=grant_assignment', 'user_role=admin', 'organization_id=0', 'team_id=0'],
                },
            )).to.be.true;
        });
        it('is resilient to missing grant description', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));
            const grant = fixtures.grants.noDescOrEligibilityCodes;

            await email.sendGrantAssignedEmails({ grantId: grant.grant_id, agencyIds: [0], userId: 1 });

            expect(sendFake.called).to.equal(true);
            expect(sendFake.firstCall.args[0].body.includes('... View on')).to.equal(true);
        });
    });

    context('send grant shared email', () => {
        it('calls the transport function with appropriate parameters', async () => {
            process.env.SHARE_TERMINOLOGY_ENABLED = true;
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendGrantAssignedEmails({ grantId: '335255', agencyIds: [0, 1], userId: 1 });

            // There are 3 total users in agencies 0 and 1 and none are explicitly unsubscribed for grant assignment
            // notifications which means they are all implicitly subscribed.
            expect(sendFake.callCount).to.equal(3);
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'staff.user@test.com',
                    subject: 'Admin User Shared a Grant with Your Team',
                    tags: ['notification_type=grant_assignment', 'user_role=staff', 'organization_id=0', 'team_id=0'],
                },
            )).to.be.true;
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'sub.staff.user@test.com',
                    subject: 'Admin User Shared a Grant with Your Team',
                    tags: ['notification_type=grant_assignment', 'user_role=staff', 'organization_id=0', 'team_id=1'],
                },
            )).to.be.true;
            expect(sendFake.calledWithMatch(
                {
                    fromName: 'USDR Federal Grant Finder',
                    toAddress: 'admin.user@test.com',
                    subject: 'Admin User Shared a Grant with Your Team',
                    tags: ['notification_type=grant_assignment', 'user_role=admin', 'organization_id=0', 'team_id=0'],
                },
            )).to.be.true;
        });
        it('is resilient to missing grant description', async () => {
            process.env.SHARE_TERMINOLOGY_ENABLED = true;
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));
            const grant = fixtures.grants.noDescOrEligibilityCodes;

            await email.sendGrantAssignedEmails({ grantId: grant.grant_id, agencyIds: [0], userId: 1 });

            expect(sendFake.called).to.equal(true);
            expect(sendFake.firstCall.args[0].body.includes('... View on')).to.equal(true);
        });
    });

    context('send async report email', () => {
        it('sendAsyncReportEmail delivers an email with the signedURL for audit report', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendAsyncReportEmail('usdr.volunteer@test.com', 'https://example.usdigitalresponse.org', email.ASYNC_REPORT_TYPES.audit);
            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.firstArg.subject).to.equal('Your audit report is ready for download');
            expect(sendFake.firstCall.firstArg.text).to.equal('Your audit report is ready for download. Paste this link into your browser to download it: https://example.usdigitalresponse.org This link will remain active for 7 days.');
            expect(sendFake.firstCall.firstArg.toAddress).to.equal('usdr.volunteer@test.com');
            expect(sendFake.firstCall.firstArg.fromName).to.equal('USDR ARPA Reporter');
            expect(sendFake.firstCall.firstArg.body).contains('https://example.usdigitalresponse.org');
            expect(sendFake.firstCall.firstArg.tags).to.deep.equal([
                'notification_type=audit_report',
                'user_role=usdr_staff',
                'organization_id=1',
                'team_id=2',
            ]);
        });
        it('sendAsyncReportEmail delivers an email with the signedURL for treasury report', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.sendAsyncReportEmail('admin.user@test.com', 'https://example.usdigitalresponse.org', email.ASYNC_REPORT_TYPES.treasury);
            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.firstArg.subject).to.equal('Your treasury report is ready for download');
            expect(sendFake.firstCall.firstArg.text).to.equal('Your treasury report is ready for download. Paste this link into your browser to download it: https://example.usdigitalresponse.org This link will remain active for 7 days.');
            expect(sendFake.firstCall.firstArg.toAddress).to.equal('admin.user@test.com');
            expect(sendFake.firstCall.firstArg.fromName).to.equal('USDR ARPA Reporter');
            expect(sendFake.firstCall.firstArg.body).contains('https://example.usdigitalresponse.org');
            expect(sendFake.firstCall.firstArg.tags).to.deep.equal([
                'notification_type=treasury_report',
                'user_role=admin',
                'organization_id=0',
                'team_id=0',
            ]);
        });
    });
    context('send report error email', () => {
        it('sendReportErrorEmail delivers an email with the error message', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            const user = {
                email: 'foo@example.com',
                tenant: {
                    display_name: 'Test Tenant',
                },
            };
            const body = 'There was an error generating your requested audit report. Someone from USDR will reach out within 24 hours to debug the problem. We apologize for any inconvenience.';

            await email.sendReportErrorEmail(user, email.ASYNC_REPORT_TYPES.audit);
            expect(sendFake.calledOnce).to.equal(true);
            expect(sendFake.firstCall.firstArg.subject).to.equal(`Audit report generation has failed for Test Tenant`);
            expect(sendFake.firstCall.firstArg.text).to.equal(body);
            expect(sendFake.firstCall.firstArg.toAddress).to.equal(user.email);
            expect(sendFake.firstCall.firstArg.fromName).to.equal('USDR ARPA Reporter');
            expect(sendFake.firstCall.firstArg.ccAddress).to.equal('grants-helpdesk@usdigitalresponse.org');
            expect(sendFake.firstCall.firstArg.body).contains(body);
            // Not an actual user so no user tags
            expect(sendFake.firstCall.firstArg.tags).to.deep.equal([
                'notification_type=audit_report_error',
            ]);
        });
    });
    context('send grant digest email', () => {
        beforeEach(async () => {
            // Set to given date in local time zone
            this.clockFn = (date) => sinon.useFakeTimers(moment(date).toDate());
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('sendGrantDigest sends no email when there are no grants to send', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            const agencies = await db.getAgency(0);
            const agency = agencies[0];
            agency.matched_grants = [];
            agency.recipient = 'foo@example.com';

            await email.sendGrantDigestEmail({
                name: agency.name,
                recipient: agency.recipient,
                matchedGrants: agency.matched_grants,
                openDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
            });

            expect(sendFake.called).to.equal(false);
        });
    });
    context('build grant digest body', () => {
        it('builds all the grants if fewer than 3 available', async () => {
            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];
            agency.matched_grants = [fixtures.grants.healthAide];
            const body = await email.buildDigestBody({
                name: 'Saved search test',
                openDate: '2021-08-05',
                matchedGrants: agency.matched_grants,
            });
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
        it('links to Grants.gov when Grant Details page is not live', async () => {
            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];
            agency.matched_grants = [fixtures.grants.healthAide];
            const body = await email.buildDigestBody({
                name: 'Saved search test',
                openDate: '2021-08-05',
                matchedGrants: agency.matched_grants,
            });
            expect(body).to.include(`https://www.grants.gov/search-results-detail/${fixtures.grants.healthAide.grant_id}`);
        });
        it('links to Grant Finder when Grant Details page is live', async () => {
            process.env.NEW_GRANT_DETAILS_PAGE_ENABLED = 'true';
            const agencies = await db.getAgency(fixtures.agencies.accountancy.id);
            const agency = agencies[0];
            agency.matched_grants = [fixtures.grants.healthAide];
            const body = await email.buildDigestBody({
                name: 'Saved search test',
                openDate: '2021-08-05',
                matchedGrants: agency.matched_grants,
            });
            expect(body).to.include(`${process.env.WEBSITE_DOMAIN}/grants/${fixtures.grants.healthAide.grant_id}`);
        });
    });
    context('buildAndSendGrantDigestEmails', () => {
        beforeEach(async () => {
            // Set to given date in local time zone
            this.clockFn = (date) => sinon.useFakeTimers(moment(date).toDate());
            this.clock = this.clockFn('2021-08-06');
        });
        afterEach(async () => {
            this.clock.restore();
        });
        it('Sends an email for a user\'s saved search', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            // Build digest for adminUser who has 1 saved search
            await email.buildAndSendGrantDigestEmails(1, '2021-08-05');
            expect(sendFake.calledOnce).to.equal(true);
            expect(_.omit(sendFake.firstCall.args[0], ['body', 'text'])).to.deep.equal({
                fromName: 'USDR Federal Grant Finder',
                ccAddress: undefined,
                toAddress: 'admin.user@test.com',
                subject: 'New Grants Published for Simple 2 result search based on included keywords',
                tags: ['notification_type=grant_digest', 'user_role=admin', 'organization_id=0', 'team_id=0'],
            });
        });
        it('Sends an email for all users\' saved searches', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ sendEmail: sendFake }));

            await email.buildAndSendGrantDigestEmails();
            expect(sendFake.calledOnce).to.equal(true);
        });
    });
});
