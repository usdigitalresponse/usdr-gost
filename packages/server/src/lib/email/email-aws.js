/*
--------------------------------------------------------------------------------
-                                 lib/email-aws.js
--------------------------------------------------------------------------------

*/

const AWS = require('aws-sdk');

function createTransport() {
    const environmentVariable = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'SES_REGION',
        'NOTIFICATIONS_EMAIL',
    ];
    for (let i = 0; i < environmentVariable.length; i += 1) {
        const ev = process.env[environmentVariable[i]];
        if (!ev) {
            return {
                sendEmail: () => {
                    throw new Error(
                        `Missing environment variable ${environmentVariable[i]}!`,
                    );
                },
            };
        }
    }
    return new AWS.SES({ region: process.env.SES_REGION });
}

function send(message) {
    if (process.env.SUPPRESS_EMAIL) return;

    const transport = createTransport();
    const params = {
        Destination: {
            ToAddresses: [message.toAddress],
        },
        Source: process.env.NOTIFICATIONS_EMAIL,
        Message: {
            Subject: {
                Charset: 'UTF-8',
                Data: message.subject,
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: message.body,
                },
            },
        },
    };
    transport.sendEmail(params).promise();
}

module.exports = { send };

/*                                  *  *  *                                   */
