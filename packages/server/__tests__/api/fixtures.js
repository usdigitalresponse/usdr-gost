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
    // process.exit(0);
    // forces tests to pass even if there are failures best to use https://gist.github.com/boneskull/7fe75b63d613fa940db7ec990a5f5843
}

module.exports = {
    mochaGlobalSetup,
    mochaGlobalTeardown,
};
