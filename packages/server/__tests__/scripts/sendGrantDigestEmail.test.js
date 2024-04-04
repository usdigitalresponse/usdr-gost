const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../src/lib/email');
const sendGrantDigestEmail = require('../../src/scripts/sendGrantDigestEmail').main;

describe('sendGrantDigestEmail script', () => {
    const sandbox = sinon.createSandbox();
    let buildAndSendGrantDigestFake;
    let buildAndSendUserSavedSearchGrantDigestFake;

    beforeEach(() => {
        process.env.ENABLE_GRANT_DIGEST_SCHEDULED_TASK = 'true';
        process.env.ENABLE_GRANTS_DIGEST = 'true';
        process.env.ENABLE_SAVED_SEARCH_GRANTS_DIGEST = 'true';
        buildAndSendGrantDigestFake = sandbox.fake();
        sandbox.replace(email, 'buildAndSendGrantDigest', buildAndSendGrantDigestFake);
        buildAndSendUserSavedSearchGrantDigestFake = sandbox.fake();
        sandbox.replace(email, 'buildAndSendUserSavedSearchGrantDigest', buildAndSendUserSavedSearchGrantDigestFake);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('triggers sending digest emails when flags are on', async () => {
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestFake.called).to.equal(true);
        expect(buildAndSendUserSavedSearchGrantDigestFake.called).to.equal(true);
    });

    it('triggers no emails when scheduled task flag is off', async () => {
        process.env.ENABLE_GRANT_DIGEST_SCHEDULED_TASK = 'false';
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestFake.called).to.equal(false);
        expect(buildAndSendUserSavedSearchGrantDigestFake.called).to.equal(false);
    });

    it('skips buildAndSendGrantDigest when that email flag is off', async () => {
        process.env.ENABLE_GRANTS_DIGEST = 'false';
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestFake.called).to.equal(false);
        expect(buildAndSendUserSavedSearchGrantDigestFake.called).to.equal(true);
    });

    it('skips buildAndSendUserSavedSearchGrantDigest when that email flag is off', async () => {
        process.env.ENABLE_SAVED_SEARCH_GRANTS_DIGEST = 'false';
        await sendGrantDigestEmail();
        expect(buildAndSendGrantDigestFake.called).to.equal(true);
        expect(buildAndSendUserSavedSearchGrantDigestFake.called).to.equal(false);
    });
});
