const assert = require('assert');

const { generateReport, generateSubaward } = require('../../../../src/arpa_reporter/services/generate-arpa-report');
const { withTenantId } = require('../helpers/with-tenant-id');
const { getTemplate } = require('../../../../src/arpa_reporter/services/get-template');

describe('arpa report generation', () => {
    it('generates a report', async () => {
        const tenantId = 0;
        const report = await withTenantId(tenantId, () => generateReport(1));
        assert.ok(report);
    });
    it('generates all the columns of subawardBulkUpload correctly', async () => {
        // tests the  generateSubaward function
        const sampleRecords = [
            {
                type: 'cover',
                upload: {
                  filename: 'ARPA SFRF Reporting Workbook _10.15errortest.xlsm',
                  created_at: "2025-01-03T14:46:09.069Z",
                  reporting_period_id: 64,
                  user_id: 4,
                  agency_id: 0,
                  validated_at: "2025-01-03T14:46:10.180Z",
                  validated_by: 4,
                  ec_code: '2.2',
                  tenant_id: 1,
                  id: 'c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b',
                  notes: null,
                  invalidated_at: null,
                  invalidated_by: null,
                  created_by: 'asridhar@usdigitalresponse.org',
                  agency_code: 'USDR'
                },
                content: {
                  'Upload ID': '',
                  'Expenditure Category Group': '2-Negative Economic Impacts',
                  'Detailed Expenditure Category': '2.2-Household Assistance: Rent, Mortgage, and Utility Aid'
                }
            },
            {
                type: 'logic',
                upload: {
                  filename: 'ARPA SFRF Reporting Workbook _10.15errortest.xlsm',
                  created_at: "2025-01-03T14:46:09.069Z",
                  reporting_period_id: 64,
                  user_id: 4,
                  agency_id: 0,
                  validated_at: "2025-01-03T14:46:10.180Z",
                  validated_by: 4,
                  ec_code: '2.2',
                  tenant_id: 1,
                  id: 'c93c6251-c1e0-49ab-8f04-d7cc9e1ac22b',
                  notes: null,
                  invalidated_at: null,
                  invalidated_by: null,
                  created_by: 'asridhar@usdigitalresponse.org',
                  agency_code: 'USDR'
                },
                content: { version: 'v:20240823' }
              },
              {
                type: 'awards50k',
                subcategory: '7.1-Administrative Expenses',
                upload: {
                  filename: '24Q4 7.1.xlsm',
                  created_at: "2025-01-21T20:55:14.883Z",
                  reporting_period_id: 64,
                  user_id: 4,
                  agency_id: 0,
                  validated_at: "2025-01-21T20:55:16.369Z",
                  validated_by: 4,
                  ec_code: '7.1',
                  tenant_id: 1,
                  id: 'ff4d3f49-e6a0-4229-848b-c6899790e2f1',
                  notes: null,
                  invalidated_at: null,
                  invalidated_by: null,
                  created_by: 'asridhar@usdigitalresponse.org',
                  agency_code: 'USDR'
                },
                content: {
                  Recipient_UEI__c: 'TVXXX123XXX9',
                  __rowNum__: 12,
                  Recipient_EIN__c: '200999888',
                  Entity_Type_2__c: 'Contractor',
                  Project_Identification_Number__c: 'X999X999888111',
                  Award_No__c: 'C725V523000171',
                  Award_Type__c: 'Contract: Purchase Order',
                  Award_Amount__c: 213888,
                  Award_Date__c: "2023-01-03T00:00:00.000Z",
                  Period_of_Performance_Start__c: "2023-01-03T00:00:00.000Z",
                  Period_of_Performance_End__c: "2024-12-31T00:00:00.000Z",
                  Place_of_Performance_Address_1__c: '1 Main St.',
                  Place_of_Performance_City__c: 'New York',
                  State_Abbreviated__c: 'NY',
                  Place_of_Performance_Zip__c: '10001',
                  Description__c: 'Project Support Services',
                  Subaward_Changed__c: 'No',
                  Contract_Estimated_Expended: 0,
                  Personnel_Cost_Estimates__c: 'Yes',
                  Personnel_Estimated_Expended: 1232593.0499999998,
                  Personnel_Expended_FTE_Count: 31,
                  Contract_Expended_Justification: 'Each project budget includes non-arpa capital funding to ensure that all schedule requirements for obligations and expenditures are met.'
                }
              },
        ];
        const result = await generateSubaward(sampleRecords);
        // assert that the result is equal to []
        const expectedResult = [
            [
                null,
                'TVXXX123XXX9',
                '200999888',
                'X999X999888111',
                'C725V523000171',
                'Contractor',
                'Contract: Purchase Order',
                '213888',
                '2023-01-03T00:00:00.000Z',
                undefined,
                undefined,
                '2023-01-03T00:00:00.000Z',
                '2024-12-31T00:00:00.000Z',
                '1 Main St.',
                undefined,
                undefined,
                'New York',
                'NY',
                '10001',
                undefined,
                undefined,
                'Project Support Services',
                undefined,
                undefined,
                undefined,
                undefined,
                'Yes',
                1232593.0499999998,
                31,
                undefined,
                0,
                "Each project budget includes non-arpa capital funding to ensure that all schedule requirements for obligations and expenditures are met."
            ]
        ];
        const subawardBulkUploadTemplate = await getTemplate('subawardBulkUpload');

        assert.equal(JSON.stringify(result), JSON.stringify(expectedResult));

        // verifies that the latest treasury output template has the same amount of columns as the funciton output
        assert.equal(result[0].length, subawardBulkUploadTemplate[3].length);

    });
});


// NOTE: This file was copied from tests/server/services/generate-arpa-report.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
