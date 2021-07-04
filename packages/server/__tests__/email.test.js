/* global context */

require('dotenv').config();
const { expect } = require('chai');

const getTransport = require('../src/lib/email/service-email');

const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    SES_REGION,
    NOTIFICATIONS_EMAIL,

    NODEMAILER_HOST,
    NODEMAILER_PORT,
    NODEMAILER_EMAIL,
    NODEMAILER_EMAIL_PW,

    TEST_EMAIL_RECIPIENT,
} = process.env;

delete process.env.AWS_ACCESS_KEY_ID;
delete process.env.AWS_SECRET_ACCESS_KEY;
delete process.env.SES_REGION;
delete process.env.NOTIFICATIONS_EMAIL;

delete process.env.NODEMAILER_HOST;
delete process.env.NODEMAILER_PORT;
delete process.env.NODEMAILER_EMAIL;
delete process.env.NODEMAILER_EMAIL_PW;

describe('Email module', () => {
    context('AWS SES', () => {
        it('Throws with no transport', async () => {
            const expects = 'No email transport provider credentials in environment';
            let err = { message: 'No error' };
            try {
                getTransport();
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Works when AWS credentials are present', async () => {
            process.env.AWS_ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
            process.env.AWS_SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
            process.env.SES_REGION = SES_REGION;
            process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;

            const expects = 'No error';
            let err = { message: expects };
            try {
                getTransport();
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when SES_REGION is missing', async () => {
            delete process.env.SES_REGION;
            const expects = 'Missing environment variable SES_REGION!';
            let err = { message: 'No error' };
            const ses = getTransport();

            try {
                await ses.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
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
            const ses = getTransport();

            try {
                await ses.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
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
            const ses = getTransport();

            try {
                await ses.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
            } catch (e) {
                err = e;
            }
            process.env.NOTIFICATIONS_EMAIL = NOTIFICATIONS_EMAIL;
            expect(err.message).to.equal(expects);
        });
        it('Sends an email by AWS SES', async () => {
            const expects = 'No error';
            let err = { message: expects };
            const ses = getTransport();
            let result;
            const toAddress = process.env.TEST_EMAIL_RECIPIENT;
            try {
                result = await ses.send({
                    toAddress,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
            expect(typeof result.MessageId).to.equal('string');
        });
    });
    context('Nodemailer', () => {
        it('Works when Nodemailer credentials are present', async () => {
            delete process.env.AWS_ACCESS_KEY_ID;
            delete process.env.AWS_SECRET_ACCESS_KEY;
            delete process.env.SES_REGION;
            delete process.env.NOTIFICATIONS_EMAIL;
            process.env.NODEMAILER_HOST = NODEMAILER_HOST;
            process.env.NODEMAILER_PORT = NODEMAILER_PORT;
            process.env.NODEMAILER_EMAIL = NODEMAILER_EMAIL;
            process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;

            const expects = 'No error';
            let err = { message: expects };
            try {
                getTransport();
            } catch (e) {
                err = e;
            }
            expect(err.message).to.equal(expects);
        });
        it('Fails when NODEMAILER_PORT is missing', async () => {
            delete process.env.NODEMAILER_PORT;
            const expects = 'Missing environment variable NODEMAILER_PORT!';
            let err = { message: 'No error' };
            const nodemailer = getTransport();

            try {
                await nodemailer.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
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
            const nodemailer = getTransport();

            try {
                await nodemailer.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
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
            const nodemailer = getTransport();

            try {
                await nodemailer.send({
                    toAddress: process.env.TEST_EMAIL_RECIPIENT,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
            } catch (e) {
                err = e;
            }
            process.env.NODEMAILER_EMAIL_PW = NODEMAILER_EMAIL_PW;
            expect(err.message).to.equal(expects);
        });
        it('Sends an email by Nodemailer', async () => {
            const expects = 'No error';
            let err = { message: expects };
            const nodemailer = getTransport();
            let result;
            const toAddress = process.env.TEST_EMAIL_RECIPIENT;
            try {
                result = await nodemailer.send({
                    toAddress,
                    subject: 'Test aws email',
                    body: 'Hello.',
                });
            } catch (e) {
                err = e;
            }

            expect(err.message).to.equal(expects);
            expect(result.accepted[0]).to.equal(toAddress);
        });
    });
});
