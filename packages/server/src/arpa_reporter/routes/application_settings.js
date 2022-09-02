/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { applicationSettings } = require('../db/settings')
const { requireUser } = require('../../lib/access-helpers')

router.get('/', requireUser, async function (req, res) {
  const application_settings = await applicationSettings()
  res.json({ application_settings })
})

module.exports = router

// NOTE: This file was copied from src/server/routes/application_settings.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
