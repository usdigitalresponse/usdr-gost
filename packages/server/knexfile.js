// Update with your config settings.

module.exports = {
    test: {
        client: 'pg',
        connection: process.env.POSTGRES_TEST_URL,
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
    },

    production: {
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
            directory: './seeds/prod',
        },
    },
};
