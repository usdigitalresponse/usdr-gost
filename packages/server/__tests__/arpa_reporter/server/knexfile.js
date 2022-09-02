require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.POSTGRES_URL,
  seeds: {
    directory: './seeds'
  }
}

// NOTE: This file was copied from tests/server/knexfile.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
