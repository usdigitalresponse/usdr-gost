const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../src/lib/email');
const sendGrantDigestEmail = require('../../src/scripts/sendGrantDigestEmail').main;

describe('sendGrantDigestEmail script', () => {
    const sandbox = sinon.createSandbox();
    let buildAndSendGrantDigestEmailsFake;

    beforeEach(() => {
        process.env.ENABLE_GRANT_DIGEST_SCHEDULED_TASK = 'true';
        process.env.ENABLE_SAVED_SEARCH_GRANTS_DIGEST = 'true';
        buildAndSendGrantDigestEmailsFake = sandbox.fake();
        sandbox.replace(email, 'buildAndSendGrantDigestEmails', buildAndSendGrantDigestEmailsFake);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('triggers sending digest emails when flags are on', async () => {
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestEmailsFake.called).to.equal(true);
    });

    it('triggers no emails when scheduled task flag is off', async () => {
        process.env.ENABLE_GRANT_DIGEST_SCHEDULED_TASK = 'false';
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestEmailsFake.called).to.equal(false);
    });

    it('skips buildAndSendUserSavedSearchGrantDigest when that email flag is off', async () => {
        process.env.ENABLE_SAVED_SEARCH_GRANTS_DIGEST = 'false';
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestEmailsFake.called).to.equal(false);
    });
});
