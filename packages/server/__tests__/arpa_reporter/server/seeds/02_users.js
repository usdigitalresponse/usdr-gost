require('dotenv').config()

const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/)
const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
  /\s*,\s*/
)

const unitTestUsers = [
  {
    email: 'mbroussard+unit-test-admin@usdigitalresponse.org',
    name: 'Unit Test Admin 1',
    // role: 'admin',
    // role_id: 1,
    tenant_id: 0
  },
  {
    email: 'mbroussard+unit-test-user2@usdigitalresponse.org',
    name: 'Unit Test User 2',
    // role: 'reporter',
    // role_id: 2,
    tenant_id: 1
  }
]

exports.seed = async function (knex) {
  // Deletes ALL existing admins and reporters
  // TODO(mbroussard): moot since mocha_wrapper.sh deletes and recreates the DB?
  // await knex('users')
  //   .where({ role: 'admin' })
  //   .del()
  // await knex('users')
  //   .where({ role: 'reporter' })
  //   .del()

  // Fixed test users specified in this file
  await knex('users').insert(unitTestUsers)

  // Test users specified by environment variable
  // TODO(mbroussard): why does this exist if this seed is only used for tests?
  // await knex('users').insert(
  //   adminList.map(email => {
  //     return { email, name: email, /* role: 'admin',*/ tenant_id: 0 }
  //   })
  // )
  // await knex('users').insert(
  //   agencyUserList.map(email => {
  //     return { email, name: email, /* role: 'reporter',*/ tenant_id: 0 }
  //   })
  // )
}
