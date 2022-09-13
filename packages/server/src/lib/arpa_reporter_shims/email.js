// This file exists as a shim to replace ARPA Reporter's lib/email.js
// Eventually, the functions in this file should have callsites updated to use GOST's existing methods
// and this file can be deleted.

const { sendWelcomeEmail } = require('../email');

module.exports = { sendWelcomeEmail };
