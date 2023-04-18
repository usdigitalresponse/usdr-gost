// Update with your config settings.
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Signer } = require("@aws-sdk/rds-signer");

module.exports = {
    test: {
        client: 'pg',
        connection: process.env.POSTGRES_TEST_URL || 'postgresql://localhost:5432/usdr_grants_test',
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'migrations',
        },
        seeds: {
            directory: './seeds/dev',
        },
    },
    development: {
        client: 'pg',
        connection: process.env.POSTGRES_URL,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'migrations',
        },
        seeds: {
            directory: './seeds/dev',
        },
        debug: process.env.NODE_ENV === 'staging',
    },
    productionBasic: {
        client: 'pg',
        connection: process.env.POSTGRES_URL,
        pool: {
            min: 2,
            max: 10,
        },
        seeds: {
            directory: './seeds/dev',
        },
        migrations: {
            tableName: 'migrations',
        },
    },
    production: {
        client: 'pg',
        connection: async () => {
            const postgresURL = new URL(process.env.POSTGRES_URL);
            postgresURL.searchParams.set('ssl', 'true');
            const hostname = process.env.PGHOST || postgresURL.hostname;
            const port = process.env.PGPORT || postgresURL.port;
            const username = process.env.PGUSER || postgresURL.username;
            const dbname = process.env.PGDATABASE
                || path.parse(postgresURL.pathname || 'gost').name
                || 'gost';

            const tokenExpiration = new Date();
            const signer = new Signer({ hostname, port, username });
            const token = await signer.getAuthToken().then((authToken) => {
                tokenExpiration.setSeconds(tokenExpiration.getSeconds() + 900);
                return authToken;
            }).catch(() => {});
            if (!token) {
                console.warn("Failed to sign IAM auth token for Postgres, using POSTGRES_URL");
                return process.env.POSTGRES_URL;
            }

            return {
                host: hostname,
                port: port,
                user: username,
                password: token,
                database: dbname,
                ssl: {
                    ca: fs.readFileSync(path.resolve('./rds-combined-ca-bundle.pem'), "utf-8"),
                },
                expirationChecker: () => { return tokenExpiration <= new Date(); },
            };
        },
        pool: {
            min: 2,
            max: 10,
        },
        seeds: {
            directory: './seeds/dev',
        },
        migrations: {
            tableName: 'migrations',
        },
    }
};
