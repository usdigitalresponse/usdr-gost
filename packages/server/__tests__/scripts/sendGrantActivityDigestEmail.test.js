const { expect } = require('chai');
const sinon = require('sinon');
const email = require('../../src/lib/email');
const sendGrantActivityDigestEmail = require('../../src/scripts/sendGrantActivityDigestEmail').main;

describe('sendGrantActivityDigestEmail script', () => {
    const sandbox = sinon.createSandbox();
    let buildAndSendGrantActivityDigestEmailsFake;

    beforeEach(() => {
        process.env.ENABLE_GRANT_ACTIVITY_DIGEST_SCHEDULED_TASK = 'true';
        buildAndSendGrantActivityDigestEmailsFake = sandbox.fake();
        sandbox.replace(email, 'buildAndSendGrantActivityDigestEmails', buildAndSendGrantActivityDigestEmailsFake);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('triggers sending digest emails when flags are on', async () => {
        await sendGrantActivityDigestEmail();
        expect(buildAndSendGrantActivityDigestEmailsFake.called).to.equal(true);
    });

    it('triggers no emails when scheduled task flag is off', async () => {
        process.env.ENABLE_GRANT_ACTIVITY_DIGEST_SCHEDULED_TASK = 'false';
        await sendGrantActivityDigestEmail();
        expect(buildAndSendGrantActivityDigestEmailsFake.called).to.equal(false);
    });
});
