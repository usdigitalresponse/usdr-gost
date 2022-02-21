const resetDB = require('../resetdb');
const { disconnectDb } = require('./utils');

async function mochaGlobalSetup() {
    await resetDB({ verbose: false });
}

async function mochaGlobalTeardown() {
    // The tests use a global pool of database connections, so we need to
    // disconnect manually after all tests are done.
    await disconnectDb();
}

module.exports = {
    mochaGlobalSetup,
    mochaGlobalTeardown,
};
