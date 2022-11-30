/*
--------------------------------------------------------------------------------
-                                 service-email.js
--------------------------------------------------------------------------------

*/
const awsTransport = require('./email-aws');
const nodemailerTransport = require('./email-nodemailer');

function getTransport() {
    switch (true) {
        case !!process.env.NODEMAILER_HOST:
            return nodemailerTransport;

        default:
            return awsTransport;
    }
}

module.exports = getTransport;

/*                                  *  *  *                                   */
