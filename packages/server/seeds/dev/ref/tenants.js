// server/seeds/dev/ref/tenants.js

const agencies = require('./agencies');

const usdrAgency = agencies.find((a) => a.abbreviation === 'USDR');
const nevadaAgency = agencies.find((a) => a.abbreviation === 'NV');
const procurementAgency = agencies.find((a) => a.abbreviation === 'NPO');
const dallasAgency = agencies.find((a) => a.abbreviation === 'DLA');

module.exports = [
    {
        id: 1,
        display_name: 'USDR Tenant',
        main_agency_id: usdrAgency.id,
    },
    {
        id: 2,
        display_name: 'Nevada Tenant',
        main_agency_id: nevadaAgency.id,
    },
    {
        id: 3,
        display_name: 'NPO Tenant',
        main_agency_id: procurementAgency.id,
    },
    {
        id: 4,
        display_name: 'Dallas Agency',
        main_agency_id: dallasAgency.id,
    },
];
