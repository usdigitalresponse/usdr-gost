const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');
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
        const endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT || 4566}`;
        console.log(`endpoint: ${endpoint}`);
        s3 = new S3Client({
            endpoint,
            forcePathStyle: true,
            region: 'us-west-2',
        });
    } else {
        s3 = new S3Client();
    }
    return s3;
}

/**
 *  This function is a wrapper around the getSignedUrl function from the @aws-sdk/s3-request-presigner package.
 *  Exists to organize the imports and to make it easier to mock in tests.
 */
async function getSignedUrl(s3, command, options) {
    return awsGetSignedUrl(s3, command, options);
}

/*
----------------------------------------------------------
                        AWS SES
----------------------------------------------------------
*/

function getSESClient() {
    const sesOptions = {};

    if (process.env.LOCALSTACK_HOSTNAME) {
        sesOptions.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:${process.env.EDGE_PORT || 4566}`;
        sesOptions.region = 'us-west-2';
    }

    return new SESClient(sesOptions);
}

function sendEmail(message) {
    if (process.env.SUPPRESS_EMAIL) return;

    const transport = getSESClient();
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
    const command = new SendEmailCommand(params);
    transport.send(command)
        .then((data) => console.log('Success sending SES email:', data))
        .catch((err) => console.error('Error sending SES email:', err, err.stack));
}

module.exports = {
    getS3Client,
    getSignedUrl,
    sendEmail,
};
