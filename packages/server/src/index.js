const express = require('express');
const { CronJob } = require('cron');
const fs = require('fs').promises;
const path = require('path');

const { configureApp } = require('./configure');
const grantscraper = require('./lib/grantscraper');
const emailService = require('./lib/email');
const { hasOutstandingMigrations } = require('./db/helpers');

const { PORT = 3000 } = process.env;
const app = express();
configureApp(app);
const server = app.listen(PORT, () => console.log(`App running on port ${PORT}!`));

if (process.env.ENABLE_GRANTS_SCRAPER === 'true') {
    const job = new CronJob(
        /*
            once per hour between 2am-12pm UTC and once at 5pm UTC
            This translates to (10pm-8am EDT and 1pm EDT) or (9pm-7am EST and 12pm EST)
            ensuring that the job only runs with lowest overlap with working hours
        */
        '0 0 2-12,17 * * *',
        grantscraper.run,
    );
    job.start();
}

if (process.env.ENABLE_GRANTS_DIGEST === 'true') {
    const generateGrantDigestCron = new CronJob(
        // once per day at 12:00 UTC
        '0 0 12 * * *', emailService.buildAndSendGrantDigest,
    );
    generateGrantDigestCron.start();
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
    console.error('There are outstanding db migrations. Run \'yarn db:migrate\' before trying again');
    if (process.env.NODE_ENV === 'development') {
        process.exit(1);
    }
});

module.exports = server;
