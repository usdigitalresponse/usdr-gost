/*
--------------------------------------------------------------------------------
-                                 lib/email-aws.js
--------------------------------------------------------------------------------

*/

const AWS = require('aws-sdk');

function createTransport() {
    const requiredEnvironmentVariables = [
        'NOTIFICATIONS_EMAIL',
    ];
    for (let i = 0; i < requiredEnvironmentVariables.length; i += 1) {
        const ev = process.env[requiredEnvironmentVariables[i]];
        if (!ev) {
            return {
                sendEmail: () => {
                    throw new Error(
                        `Missing environment variable ${requiredEnvironmentVariables[i]}!`,
                    );
                },
            };
        }
    }

    let sesOptions = {};
    if (process.env.SES_REGION) {
        sesOptions.region = process.env.SES_REGION;
    }

    return new AWS.SES(sesOptions);
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
