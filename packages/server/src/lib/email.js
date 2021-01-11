const AWS = require('aws-sdk');

const ses = new AWS.SES({ region: process.env.SES_REGION });
const fromEmail = process.env.NOTIFICATIONS_EMAIL;
const expiryMinutes = 30;

function sendPasscode(email, passcode, httpOrigin) {
    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Source: fromEmail,
        Message: {
            Subject: {
                Charset: 'UTF-8',
                Data: 'Nevada Grant Notification and Coordination Tool Access Link',
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<p>Your link to access the Nevada Grant Notification and Coordination Tool is
     <a href="${httpOrigin}/api/sessions?passcode=${passcode}">${httpOrigin}/api/sessions/?passcode=${passcode}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
                },
            },
        },
    };
    return ses.sendEmail(params).promise();
}

function sendWelcomeEmail(email, httpOrigin) {
    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Source: fromEmail,
        Message: {
            Subject: {
                Charset: 'UTF-8',
                Data: 'Welcome to CARES grants',
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<p>You have been granted access to the CARES Grants:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
                },
            },
        },
    };
    return ses.sendEmail(params).promise();
}

module.exports = { sendPasscode, sendWelcomeEmail };
