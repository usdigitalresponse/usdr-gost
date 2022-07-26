/**  global context */

const { expect } = require('chai');

require('dotenv').config();
const getTransport = require('../../src/lib/email/service-email');

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
    toAddress: TEST_EMAIL_RECIPIENT || 'test@gmail.com',
    subject: 'Test email',
    body: 'This is a test email.',
};

describe('Email module', () => {
    context('Transport missing', () => {
        it('Fails with no transport', async () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.AWS_SECRET_ACCESS_KEY;
            delete process.env.SES_REGION;
            delete process.env.NOTIFICATIONS_EMAIL;

            delete process.env.NODEMAILER_HOST;
            delete process.env.NODEMAILER_PORT;
            delete process.env.NODEMAILER_EMAIL;
            delete process.env.NODEMAILER_EMAIL_PW;

            const expects = 'No email transport provider credentials in environment';
            let err = { message: 'No error' };
            try {
                getTransport();
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
    });
    context('AWS SES', () => {
        it('Populate environment for AWS-SES', async () => {
            testEmail.subject = 'Test AWS-SES email';
            process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
            process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
            process.env.SES_REGION = SES_REGION;
            process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;
        });
        it('Fails when SES_REGION is missing', async () => {
            delete process.env.SES_REGION;
            const expects = 'Missing environment variable SES_REGION!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.SES_REGION = SES_REGION;
            expect(err.message).to.equal(expects);
        });
        it('Fails when AWS_SECRET_ACCESS_KEY is missing', async () => {
            delete process.env.AWS_SECRET_ACCESS_KEY;
            const expects = 'Missing environment variable AWS_SECRET_ACCESS_KEY!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
            expect(err.message).to.equal(expects);
        });
        it('Fails when NOTIFICATIONS_EMAIL is missing', async () => {
            delete process.env.NOTIFICATIONS_EMAIL;
            const expects = 'Missing environment variable NOTIFICATIONS_EMAIL!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;
            expect(err.message).to.equal(expects);
        });
        xit('Works when AWS credentials are valid but expect email to be unverified', async () => {
            const expects = 'Email address is not verified.';
            let err;
            let result;
            try {
                result = await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            expect(err.message).to.contain(expects);
            expect(typeof result.MessageId).to.equal('string');
        });
    });
    context('Nodemailer', () => {
        it('Populate environment for  Nodemailer', async () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.AWS_SECRET_ACCESS_KEY;
            delete process.env.SES_REGION;
            delete process.env.NOTIFICATIONS_EMAIL;

            testEmail.subject = 'Test Nodemailer email';
            process.env.NODEMAILER_HOST = NODEMAILER_HOST;
            process.env.NODEMAILER_PORT = NODEMAILER_PORT;
            process.env.NODEMAILER_EMAIL = NODEMAILER_EMAIL;
            process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;
        });
        it('Fails when NODEMAILER_PORT is missing', async () => {
            delete process.env.NODEMAILER_PORT;
            const expects = 'Missing environment variable NODEMAILER_PORT!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.NODEMAILER_PORT = NODEMAILER_PORT;
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL is missing', async () => {
            delete process.env.NODEMAILER_EMAIL;
            const expects = 'Missing environment variable NODEMAILER_EMAIL!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.NODEMAILER_EMAIL = NODEMAILER_EMAIL;
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_EMAIL_PW is missing', async () => {
            delete process.env.NODEMAILER_EMAIL_PW;
            const expects = 'Missing environment variable NODEMAILER_EMAIL_PW!';
            let err = { message: 'No error' };

            try {
                await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }
            process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;
            expect(err.message).to.equal(expects);
        });
        xit('Works when Nodemailer credentials are valid', async () => {
            const expects = 'No error';
            let err = { message: expects };

            let result;
            try {
                result = await getTransport().send(testEmail);
            } catch (e) {
                err = e;
            }

            expect(err.message).to.equal(expects);
            expect(result.accepted[0]).to.equal(testEmail.toAddress);
        });
    });
});
