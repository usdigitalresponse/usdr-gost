const tracer = require('dd-trace').init(); // eslint-disable-line no-unused-vars
const express = require('express');
const { CronJob } = require('cron');
const fs = require('fs').promises;
const path = require('path');

const { configureApp } = require('./configure');
const emailService = require('./lib/email');
const { hasOutstandingMigrations } = require('./db/helpers');

const { PORT = 3000 } = process.env;
const app = express();
configureApp(app);
const server = app.listen(PORT, () => console.log(`App running on port ${PORT}!`));

if (process.env.ENABLE_SAVED_SEARCH_GRANTS_DIGEST === 'true' && process.env.ENABLE_GRANT_DIGEST_SCHEDULED_TASK !== 'true') {
    const generateSavedSearchGrantDigestCron = new CronJob(
        // once per day at 13:00 UTC
        // one hour after the old grant digest
        '0 0 13 * * *', emailService.buildAndSendGrantDigestEmails,
    );
    generateSavedSearchGrantDigestCron.start();
}

const cleanGeneratedPdfCron = new CronJob(
    // once per day at 01:00
    '0 1 * * *',
    async () => {
        const generatedPath = path.resolve(__dirname, './static/forms/generated');
        try {
            await fs.rm(generatedPath, { recursive: true });
        } catch (err) {
            if (err.message.match(/ENOENT/)) {
                console.log('tried cleaning generated pdf folder, but it doesn\'t exist');
                return;
            }
            throw err;
        }
        console.log('directory removed!');
    },
);
cleanGeneratedPdfCron.start();

hasOutstandingMigrations().then((hasMigrations) => {
    if (!hasMigrations) {
        return;
    }
    console.error('There are outstanding db migrations. Run \'docker compose exec app yarn db:migrate\' before trying again');
    if (process.env.NODE_ENV === 'development') {
        process.exit(1);
    }
});

module.exports = server;
