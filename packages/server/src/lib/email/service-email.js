/*
--------------------------------------------------------------------------------
-                                 service-email.js
--------------------------------------------------------------------------------

*/
const awsTransport = require('./email-aws');
const nodemailerTransport = require('./email-nodemailer');

function getTransport() {
    switch (true) {
        case !!process.env.AWS_ACCESS_KEY_ID:
            return awsTransport;

        case !!process.env.NODEMAILER_HOST:
            return nodemailerTransport;

        default:
            throw new Error('No email transport provider credentials in environment');
    }
}

module.exports = { getTransport };

/*                                  *  *  *                                   */
