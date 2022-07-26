module.exports = {
    client: 'pg',
    connection: process.env.POSTGRES_TEST_URL || 'postgresql://localhost:5432/usdr_grants_test',
    seeds: {
        directory: './seeds',
    },
};
