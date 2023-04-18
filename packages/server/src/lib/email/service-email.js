/*
--------------------------------------------------------------------------------
-                                 service-email.js
--------------------------------------------------------------------------------

*/
const awsTransport = require('../gost-aws');
const nodemailerTransport = require('./email-nodemailer');

function getTransport() {
    switch (true) {
        case !!process.env.NODEMAILER_HOST:
            return nodemailerTransport;

        default:
            return awsTransport;
    }
}

module.exports = { getTransport };

/*                                  *  *  *                                   */
