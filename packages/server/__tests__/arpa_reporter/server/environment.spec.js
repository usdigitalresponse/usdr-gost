const assert = require('assert');
const path = require('path');
const fs = require('fs/promises');

const env = require('../../../src/arpa_reporter/environment');

function exists(fpath) {
    return fs.access(fpath).then(
        () => true,
        () => false,
    );
}

describe('environment settings', () => {
    it('SERVER_CODE_DIR point to the right place', async () => {
        const testPaths = [
            'environment.js',
            'lib/ensure-async-context.js',
        ];

        testPaths.forEach(async (relative) => {
            const absolute = path.join(env.SERVER_CODE_DIR, relative);
            const pathExists = await exists(absolute);
            assert.ok(pathExists, `expected ${absolute} to exist, is SERVER_CODE_DIR wrong?`);
        });
    });

    it('SERVER_DATA_DIR point to the right place', async () => {
        const testPaths = [
            'treasury',
            env.EMPTY_TEMPLATE_NAME,
        ];

        testPaths.forEach(async (relative) => {
            const absolute = path.join(env.SERVER_DATA_DIR, relative);
            const pathExists = await exists(absolute);
            assert.ok(pathExists, `expected ${absolute} to exist, is SERVER_DATA_DIR wrong?`);
        });
    });
});

// NOTE: This file was copied from tests/server/environment.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
