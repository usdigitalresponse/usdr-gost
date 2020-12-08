const express = require('express');
const { CronJob } = require('cron');

const configureAPI = require('./configure');
const grantscraper = require('./lib/grantscraper');

const { PORT = 3000 } = process.env;
const app = express();
configureAPI(app);
app.listen(PORT, () => console.log(`App running on port ${PORT}!`));
grantscraper.run();
if (process.env.ENABLE_GRANTS_SCRAPER === 'true') {
    const job = new CronJob(
        '* 30 * * * *',
        grantscraper.run,
    );
    job.start();
}
