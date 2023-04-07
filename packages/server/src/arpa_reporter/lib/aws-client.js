const AWS = require('aws-sdk');

function getS3Client() {
    /*
        TODO: Move this client generation to a separate module that handles creating all AWS clients.
        Captured in ticket here: https://github.com/usdigitalresponse/usdr-gost/issues/1161
    */

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
            region: process.env.AWS_DEFAULT_REGION || 'us-west-2',
            endpoint,
            s3ForcePathStyle: true,
        });
    } else {
        s3 = new AWS.S3();
    }
    return s3;
}

module.exports = {
    getS3Client,
};
