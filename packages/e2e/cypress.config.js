// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('cypress');

module.exports = defineConfig({
    reporter: 'junit',
    reporterOptions: {
        mochaFile: 'cypress/results/output.xml',
    },
    e2e: {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            // eslint-disable-next-line global-require, import/extensions
            return require('./cypress/plugins/index.js')(on, config);
        },
    },
});
