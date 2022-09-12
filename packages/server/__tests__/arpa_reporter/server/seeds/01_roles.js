const { isRunningInGOST } = require('../helpers/is_gost')

exports.seed = async function (knex) {
  const isGost = await isRunningInGOST(knex)

  // Deletes ALL existing entries
  return knex('roles')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('roles').insert([
        { name: 'admin', rules: {} },
        { name: isGost ? 'staff' : 'reporter', rules: {} }
      ])
    })
}

// NOTE: This file was copied from tests/server/seeds/01_roles.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
