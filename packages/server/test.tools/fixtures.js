const resetDB = require('./resetdb');

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

exports.mochaGlobalSetup = async function mochaGlobalSetup() {
    const err = await resetDB({ verbose: false });
    if (err) {
        throw (err);
    }

    // eslint-disable-next-line global-require
    this.server = await require('../src/index');
};

exports.mochaGlobalTeardown = async function mochaGlobalTeardown() {
    this.server.close((err) => {
        if (err) {
            throw (err);
        }
        // Not sure why this is needed
        wait(1000).then(() => process.exit(0));
    });
};
