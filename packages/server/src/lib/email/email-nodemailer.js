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
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_EMAIL_PW,
        },
    });
}

async function send(message) {
    if (process.env.SUPPRESS_EMAIL) return;

    const transport = createTransport();
    const params = {
        from: process.env.NODEMAILER_EMAIL, // sender address
        to: message.toAddress, // list of receivers e.g. 'a@aa.com, b@bb.com'
        subject: message.subject,
        // text: 'Hello world?', // plain text body
        html: message.body, // html body
    };
    transport.sendMail(params);
}

module.exports = { send };

/*                                  *  *  *                                   */
