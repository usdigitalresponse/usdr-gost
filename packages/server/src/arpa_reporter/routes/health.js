const express = require('express')
const router = express.Router()
const knex = require('../../db/connection')

router.get('/', async function (req, res) {
  const dbResult = await knex
    .raw("SELECT 'OK' AS ok")
    .timeout(500, { cancel: true })

  res.json({ success: true, db: dbResult.rows[0].ok })
})

module.exports = router

// NOTE: This file was copied from src/server/routes/health.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
