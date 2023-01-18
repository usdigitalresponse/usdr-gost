const grantscraper = require('./grantscraper');

const crons = {
    grantScraper: {
        name: 'Grant Scraper',
        schedule: '0 30 6 * * *',
        description: 'Ensures that the grants tool has the most up to date grants information from grants.gov.',
        executable: grantscraper.run,
    },
    grantDigest: {
        name: 'Generate and Send Grant Digest Email',
        schedule: '0 30 6 * * *',
        description: 'Ensures that the grants tool has the most up to date grants information from grants.gov.',
        function: grantscraper.run,
    },
};

function startAllCron() {
    console.log(`${crons}`);
}

module.exports = {
    startAllCron,
};
