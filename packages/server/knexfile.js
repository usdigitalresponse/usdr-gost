// Update with your config settings.

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
};
