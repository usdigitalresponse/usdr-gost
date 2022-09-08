// server/seeds/dev/ref/users.js

const agencies = require('./agencies');
const roles = require('./roles');
const tenants = require('./tenants');

const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');
const nevadaAgency = agencies.find((a) => a.abbreviation === 'NV');
const demoAgency = agencies.find((a) => a.abbreviation === 'DEMO');
const testAgency = agencies.find((a) => a.abbreviation === 'TEST');
const testSubAgency = agencies.find((a) => a.abbreviation === 'TEST2');

const usdrTenant = tenants.find((t) => t.display_name === 'USDR Tenant');
const nevadaTenant = tenants.find((t) => t.display_name === 'Nevada Tenant');
const demoTenant = tenants.find((t) => t.display_name === 'Demo Tenant');
const testTenant = tenants.find((t) => t.display_name === 'Test Tenant');

module.exports = [
    {
        id: 1,
        email: 'mindy@usdigitalresponse.org',
        name: 'Mindy Huang',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 2,
        email: 'joecomeau01@gmail.com',
        name: 'Joe Comeau',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 3,
        email: 'alex@usdigitalresponse.org',
        name: 'Alex Allain',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 4,
        email: 'grants.dev@usdigitalresponse.org',
        name: 'USDR Dev Account',
        agency_id: usdrAgency.id,
        role_id: roles[0].id,
        tenant_id: usdrTenant.id,
    },
    {
        id: 5,
        email: 'grants.dev+nv@usdigitalresponse.org',
        name: 'USDR Admin',
        agency_id: nevadaAgency.id,
        role_id: roles[0].id,
        tenant_id: nevadaTenant.id,
    },
    {
        id: 6,
        email: 'grants.dev+demo@usdigitalresponse.org',
        name: 'USDR Admin',
        agency_id: demoAgency.id,
        role_id: roles[0].id,
        tenant_id: demoTenant.id,
    },
    {
        id: 7,
        email: 'grants.dev+test.admin@usdigitalresponse.org',  // For testing
        name: 'USDR Dev Admin',
        agency_id: testAgency.id,
        role_id: roles[0].id,
        tenant_id: testTenant.id,
    },
    {
        id: 8,
        email: 'grants.dev+test.staff@usdigitalresponse.org',  // For testing
        name: 'USDR Dev Staff',
        agency_id: testAgency.id,
        role_id: roles[1].id,
        tenant_id: testTenant.id,
    },
    {
        id: 8,
        email: 'grants.dev+test.admin2@usdigitalresponse.org',  // For testing
        name: 'USDR Dev Admin',
        agency_id: testSubAgency.id,
        role_id: roles[0].id,
        tenant_id: testTenant.id,
    },
];
