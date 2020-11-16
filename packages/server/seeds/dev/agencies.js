exports.seed = function (knex) {
    return knex('agencies')
        .del()
        .then(() => knex('agencies').insert([
            { id: 1, name: 'department of health' },
            { id: 2, name: 'department of education' },
        ]));
};
