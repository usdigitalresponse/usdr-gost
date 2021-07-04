const serviceEmail = require('./email/service-email');

const expiryMinutes = 30;

const stateName = process.env.STATE_NAME || '';

function sendPasscode(email, passcode, httpOrigin) {
    return serviceEmail.send({
        toAddress: email,
        subject: 'Welcome to CARES grants',
        body: `<p>Your link to access the ${stateName} Grant Notification and Coordination Tool is
     <a href="${httpOrigin}/api/sessions?passcode=${passcode}">${httpOrigin}/api/sessions/?passcode=${passcode}</a>.
     It expires in ${expiryMinutes} minutes</p>`,
    });
}

function sendWelcomeEmail(email, httpOrigin) {
    return serviceEmail.send({
        toAddress: email,
        subject: `${stateName} Grant Notification and Coordination Tool Access Link`,
        body: `<p>You have been granted access to the CARES Grants:
     <a href="${httpOrigin}">${httpOrigin}</a>.`,
    });
}

module.exports = { sendPasscode, sendWelcomeEmail };
