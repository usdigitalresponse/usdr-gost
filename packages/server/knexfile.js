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
            const tokenExpiration = new Date();
            const postgresURL = new URL(process.env.POSTGRES_URL);
            postgresURL.searchParams.set('ssl', 'true');
            const signer = new Signer({
                hostname: postgresURL.hostname,
                port: postgresURL.port,
                username: postgresURL.username,
            });
            const token = await signer.getAuthToken().catch((err) => {
                console.warn("Failed to create Postgres IAM auth token, using POSTGRES_URL");
                return process.env.POSTGRES_URL;
             });
            tokenExpiration.setSeconds(tokenExpiration.getSeconds() + 900);
            return {
                host: postgresURL.hostname,
                port: postgresURL.port,
                user: postgresURL.username,
                password: token,
                database: 'gost',
                ssl: {
                    ca: fs.readFileSync(path.resolve('./rds-combined-ca-bundle.pem'), "utf-8"),
                },
                expirationChecker: () => {
                    return tokenExpiration <= new Date();
                },
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
