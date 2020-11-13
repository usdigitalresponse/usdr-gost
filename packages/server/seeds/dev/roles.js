exports.seed = function (knex) {
    // Deletes ALL existing entries
    return knex('roles')
        .del()
        .then(() => knex('roles').insert([
            { name: 'state_admin', rules: {} },
            { name: 'dept_admin', rules: {} },
            { name: 'dept_staff', rules: {} },
        ]));
};
