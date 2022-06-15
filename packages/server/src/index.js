const express = require('express');
const { CronJob } = require('cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const configureAPI = require('./configure');
const grantscraper = require('./lib/grantscraper');

const { PORT = 3000 } = process.env;
const app = express();
configureAPI(app);
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
        await fs.rmdir(path.resolve(__dirname, './static/forms/generated'), { recursive: true });
        console.log('directory removed!');
    },
);
cleanGeneratedPdfCron.start();

module.exports = server;
