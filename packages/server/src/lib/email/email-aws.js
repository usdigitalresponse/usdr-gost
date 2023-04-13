/*
--------------------------------------------------------------------------------
-                                 lib/email-aws.js
--------------------------------------------------------------------------------

*/

const {SESClient, SendEmailCommand} = require('@aws-sdk/client-ses');

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

    const sesOptions = {};

    if (process.env.AWS_ENDPOINT_URL) {
        sesOptions.endpoint = process.env.AWS_ENDPOINT_URL;
    }

    if (process.env.SES_REGION) {
        sesOptions.region = process.env.SES_REGION;
    }

    return new SESClient(sesOptions);
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
                Text: {
                    Charset: 'UTF-8',
                    Data: message.text,
                },
            },
        },
    };
    const command = new SendEmailCommand(params)
    transport.send(command).then((data) => console.log('Success sending SES email:', data))
        .catch((err) => console.error('Error sending SES email:', err, err.stack));
}

module.exports = { send };

/*                                  *  *  *                                   */
