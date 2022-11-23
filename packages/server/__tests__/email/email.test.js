/**  global context */

const { expect } = require('chai');
require('dotenv').config();
const sinon = require('sinon');
const emailService = require('../../src/lib/email/service-email');
const email = require('../../src/lib/email');

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

    afterEach(() => {
        restoreEnvironmentVariables();
        testEmail.subject = 'Test email';
    });

    context('Transport missing', () => {
        it('Fails with no transport', async () => {
            clearSESEnvironmentVariables();
            clearNodemailerEnvironmentVariables();

            const expects = 'No email transport provider credentials in environment';
            let err = { message: 'No error' };
            try {
                emailService.getTransport();
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
    });
    context('AWS SES', () => {
        beforeEach(() => {
            clearNodemailerEnvironmentVariables();
            testEmail.subject = 'Test AWS-SES email';

            // these might be missing in dev .env file
            process.env.AWS_ACCESS_KEY_ID = 'Fake AWS Key';
            process.env.AWS_SECRET_ACCESS_KEY = 'Fake AWS Secret';
        });
        it('Fails when SES_REGION is missing', async () => {
            delete process.env.SES_REGION;
            const expects = 'Missing environment variable SES_REGION!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when AWS_SECRET_ACCESS_KEY is missing', async () => {
            delete process.env.AWS_SECRET_ACCESS_KEY;
            const expects = 'Missing environment variable AWS_SECRET_ACCESS_KEY!';
            let err = { message: 'No error' };

            try {
                await emailService.getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
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

    beforeEach(() => {
        sandbox.spy(emailService);
    });

    afterEach(() => {
        sandbox.restore();
    });

    context('grant assigned email', () => {
        it('deliverGrantAssigntmentToAssignee calls the transport function with appropriate parameters', async () => {
            const sendFake = sinon.fake.returns('foo');
            sinon.replace(emailService, 'getTransport', sinon.fake.returns({ send: sendFake }));

            email.Private().deliverGrantAssigntmentToAssignee(
                'foo@bar.com',
                '<p>foo</p>',
                'foo',
                'test foo email',
            );

            expect(sendFake.calledOnce).to.equal(true);
            console.log(sendFake.firstCall);
        });
    });
});
