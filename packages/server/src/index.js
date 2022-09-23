const express = require('express');
const { CronJob } = require('cron');
const fs = require('fs').promises;
const path = require('path');

const { configureApp } = require('./configure');
const grantscraper = require('./lib/grantscraper');

const { PORT = 3000 } = process.env;
const app = express();
configureApp(app);
const server = app.listen(PORT, () => console.log(`App running on port ${PORT}!`));

if (process.env.ENABLE_GRANTS_SCRAPER === 'true') {
    const job = new CronJob(
        '* 30 * * * *',
        grantscraper.run,
    );
    job.start();
}

const cleanGeneratedPdfCron = new CronJob(
    '* 1 * * *',
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

module.exports = server;
