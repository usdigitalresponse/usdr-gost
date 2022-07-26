const resetDB = require('./resetdb');

async function mochaGlobalSetup() {
    const err = await resetDB({ verbose: false });
    if (err) {
        throw (err);
    }
}

async function mochaGlobalTeardown() {
    process.exit(0);
}

module.exports = {
    mochaGlobalSetup,
    mochaGlobalTeardown,
};
