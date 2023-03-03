const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');
const { getRules } = require('../../../../src/arpa_reporter/services/validation-rules');
const { EXPENDITURE_CATEGORIES } = require('../../../../src/arpa_reporter/lib/format');
const ALL_RULES = getRules()

describe('validate upload', () => {
    describe('validate field pattern', () => {
        const validateFieldPattern = rewire('../../../../src/arpa_reporter/services/validate-upload').__get__(
            'validateFieldPattern',
        );
        const EMAIL_KEY = 'POC_Email_Address__c';
        const malformedEmail = 'john smith john.smith@email.com';
        const properEmail = 'john.smith@email.com';

        it('Does not raise an error for valid emails', () => {
            assert(validateFieldPattern(EMAIL_KEY, properEmail) === null);
        });

        it('Raises an error for invalid emails', () => {
            assert(validateFieldPattern(EMAIL_KEY, malformedEmail) !== null);
        });
    });
});

describe('validation rules', () => {
    it('has rules for all expenditure categories (i.e. ec1, ec2...)', () => {
        for (const ecCode of Object.keys(EXPENDITURE_CATEGORIES)) {
            assert(ecCode in ALL_RULES);
        }
    });
});

describe('validate record', () => {
    const validateRecord = rewire('../../../../src/arpa_reporter/services/validate-upload').__get__(
        'validateRecord',
    );
    const VALID_EC2_PROJECT = {
        Name: 'Sample project',
        Project_Identification_Number__c: 101,
        Completion_Status__c: 'Completed less than 50%',
        Adopted_Budget__c: 500,
        Total_Obligations__c: 500,
        Total_Expenditures__c: 100,
        Current_Period_Obligations__c: 0,
        Current_Period_Expenditures__c: 0,
        Project_Description__c: 'lorem ipsum',
        Recipient_Approach_Description__c: 'lorem ipsum',
        Spending_Allocated_Toward_Evidence_Based_Interventions: 0,
        Program_Income_Earned__c: 0,
        Program_Income_Expended__c: 0,
        Primary_Project_Demographics__c: '4 Imp HHs that experienced increased food or housing insecurity',
        Structure_Objectives_of_Asst_Programs__c: 'lorem ipsum',
        Whether_program_evaluation_is_being_conducted: 'No',
        Does_Project_Include_Capital_Expenditure__c: 'No',
        Number_Households_Eviction_Prevention__c: 0,
        Number_Affordable_Housing_Units__c: 0,
    };

    it('validates a valid project succesfully', () => {
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: VALID_EC2_PROJECT,
            typeRules: ALL_RULES['ec2'],
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length == 0,
                    `Unexpected error when validating record: ${generatedErrors}`)
            },
            (thrownException) => { fail('Unexpected error while validating record', thrownException) }
        );
    });

    it('throws an error when a required field is missing', () => {
        let project = _.clone(VALID_EC2_PROJECT);
        delete project.Project_Identification_Number__c;
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES['ec2'],
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length == 1);
                assert(generatedErrors[0].severity == 'err');
                assert.equal(generatedErrors[0].message, 'Value is required for Project_Identification_Number__c');
            },
            (thrownException) => { fail('Unexpected error while validating record', thrownException) }
        );
    })

    it('throws error for non-numeric values in numeric fields', () => {
        let project = _.clone(VALID_EC2_PROJECT);
        project.Number_Households_Eviction_Prevention__c = 'N/A';
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES['ec2'],
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length == 1);
                assert(generatedErrors[0].severity == 'err');
                assert.equal(generatedErrors[0].message, `Expected a number, but the value was 'N/A'`);
            },
            (thrownException) => { fail('Unexpected error while validating record', thrownException) }
        );
    });
});
