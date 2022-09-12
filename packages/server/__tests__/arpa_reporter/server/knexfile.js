require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.POSTGRES_URL,
  seeds: {
    directory: './seeds'
  }
}

// NOTE: This file was copied from tests/server/knexfile.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
