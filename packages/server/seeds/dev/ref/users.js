// server/seeds/dev/ref/users.js

const agencies = require('./agencies');
const roles = require('./roles');
const tenants = require('./tenants');

const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');
const usdrSubAgency = agencies.find((a) => a.abbreviation === 'TSDR');
const nevadaAgency = agencies.find((a) => a.abbreviation === 'NV');
const procurementAgency = agencies.find((a) => a.abbreviation === 'NPO');
const dallasAgency = agencies.find((a) => a.abbreviation === 'DLA');

const usdrTenant = tenants.find((t) => t.display_name === 'USDR Tenant');
const nevadaenant = tenants.find((t) => t.display_name === 'Nevada Tenant');
const procurementTenant = tenants.find((t) => t.display_name === 'NPO Tenant');
const dallasTenant = tenants.find((t) => t.display_name === 'Dallas Agency');

module.exports = [
    {
        id: 1,
        email: 'alex@usdigitalresponse.org',
        name: 'Alex Allain',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 2,
        email: 'mhuang@usdigitalresponse.org',
        name: 'Mindy Huang',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 3,
        email: 'joecomeau01@gmail.com',
        name: 'Joe Comeau',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 4,
        email: 'asridhar@usdigitalresponse.org',
        name: 'Aditya Sridhar',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 5,
        email: 'thendrickson@usdigitalresponse.org',
        name: 'Tyler Hendrickson',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
];
