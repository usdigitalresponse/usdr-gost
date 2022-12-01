/**  global context */

const { expect } = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');
require('dotenv').config();
const getTransport = require('../../src/lib/email/service-email');
const awsTransport = require('../../src/lib/email/email-aws');

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

            const transport = getTransport();
            expect(transport).to.equal(awsTransport);
        });
    });
    context('AWS SES', () => {
        beforeEach(clearNodemailerEnvironmentVariables);

        it('Sets transport region when SES_REGION is set', async () => {
            const awsTransportPatched = rewire('../../src/lib/email/email-aws');
            const sendEmailPromiseSpy = sandbox.spy();
            const MockSDK = {
                SES: sandbox.stub().returns({
                    sendEmail: () => ({ promise: sendEmailPromiseSpy }),
                }),
            };

            awsTransportPatched.__with__({ AWS: MockSDK })(() => {
                process.env.SES_REGION = 'eu-central-1';
                awsTransportPatched.send(sandbox.spy());
            });

            expect(MockSDK.SES.callCount).to.equal(1);
            expect(MockSDK.SES.calledWithExactly({ region: 'eu-central-1' })).to.equal(true);
            expect(sendEmailPromiseSpy.callCount).to.equal(1);
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
        beforeEach(() => {
            clearSESEnvironmentVariables();
            testEmail.subject = 'Test Nodemailer email';
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
