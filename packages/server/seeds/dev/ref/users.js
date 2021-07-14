// server/seeds/dev/ref/users.js

const agencies = require('./agencies');
const roles = require('./roles');

const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');
const nevadaAgency = agencies.find((a) => a.abbreviation === 'NV');
const procurementAgency = agencies.find((a) => a.abbreviation === 'NPO');

module.exports = [
    // {
    //     email: 'rafael.pol+admin_admin@protonmail.com',
    //     name: 'rafa1',
    //     agency_id: agencies[1].id,
    //     role_id: roles[0].id,
    // },
    // {
    //     email: 'bindu+admin_admin@usdigitalresponse.org',
    //     name: 'bindu',
    //     agency_id: agencies[1].id,
    //     role_id: roles[0].id,
    // },
    // {
    //     email: 'rafael.pol+admin_sba@protonmail.com',
    //     name: 'rafa1',
    //     agency_id: agencies[0].id,
    //     role_id: roles[0].id,
    // },
    {
        email: 'michael@stanford.cc',
        name: 'Michael Stanford',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'michael+nv@stanford.cc',
        name: 'Michael Stanford NV',
        agency_id: nevadaAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'michael+nvpr@stanford.cc',
        name: 'Michael Stanford NV-Procurement',
        agency_id: procurementAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'dang.alex@gmail.com',
        name: 'Alex Dang',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'rafael.pol@protonmail.com',
        name: 'Rafael Pol',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
    },
    {
        email: 'jsotak@admin.nv.gov',
        name: 'Jovon Sotak',
        agency_id: procurementAgency.id,
        role_id: roles[0].id,
    },
    // {
    //     email: 'rafael.pol+staff_asd@protonmail.com',
    //     name: 'rafa2',
    //     agency_id: agencies[2].id,
    //     role_id: roles[1].id,
    // },
];
