#!/usr/bin/env node
const tracer = require('dd-trace').init();
const { log } = require('../lib/logging');
const email = require('../lib/email');

/**
 * This script sends all enabled grant activity digest emails. It is triggered by a
 * scheduled ECS task configured in terraform to run on a daily basis.
 *
 * This setup is intended to be a temporary fix until we've set up more
 * robust email infrastructure. See here for context:
 * https://github.com/usdigitalresponse/usdr-gost/issues/2133
 */
exports.main = async function main() {
    if (process.env.ENABLE_GRANT_ACTIVITY_DIGEST_SCHEDULED_TASK !== 'true') {
        return;
    }

    await tracer.trace('sendGrantActivityDigestEmail', async () => {
        log.info('Sending grant activity digest emails');
        await email.buildAndSendGrantActivityDigestEmails();
    });
};

if (require.main === module) {
    exports.main().then(() => process.exit());
}
