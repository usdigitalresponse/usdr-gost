module.exports = {
    client: 'pg',
    connection: process.env.POSTGRES_URL,
    seeds: {
        directory: './seeds'
    }
}