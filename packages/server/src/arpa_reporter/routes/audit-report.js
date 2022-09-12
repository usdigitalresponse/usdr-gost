/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()

const { requireUser } = require('../../lib/access-helpers')
const { generate } = require('../lib/audit-report')

router.get('/', requireUser, async function (req, res) {
  console.log('/api/audit-report GET')

  let report
  try {
    report = await generate(req.headers.host)
  } catch (error) {
    return res.status(500).send(error.message)
  }

  res.header(
    'Content-Disposition',
    `attachment; filename="${report.filename}"`
  )
  res.header('Content-Type', 'application/octet-stream')
  res.send(Buffer.from(report.outputWorkBook, 'binary'))
})

module.exports = router

/*                                  *  *  *                                   */

// NOTE: This file was copied from src/server/routes/audit-report.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
