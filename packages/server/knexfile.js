// Update with your config settings.
require('dotenv').config();
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
    production_old: {
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
            const uri = new URL(process.env.POSTGRES_URL);
            uri.searchParams.set('ssl', 'true');
            let postgresURL = process.env.POSTGRES_URL;
            const signer = Signer({
                hostname: uri.hostname,
                port: uri.port,
                username: uri.username,
            });
            const token = await signer.getAuthToken();
            const tokenExpiration = new Date();
            tokenExpiration.setSeconds(tokenExpiration.getSeconds() + 900);
            return {
                host: uri.hostname,
                port: uri.port,
                user: uri.username,
                password: token,
                database: 'gost',
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
