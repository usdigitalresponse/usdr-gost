require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.POSTGRES_URL,
  seeds: {
    directory: './seeds'
  }
}

// NOTE: This file was copied from tests/server/knexfile.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
