module.exports = [
    {
        id: 0,
        abbreviation: 'USDR',
        code: 'USDR',
        name: 'USDR',
        parent: null,
        main_agency_id: 0,
        tenant_id: 1,
    },
    {
        id: 1,
        abbreviation: 'DEMO',
        code: 'DEMO',
        name: 'Demo',
        parent: null,
        main_agency_id: 1,
        tenant_id: 3,
    },
    {
        id: 2,
        abbreviation: 'NV',
        code: 'NV',
        name: 'Nevada',
        parent: null,
        main_agency_id: 2,
        tenant_id: 2,
    },
    {
        id: 3,  // For development testing purposes.
        abbreviation: 'TEST',
        code: 'TEST',
        name: 'Test Agency',
        parent: null,
        main_agency_id: 3,
        tenant_id: 3,
    },
    {
        id: 4,  // For development testing purposes.
        abbreviation: 'TEST2',
        code: 'TEST2',
        name: 'Test Sub-Agency',
        parent: 3,
        main_agency_id: 3,
        tenant_id: 3,
    },
];
