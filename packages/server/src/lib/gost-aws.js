const AWS = require('aws-sdk');

/*
----------------------------------------------------------
                        AWS S3
----------------------------------------------------------
*/

function getS3Client() {
    let s3;
    if (process.env.LOCALSTACK_HOSTNAME) {
        /*
            1. Make sure the local environment has awslocal installed.
            2. Use the commands to create a bucket to test with.
                - awslocal s3api create-bucket --bucket arpa-audit-reports --region us-west-2 --create-bucket-configuration '{"LocationConstraint": "us-west-2"}'
            3. Access bucket resource metadata through the following URL.
                - awslocal s3api list-buckets
                - awslocal s3api list-objects --bucket arpa-audit-reports
        */
        console.log('------------ USING LOCALSTACK ------------');
        const endpoint = new AWS.Endpoint(`http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT || 4566}`);
        s3 = new AWS.S3({
            endpoint,
            s3ForcePathStyle: true,
        });
    } else {
        s3 = new AWS.S3();
    }
    return s3;
}

/*
----------------------------------------------------------
                        AWS SES
----------------------------------------------------------
*/

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
                Text: {
                    Charset: 'UTF-8',
                    Data: message.text,
                },
            },
        },
    };
    transport.sendEmail(params).promise()
        .then((data) => console.log('Success sending SES email:', data))
        .catch((err) => console.error('Error sending SES email:', err, err.stack));
}

module.exports = {
    getS3Client,
    send,
};
