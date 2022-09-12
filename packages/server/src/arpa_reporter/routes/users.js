/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser, requireAdminUser } = require('../../lib/access-helpers')
const { createUser, users: listUsers, updateUser, roles: listRoles, user: getUser } = require('../../db/arpa_reporter_db_shims/users')
const { agencyById } = require('../../db/arpa_reporter_db_shims/agencies')
const { sendWelcomeEmail } = require('../../lib/arpa_reporter_shims/email')
const _ = require('lodash-checkit')

async function validateUser (user, creator) {
  const { email, role, agency_id } = user
  if (!email) {
    throw new Error('User email is required')
  }
  if (!_.isEmail(email)) {
    throw new Error('Invalid email address')
  }
  if (!role) {
    throw new Error('Role required')
  }

  if (!agency_id) {
    throw new Error('Cannot create user without agency_id')
  }

  const agency = await agencyById(agency_id)
  if (!agency || agency.tenant_id !== creator.tenant_id) {
    throw new Error('Invalid agency')
  }

  return null
}

router.get('/', requireUser, async function (req, res, next) {
  const allUsers = await listUsers()
  const curUser = allUsers.find(u => u.id === Number(req.session.user.id))

  const users = (curUser.role.name === 'admin') ? allUsers : [curUser]
  const roles = await listRoles()
  res.json({ users, roles })
})

router.post('/', requireAdminUser, async function (req, res, next) {
  const creator = req.session.user
  const user = req.body.user
  user.email = user.email.toLowerCase().trim()

  try {
    await validateUser(user, creator)
  } catch (e) {
    res.status(400).json({ error: e.message })
    return
  }

  try {
    if (user.id) {
      const existingUser = await getUser(user.id)
      if (!existingUser || existingUser.tenant_id !== creator.tenant_id) {
        res.status(404).json({ error: 'invalid user' })
        return
      }

      const updatedUser = await updateUser(user)
      res.json({ user: updatedUser })
    } else {
      const updatedUser = await createUser(user)
      res.json({ user: updatedUser })

      void sendWelcomeEmail(updatedUser.email, req.headers.origin)
    }
  } catch (e) {
    console.dir(e)

    if (e.message.match(/violates unique constraint/)) {
      res.status(400).json({ error: 'User with that email already exists' })
    } else {
      next(e)
    }
  }
})

module.exports = router

// NOTE: This file was copied from src/server/routes/users.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
