require('dotenv').config();

const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/);
const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
    /\s*,\s*/,
);

exports.seed = async function (knex) {
    // Deletes ALL existing admins
    await knex('users')
        .where({ role: 'state_admin' })
        .del();
    await knex('users').insert(
        adminList.map((email) => ({ email, name: email, role: 'state_admin' })),
    );
    await knex('users')
        .where({ role: 'dept_staff' })
        .del();
    await knex('users').insert(
        agencyUserList.map((email) => ({ email, name: email, role: 'dept_staff' })),
    );
};
