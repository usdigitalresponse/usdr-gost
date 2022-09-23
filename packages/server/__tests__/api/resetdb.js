const path = require('path');
const { exec } = require('child_process');

let { log } = console;
let { dir } = console;
dir(__dirname);
const knexFilePath = path.resolve(__dirname, '../../knexfile.js');
const knexFile = require(knexFilePath);

function execShellCommand(cmd, options = {}) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 500, ...options }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                throw error;
            } if (stdout) {
                log(stdout);
            } else {
                console.log(stderr);
            }
            resolve(Boolean(stdout));
        });
    });
}

async function resetDB({ verbose = false }) {
    if (!verbose) {
        log = () => { };
        dir = () => { };
    }

    let url = knexFile.test.connection;
    if (!url) {
        console.log('You must set POSTGRES_TEST_URL as an environment variable');
        process.exit(0);
    }
    const dbName = url.substring(url.lastIndexOf('/') + 1);
    url = url.substring(0, url.lastIndexOf('/'));

    const options = {
        env: process.env,
    };

    try {
        console.log(`Dropping database ${dbName}`);
        const dropDb = `psql ${url} -c "DROP DATABASE IF EXISTS ${dbName}"`;
        await execShellCommand(dropDb);

        console.log(`Re-creating database ${dbName}`);
        const createDb = `psql ${url} -c "CREATE DATABASE ${dbName}"`;
        await execShellCommand(createDb);

        console.log(`Seeding database ${dbName}`);
        const migrateSeed = `yarn knex --knexfile ${knexFilePath} migrate:latest && yarn knex --knexfile ${knexFilePath} seed:run`;
        await execShellCommand(migrateSeed, options);
    } catch (err) {
        console.dir(err);
        throw err;
    }
    return null;
}

module.exports = {
    resetDB,
    execShellCommand,
};

/*

#!/bin/bash

# The actual directory of this file.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
# set -x
set -e

# Import .env variables if not already defined.
DOTENV="$DIR/../../.env"
source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

# Default dbname is "postgres"
dbname=${1:-postgres}

echo Using database $dbname

mkdir -p $UPLOAD_DIRECTORY
rm -rf $UPLOAD_DIRECTORY/*

if [[ $dbname = postgres ]]
then
  # if the dbname is postgres it's easier to drop the schema than the database.
  psql -h localhost -U postgres -w postgres -c "DROP SCHEMA public CASCADE"
  psql -h localhost -U postgres -w postgres -c "CREATE SCHEMA public"
else

  psql -h localhost -U postgres -w postgres -c "DROP DATABASE IF EXISTS $dbname"
  psql -h localhost -U postgres -w postgres -c "CREATE DATABASE $dbname"
fi

yarn knex migrate:latest
yarn knex --knexfile tests/server/knexfile.js seed:run

*/
