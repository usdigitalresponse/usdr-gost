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
        email: 'mindy@usdigitalresponse.org', // fake email for testing
        name: 'Mindy Huant',
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
    {
        id: 6,
        email: 'user1@nv.gov', // fake email for testing
        name: 'nv.gov User 1',
        agency_id: nevadaAgency.id,
        role_id: roles[1].id,
        tenant_id: nevadaenant.id,
    },
    {
        id: 7,
        email: 'user2@nv.gov', // fake email for testing
        name: 'nv.gov User 2',
        agency_id: nevadaAgency.id,
        role_id: roles[1].id,
        tenant_id: nevadaenant.id,
    },
    {
        id: 8,
        email: 'user3@nv.gov', // fake email for testing
        name: 'nv.gov User 3',
        agency_id: nevadaAgency.id,
        role_id: roles[1].id,
        tenant_id: nevadaenant.id,
    },
    {
        id: 9,
        email: 'user1@npo.nv.gov', // fake email for testing
        name: 'npo.nv.gov User 1',
        agency_id: procurementAgency.id,
        role_id: roles[1].id,
        tenant_id: procurementTenant.id,
    },
    {
        id: 10,
        email: 'user2@npo.nv.gov', // fake email for testing
        name: 'npo.nv.gov User 2',
        agency_id: procurementAgency.id,
        role_id: roles[1].id,
        tenant_id: procurementTenant.id,
    },
    {
        id: 11,
        email: 'user3@npo.nv.gov', // fake email for testing
        name: 'npo.nv.gov User 3',
        agency_id: procurementAgency.id,
        role_id: roles[1].id,
        tenant_id: procurementTenant.id,
    },
    {
        id: 12,
        email: 'user1@dallas.gov', // fake email for testing
        name: 'dallas.gov User 1',
        agency_id: dallasAgency.id,
        role_id: roles[0].id,
        tenant_id: dallasTenant.id,
    },
    {
        id: 13,
        email: 'admin1@nv.gov', // fake email for testing
        name: 'nv.gov Admin User 1',
        agency_id: nevadaAgency.id,
        role_id: roles[0].id,
        tenant_id: nevadaenant.id,
    },
    {
        id: 14,
        email: 'mindy+testsub@usdigitalresponse.org',
        name: 'USDR tenant sub agency user',
        agency_id: usdrSubAgency.id,
        role_id: roles[1].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 15,
        email: 'nat.hillard.usdr@gmail.com',
        name: 'Nat Hillard',
        agency_id: usdrSubAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
];
