require('dotenv').config();

module.exports = {
    client: 'pg',
    connection: process.env.POSTGRES_URL,
    seeds: {
        directory: './seeds',
    },
};

// NOTE: This file was copied from tests/server/knexfile.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
