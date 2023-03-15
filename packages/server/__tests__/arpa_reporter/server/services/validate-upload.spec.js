const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');
const { expect } = require('chai');

const { getRules } = require('../../../../src/arpa_reporter/services/validation-rules');
const { EXPENDITURE_CATEGORIES } = require('../../../../src/arpa_reporter/lib/format');
const ValidationError = require('../../../../src/arpa_reporter/lib/validation-error');

const validateUploadModule = rewire('../../../../src/arpa_reporter/services/validate-upload');

const ALL_RULES = getRules();

describe('validate upload', () => {
    describe('validate field pattern', () => {
        const validateFieldPattern = validateUploadModule.__get__(
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

describe('setOrValidateAgencyBasedOnCoverSheet', () => {
    const setOrValidateAgencyBasedOnCoverSheet = validateUploadModule.__get__('setOrValidateAgencyBasedOnCoverSheet');
    let setAgencyIdStub;

    beforeEach(() => {
        // Create a stub for the setAgencyId function
        setAgencyIdStub = sinon.stub().resolves();
        validateUploadModule.__set__('setAgencyId', setAgencyIdStub);
    });

    afterEach(() => {
        // Restore the original setAgencyId function after each test
        sinon.restore();
    });

    it('should set the agency ID from cover sheet when upload record has no agency ID', async () => {
        const recordFromUploadsTable = { id: 1, agency_id: null, agency_code: null };
        const coverSheetAgency = { id: 123, code: 'DEF' };

        await setOrValidateAgencyBasedOnCoverSheet(recordFromUploadsTable, coverSheetAgency);

        // Expect setAgencyIdStub to be called with the correct arguments
        expect(setAgencyIdStub.calledOnceWithExactly(recordFromUploadsTable.id, coverSheetAgency.id)).to.be.true;
    });

    it('should return a validation error when the upload record agency ID does not match cover sheet agency ID', async () => {
        const recordFromUploadsTable = { id: 1, agency_id: 456, agency_code: 'AGENCY1' };
        const coverSheetAgency = { id: 123, code: 'AGENCY2' };

        const result = await setOrValidateAgencyBasedOnCoverSheet(recordFromUploadsTable, coverSheetAgency);

        // Expect setAgencyId to not be called
        expect(setAgencyIdStub.called).to.be.false;

        // Expect the function to return a ValidationError with the correct message and metadata
        expect(result).to.be.an.instanceOf(ValidationError);
        expect(result.message).to.equal(`The agency on the spreadsheet, "${coverSheetAgency.code}", does not match the agency provided in the form, "${recordFromUploadsTable.agency_code}"`);
    });

    it('should not modify agencyId if uploadRecordAgencyId matches coverSheetAgency.id', async () => {
        const recordFromUploadsTable = { id: 1, agency_id: 456, agency_code: 'AGENCY1' };
        const coverSheetAgency = {
            id: recordFromUploadsTable.agency_id,
            code: recordFromUploadsTable.agency_code,
        };

        recordFromUploadsTable.agency_id = coverSheetAgency.id;

        await setOrValidateAgencyBasedOnCoverSheet(recordFromUploadsTable, coverSheetAgency);

        // Expect setAgencyId to not be called
        expect(setAgencyIdStub.called).to.be.false;
    });
});

describe('validate record', () => {
    const validateRecord = validateUploadModule.__get__(
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

    it('validates a valid project succesfully', () => validateRecord({
        upload: { ec_code: '2.16' },
        record: VALID_EC2_PROJECT,
        typeRules: ALL_RULES.ec2,
    }).then(
        (generatedErrors) => {
            assert(generatedErrors.length === 0,
                `Unexpected error when validating record: ${generatedErrors}`);
        },
        (thrownException) => { assert.fail(`Unexpected error while validating record: ${thrownException}`); },
    ));

    it('throws an error when a required field is missing', () => {
        const project = _.clone(VALID_EC2_PROJECT);
        delete project.Project_Identification_Number__c;
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES.ec2,
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length === 1);
                assert(generatedErrors[0].severity === 'err');
                assert.equal(generatedErrors[0].message, 'Value is required for Project_Identification_Number__c');
            },
            (thrownException) => { assert.fail(`Unexpected error while validating record: ${thrownException}`); },
        );
    });

    it('throws error for non-numeric values in numeric fields', () => {
        const project = _.clone(VALID_EC2_PROJECT);
        project.Number_Households_Eviction_Prevention__c = 'N/A';
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES.ec2,
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length === 1);
                assert(generatedErrors[0].severity === 'err');
                assert.equal(generatedErrors[0].message, `Expected a number, but the value was 'N/A'`);
            },
            (thrownException) => { assert.fail(`Unexpected error while validating record: ${thrownException}`); },
        );
    });
});

describe('validateIdentifier function', () => {
    const validateIdentifier = validateUploadModule.__get__('validateIdentifier');

    it('should return an error if recipient is a subrecipient or contractor and UEI is missing', async () => {
        const recipient = { Entity_Type_2__c: 'Subrecipient' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([
            new ValidationError(
                'UEI is required for all subrecipients and contractors',
                { col: 'C', severity: 'err' },
            ),
        ]);
    });

    it('should return an error if recipient is a beneficiary and both EIN and UEI are missing', async () => {
        const recipient = { Entity_Type_2__c: 'Beneficiary' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([
            new ValidationError(
                'At least one of UEI or TIN/EIN must be set for benficiaries, but both are missing',
                { col: 'C, D', severity: 'err' },
            ),
        ]);
    });

    it('should not return an error if recipient is a beneficiary and EIN is present', async () => {
        const recipient = { Entity_Type_2__c: 'Beneficiary', EIN__c: '123456789' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([]);
    });

    it('should not return an error if recipient is a beneficiary and UEI is present', async () => {
        const recipient = { Entity_Type_2__c: 'Beneficiary', Unique_Entity_Identifier__c: '123456789' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([]);
    });

    it('should not return an error if recipient is a subrecipient or contractor and UEI is present', async () => {
        const recipient = { Entity_Type_2__c: 'Subrecipient', Unique_Entity_Identifier__c: '123456789' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([]);
    });

    it('should return an error if at least one of Contractor and Subrecipient have been selected and no UEI is provided', async () => {
        const recipient = { Entity_Type_2__c: 'Beneficiary;Contractor' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([
            new ValidationError(
                'UEI is required for all subrecipients and contractors',
                { col: 'C', severity: 'err' },
            ),
        ]);
    });

    it('should not return an error if at least one of Contractor and Subrecipient have been selected and a UEI is provided', async () => {
        const recipient = { Entity_Type_2__c: 'Beneficiary;Contractor', Unique_Entity_Identifier__c: '123456789' };
        const errors = validateIdentifier(recipient);
        expect(errors).to.eql([]);
    });
});
