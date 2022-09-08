const { URL } = require('url');
const getTransport = require('./email/service-email');

const expiryMinutes = 30;

function sendPassCode(email, passcode, httpOrigin, redirectTo) {
    const url = new URL(`${httpOrigin}/api/sessions`);
    url.searchParams.set('passcode', passcode);
    if (redirectTo) {
        url.searchParams.set('redirect_to', redirectTo);
    }
    const href = url.toString();

    return getTransport().send({
        toAddress: email,
        subject: 'USDR Grants Tool Access Link',
        body: `<p>Your link to access USDR's Grants Tool is <a href=${href}>${href}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
    });
}

function sendWelcomeEmail(email, httpOrigin) {
    return getTransport().send({
        toAddress: email,
        subject: 'Welcome to USDR Grants Tool',
        body: `<p>Visit USDR's Grants Tool at:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
    });
}

module.exports = { sendPassCode, sendWelcomeEmail };
