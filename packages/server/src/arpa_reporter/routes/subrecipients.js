
const express = require('express')

const router = express.Router()
const { requireUser } = require('../../lib/access-helpers')

const { listRecipients, getRecipient, updateRecipient } = require('../db/arpa-subrecipients')
const { getRules } = require('../services/validation-rules')

router.get('/', requireUser, async function (req, res) {
  const recipients = await listRecipients()
  return res.json({ recipients })
})

router.get('/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id)

  const recipient = await getRecipient(id)
  if (!recipient || recipient.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const rules = getRules()
  res.json({ recipient, rules: rules.subrecipient })
})

router.post('/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id)
  const user = req.session.user

  const recipient = await getRecipient(id)
  if (!recipient || recipient.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const record = JSON.parse(req.body.record)
  if (record.Unique_Entity_Identifier__c !== recipient.uei || record.EIN__c !== recipient.tin) {
    res.status(400).json({ error: 'Record cannot modify UEI or TIN' })
    return
  }

  const updatedRecipient = await updateRecipient(recipient.id, { record, updatedByUser: user })
  res.json({ recipient: updatedRecipient })
})

module.exports = router

// NOTE: This file was copied from src/server/routes/subrecipients.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
