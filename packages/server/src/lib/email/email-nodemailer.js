/*
--------------------------------------------------------------------------------
-                                 lib/email-nodemailer.js
--------------------------------------------------------------------------------

*/

const nodemailer = require('nodemailer');

/* createTransport() create reusable transporter object using the default
  SMTP transport
  */
function createTransport() {
    const environmentVariable = [
        'NODEMAILER_HOST', // e.g. smtp.gmail.com
        'NODEMAILER_PORT', // e.g. 465
        'NODEMAILER_EMAIL', // e.g. caresreportertest@gmail.com
        'NODEMAILER_EMAIL_PW',
    ];
    for (let i = 0; i < environmentVariable.length; i += 1) {
        const ev = process.env[environmentVariable[i]];
        if (!ev) {
            return {
                sendMail: () => {
                    throw new Error(
                        `Missing environment variable ${environmentVariable[i]}!`,
                    );
                },
            };
        }
    }

    return nodemailer.createTransport({
        host: process.env.NODEMAILER_HOST, // e.g. 'smtp.ethereal.email'
        port: process.env.NODEMAILER_PORT, // e.g. 465
        secure: process.env.NODEMAILER_SECURE !== 'false', // In dev, it can be useful to turn this off, e.g. to work with ethereal.email
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_EMAIL_PW,
        },
    });
}

async function sendEmail(message) {
    if (process.env.SUPPRESS_EMAIL) return;

    const transport = createTransport();
    const params = {
        from: {
            name: message.fromName, // If not provided, undefined value is ignored just fine by nodemailer
            address: process.env.NODEMAILER_EMAIL,
        },
        to: message.toAddress, // list of receivers e.g. 'a@aa.com, b@bb.com'
        subject: message.subject,
        // text: 'Hello world?', // plain text body
        html: message.body, // html body
        headers: {
            'X-SES-MESSAGE-TAGS': message.tags.join(', '),
        },
    };
    if (message.ccAddress) {
        params.cc = message.ccAddress;
    }
    await transport.sendMail(params);
}

module.exports = { sendEmail };

/*                                  *  *  *                                   */
