const { resetDB, execShellCommand } = require('./resetdb');

async function mochaGlobalSetup() {
    const err = await resetDB({ verbose: false });
    if (err) {
        throw (err);
    }
}

async function mochaGlobalTeardown() {
    // kill running server process
    execShellCommand(`pkill -fn 'node src'`, { env: process.env });
    process.exit(0);
}

module.exports = {
    mochaGlobalSetup,
    mochaGlobalTeardown,
};
