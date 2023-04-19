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
            const basicAuthConfig = {
                user: username,
                password: postgresURL.password,
                host: hostname,
                port,
                database: dbname,
            };

            const tokenExpiration = new Date();
            const signer = new Signer({ hostname, port, username });
            const token = await signer.getAuthToken().then((authToken) => {
                tokenExpiration.setSeconds(tokenExpiration.getSeconds() + 900);
                return authToken;
            }).catch(() => {});
            if (!token) {
                console.warn('Failed to sign IAM auth token for Postgres, will use basic auth');
                return basicAuthConfig;
            }

            const iamAuthConfig = {
                user: username,
                password: token,
                host: hostname,
                port,
                database: dbname,
                ssl: {
                    ca: fs.readFileSync(path.resolve('./rds-combined-ca-bundle.pem'), "utf-8"),
                },
                expirationChecker: () => { return tokenExpiration <= new Date(); },
            };

            try {
                // Test IAM authentication:
                await require('knex')({ client: 'pg', connection: iamAuthConfig}).raw('select 1');
            } catch (e) {
                console.warn('Postgres IAM auth failed, will use POSTGRES_URL');
                return basicAuthConfig;
            }
            return iamAuthConfig;
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
