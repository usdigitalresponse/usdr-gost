const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');
const { expect } = require('chai');
const fixtures = require('../fixtures/fixtures');
const { knex } = require('../mocha_init');

const { getRules } = require('../../../../src/arpa_reporter/services/validation-rules');
const { EXPENDITURE_CATEGORIES } = require('../../../../src/arpa_reporter/lib/format');
const ValidationError = require('../../../../src/arpa_reporter/lib/validation-error');

const validateUploadModule = rewire('../../../../src/arpa_reporter/services/validate-upload');
const { withTenantId } = require('../helpers/with-tenant-id');

const ALL_RULES = getRules();

describe('validate upload', () => {
    describe('validate field pattern', () => {
        const validateFieldPattern = validateUploadModule.__get__(
            'validateFieldPattern',
        );
        const EMAIL_KEY = 'POC_Email_Address__c';
        const malformedEmail = 'john smith john.smith@email.com';
        const properEmail = 'john.smith@email.com';

        const CITY_KEY = 'Place_of_Performance_City__c';
        const malformedCity = 'St. Louis';
        const properCity = 'New York City';

        it('Does not raise an error for valid emails', () => {
            assert(validateFieldPattern(EMAIL_KEY, properEmail) === null);
        });

        it('Raises an error for invalid emails', () => {
            assert(validateFieldPattern(EMAIL_KEY, malformedEmail) !== null);
        });

        it('Does not raise an error for valid cities', () => {
            assert(validateFieldPattern(CITY_KEY, properCity) === null);
        });

        it('Raises an error for invalid cities', () => {
            assert(validateFieldPattern(CITY_KEY, malformedCity) !== null);
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

    const VALID_AWARDS_50K = {
        Recipient_UEI__c: 'ABCDEFGHIJK',
        Recipient_EIN__c: '00-0000000',
        Entity_Type_2__c: 'Contractor',
        Project_Identification_Number__c: 1,
        Award_No__c: '000',
        Award_Type__c: 'Contract: Blanket Purchase Agreement',
        Award_Amount__c: 10,
        Award_Date__c: '3/29/2022',
        Primary_Sector__c: 'Family or child care',
        Purpose_of_Funds__c: 'Sample purpose',
        Period_of_Performance_Start__c: '2022-02-01T05:00:00.000Z',
        Period_of_Performance_End__c: '2022-08-31T04:00:00.000Z',
        Place_of_Performance_Address_1__c: 'Somewhere Else',
        Place_of_Performance_Address_2__c: 'Area 51',
        Place_of_Performance_City__c: 'Somewhere',
        State_Abbreviated__c: 'RI',
        Place_of_Performance_Zip__c: '02920',
        Description__c: 'Sample description',
        Subaward_Changed__c: 'No',
        IAA_Basic_Conditions__c: '1. It imposes conditions on the use of funds by the agency, department, or part of government receiving funds to carry out the program',
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

    it('validates a valid award successfully', () => {
        const project = _.clone(VALID_AWARDS_50K);
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES.awards50k,
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length === 0,
                    `Unexpected error when validating record: ${generatedErrors}`);
            },
            (thrownException) => { assert.fail(`Unexpected error while validating record: ${thrownException}`); },
        );
    });

    it('throws error for a bad date', () => {
        const project = _.clone(VALID_AWARDS_50K);
        project.Award_Date__c = '3/292022';
        return validateRecord({
            upload: { ec_code: '2.16' },
            record: project,
            typeRules: ALL_RULES.awards50k,
        }).then(
            (generatedErrors) => {
                assert(generatedErrors.length === 1);
                assert(generatedErrors[0].severity === 'err');
                assert.equal(generatedErrors[0].message, `Data entered in cell is "3/292022", which is not a valid date.`);
            },
            (thrownException) => { assert.fail(`Unexpected error while validating record: ${thrownException}`); },
        );
    });
});

describe('findRecipientInDatabase', () => {
    const TENANT_A = 0;
    const TENANT_B = 1;
    const recipients = {
        beneficiaryWithTIN_TA: {
            tenant_id: TENANT_A,
            name: 'Beneficiary with TIN',
            tin: 'TIN-1',
            uei: null,
        },
        iaa_TA: {
            tenant_id: TENANT_A,
            name: 'IAA',
            tin: null,
            uei: null,
        },
        iaaWithEIN_TA: {
            tenant_id: TENANT_A,
            name: 'IAA with EIN',
            tin: 'TIN-IAA-1',
            uei: null,
        },
        iaaWithUEI_TA: {
            tenant_id: TENANT_A,
            name: 'IAA with UEI',
            tin: null,
            uei: 'UEI-IAA-1',
        },
        contractorWithUEI_TA: {
            tenant_id: TENANT_A,
            name: 'Contractor with UEI',
            tin: null,
            uei: 'UEI-1',
        },
        beneficiaryWithTIN_TB: {
            tenant_id: TENANT_B,
            name: 'Beneficiary with TIN',
            tin: 'TIN-1',
            uei: null,
        },
        iaa_TB: {
            tenant_id: TENANT_B,
            name: 'IAA',
            tin: null,
            uei: null,
        },
        contractorWithUEI_TB: {
            tenant_id: TENANT_B,
            name: 'Contractor with UEI',
            tin: null,
            uei: 'UEI-1',
        },
        subrecipientOnlyInTB: {
            tenant_id: TENANT_B,
            name: 'Subrecipient only in TB',
            tin: 'TIN-TB',
            uei: 'UEI-TB',
        },
    };
    const getFormattedRecipient = (recipient) => ({
        Name: recipient.name,
        Unique_Entity_Identifier__c: recipient.uei,
        EIN__c: recipient.tin,
        Entity_Type_2__c: recipient.name,
    });
    const findRecipientInDatabase = validateUploadModule.__get__('findRecipientInDatabase');
    const trns = knex;
    before(async () => {
        await knex.raw('TRUNCATE TABLE arpa_subrecipients CASCADE');
        await knex('arpa_subrecipients').insert(Object.values(recipients));
    });

    describe('non-IAA recipient', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the recipient found by UEI', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.contractorWithUEI_TA), trns }));
            expect(result.name).to.equal('Contractor with UEI');
        });

        it('should return the recipient found by EIN', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.beneficiaryWithTIN_TA), trns }));
            expect(result.name).to.equal('Beneficiary with TIN');
        });

        it('should return null if recipient is not found', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({
                recipient: {
                    Name: 'Non-existent recipient',
                    Unique_Entity_Identifier__c: 'UEI-2',
                    EIN__c: 'TIN-2',
                },
                trns,
            }));
            expect(result).to.be.null;
        });
        it('should return null if recipient is exists in a different tenant', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.subrecipientOnlyInTB), trns }));
            expect(result).to.be.null;
        });
        it('should return null if non-IAA recipient does not have a UEI or TIN', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({
                recipient: {
                    Name: 'Beneficiary with TIN',
                    Unique_Entity_Identifier__c: null,
                    EIN__c: null,
                    Entity_Type_2__c: 'Beneficiary, Subrecipient',
                },
                trns,
            }));
            expect(result).to.be.null;
        });
    });
    describe('IAA recipients', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the IAA recipient found by UEI', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.iaaWithUEI_TA), trns }));
            expect(result.name).to.equal('IAA with UEI');
        });

        it('should return the IAA recipient found by EIN', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.iaaWithEIN_TA), trns }));
            expect(result.name).to.equal('IAA with EIN');
        });

        it('should return the recipient found by Name if no UEI or TIN exists', async () => {
            const result = await withTenantId(TENANT_A, () => findRecipientInDatabase({ recipient: getFormattedRecipient(recipients.iaa_TA), trns }));
            expect(result.name).to.equal('IAA');
        });
    });
});

describe('validateIdentifier for IAA', () => {
    const validateIdentifier = validateUploadModule.__get__('validateIdentifier');
    describe('when subrecipient exists in the database', () => {
        it('should return no errors if IAA has no UEI or TIN', () => {
            const recipient = {
                Entity_Type_2__c: 'IAA',
                Unique_Entity_Identifier__c: null,
                EIN__c: null,
            };
            const recipientExists = true;
            const errors = validateIdentifier(recipient, recipientExists);
            assert.deepStrictEqual(errors, []);
        });
    });
    describe('when subrecipient does not exist in the database', () => {
        it('should return no errors if IAA has no UEI or TIN', () => {
            const recipient = {
                Entity_Type_2__c: 'IAA',
                Unique_Entity_Identifier__c: null,
                EIN__c: null,
            };
            const recipientExists = false;
            const errors = validateIdentifier(recipient, recipientExists);
            assert.deepStrictEqual(errors, []);
        });
    });
});

describe('validateIdentifier for Beneficiary', () => {
    const validateIdentifier = validateUploadModule.__get__('validateIdentifier');
    describe('when subrecipient exists in the database', () => {
        describe('subrecipients created prior to July 1st 2024', () => {
            it('should return an error if recipient is an existing Beneficiary and only has a UEI', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: '0123456789ABCDEF',
                    EIN__c: null,
                };
                const recipientExists = { created_at: new Date('2024-06-30T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, []);
            });

            it('should not return an error if recipient is not a new beneficiary and has a TIN', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: null,
                    EIN__c: '123456789',
                };
                const recipientExists = { created_at: new Date('2024-06-30T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, []);
            });

            it('should return an error if recipient is not a new beneficiary and has neither UEI nor TIN', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: null,
                    EIN__c: null,
                };
                const recipientExists = { created_at: new Date('2024-06-30T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, [
                    new ValidationError(
                        'At least one of UEI or TIN/EIN must be set, but both are missing',
                        { col: 'C, D', severity: 'err' },
                    ),
                ]);
            });
        });
        describe('subrecipients created on or after July 1st 2024', () => {
            it('should return an error if recipient is an existing Beneficiary and only has a UEI', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: '0123456789ABCDEF',
                    EIN__c: null,
                };
                const recipientExists = { created_at: new Date('2024-07-02T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, [
                    new ValidationError(
                        'You must enter a TIN for this subrecipient',
                        { col: 'D', severity: 'err' },
                    ),
                ]);
            });

            it('should not return an error if recipient is not a new beneficiary and has a TIN', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: null,
                    EIN__c: '123456789',
                };
                const recipientExists = { created_at: new Date('2024-07-01T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, []);
            });

            it('should return an error if recipient is not a new beneficiary and has neither UEI nor TIN', () => {
                const recipient = {
                    Entity_Type_2__c: 'Beneficiary',
                    Unique_Entity_Identifier__c: null,
                    EIN__c: null,
                };
                const recipientExists = { created_at: new Date('2024-07-02T00:00:00') };
                const errors = validateIdentifier(recipient, recipientExists);
                assert.deepStrictEqual(errors, [
                    new ValidationError(
                        'You must enter a TIN for this subrecipient',
                        { col: 'D', severity: 'err' },
                    ),
                ]);
            });
        });
    });
    describe('when subrecipient does not exist in the database', () => {
        it('should return an error if recipient is a new beneficiary and has no UEI or TIN', () => {
            const recipient = {
                Entity_Type_2__c: 'Beneficiary',
                Unique_Entity_Identifier__c: null,
                EIN__c: null,
            };
            const recipientExists = false;
            const errors = validateIdentifier(recipient, recipientExists);
            assert.deepStrictEqual(errors, [
                new ValidationError(
                    'You must enter a TIN for this subrecipient',
                    { col: 'D', severity: 'err' },
                ),
            ]);
        });
        it('should return an error if recipient is a new Beneficiary and only has a UEI', () => {
            const recipient = {
                Entity_Type_2__c: 'Beneficiary',
                Unique_Entity_Identifier__c: '0123456789ABCDEF',
                EIN__c: null,
            };
            const recipientExists = false;
            const errors = validateIdentifier(recipient, recipientExists);
            assert.deepStrictEqual(errors, [
                new ValidationError(
                    'You must enter a TIN for this subrecipient',
                    { col: 'D', severity: 'err' },
                ),
            ]);
        });
    });
});

describe('validateIdentifier', () => {
    const validateIdentifier = validateUploadModule.__get__('validateIdentifier');
    it('should return an error if recipient is a new subrecipient and has no UEI', () => {
        const recipient = {
            Entity_Type_2__c: 'Subrecipient',
            Unique_Entity_Identifier__c: null,
            EIN__c: '123456789',
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, [
            new ValidationError(
                'UEI is required for all new subrecipients',
                { col: 'C', severity: 'err' },
            ),
        ]);
    });

    it('should return an error if recipient is a new contractor and has no UEI or TIN', () => {
        const recipient = {
            Entity_Type_2__c: 'Contractor',
            Unique_Entity_Identifier__c: null,
            EIN__c: null,
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, [
            new ValidationError(
                'At least one of UEI or TIN/EIN must be set, but both are missing',
                { col: 'C, D', severity: 'err' },
            ),
        ]);
    });

    it('should return an error if entity type is semicolon-separated list that includes Subrecipient, and it has an UEI', () => {
        const recipient = {
            Entity_Type_2__c: 'Subrecipient;Benificiary',
            Unique_Entity_Identifier__c: null,
            EIN__c: '123456789',
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, [
            new ValidationError(
                'UEI is required for all new subrecipients',
                { col: 'C', severity: 'err' },
            ),
        ]);
    });

    it('should not return an error if recipient is a new subrecipient and has a UEI', () => {
        const recipient = {
            Entity_Type_2__c: 'Subrecipient',
            Unique_Entity_Identifier__c: '0123456789ABCDEF',
            EIN__c: null,
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, []);
    });

    it('should not return an error if recipient is a new contractor and has a UEI', () => {
        const recipient = {
            Entity_Type_2__c: 'Contractor',
            Unique_Entity_Identifier__c: '0123456789ABCDEF',
            EIN__c: null,
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, []);
    });

    it('should not return an error if recipient is a new contractor and has a TIN', () => {
        const recipient = {
            Entity_Type_2__c: 'Contractor',
            Unique_Entity_Identifier__c: null,
            EIN__c: '123345678',
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, []);
    });

    it('should not return an error if recipient is a new contractor and has a TIN and UEI', () => {
        const recipient = {
            Entity_Type_2__c: 'Contractor',
            Unique_Entity_Identifier__c: '133456789ASDFG',
            EIN__c: '123345678',
        };
        const recipientExists = false;
        const errors = validateIdentifier(recipient, recipientExists);
        assert.deepStrictEqual(errors, []);
    });
});

describe('recipientBelongsToUpload', () => {
    const recipientBelongsToUpload = validateUploadModule.__get__('recipientBelongsToUpload');
    const upload = { id: '123' };

    it('returns false if existing recipient is not provided', () => {
        const result = recipientBelongsToUpload(null, upload);
        expect(result).to.be.false;
    });

    it('returns false if existing recipient upload_id does not match the upload id', () => {
        const existingRecipient = { upload_id: '456' };
        const result = recipientBelongsToUpload(existingRecipient, upload);
        expect(result).to.be.false;
    });

    it('returns false if existing recipient updated_at is defined', () => {
        const existingRecipient = { upload_id: '123', updated_at: new Date() };
        const result = recipientBelongsToUpload(existingRecipient, upload);
        expect(result).to.be.false;
    });

    it('returns true if existing recipient upload_id matches the upload id and updated_at is undefined', () => {
        const existingRecipient = { upload_id: '123' };
        const result = recipientBelongsToUpload(existingRecipient, upload);
        expect(result).to.be.true;
    });

    it('returns true if existing recipient upload_id matches the upload id and updated_at is null', () => {
        const existingRecipient = { upload_id: '123', updated_at: null };
        const result = recipientBelongsToUpload(existingRecipient, upload);
        expect(result).to.be.true;
    });
});

describe('updateOrCreateRecipient', () => {
    const updateOrCreateRecipient = validateUploadModule.__get__('updateOrCreateRecipient');
    let createRecipientStub;
    let updateRecipientStub;

    beforeEach(() => {
        createRecipientStub = sinon.stub().resolves();
        updateRecipientStub = sinon.stub();
        validateUploadModule.__set__('createRecipient', createRecipientStub);
        validateUploadModule.__set__('updateRecipient', updateRecipientStub);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should call createRecipient when existingRecipient is falsy', async () => {
        const trns = {};
        const upload = { id: 1 };
        const newRecipient = { Name: 'Test 1', Unique_Entity_Identifier__c: 'UEI1', EIN__c: 'EIN1' };

        await updateOrCreateRecipient(null, newRecipient, trns, upload, createRecipientStub, updateRecipientStub);

        sinon.assert.calledWith(createRecipientStub, {
            name: 'Test 1',
            uei: 'UEI1',
            tin: 'EIN1',
            record: newRecipient,
            upload_id: 1,
        }, trns);
        sinon.assert.notCalled(updateRecipientStub);
    });

    it('should call updateRecipient when existingRecipient belongs to current upload', async () => {
        const trns = {};
        const upload = { id: 1 };
        const existingRecipient = { id: 1, upload_id: 1, updated_at: null };
        const newRecipient = { Unique_Entity_Identifier__c: 'UEI1', EIN__c: 'EIN1' };

        await updateOrCreateRecipient(existingRecipient, newRecipient, trns, upload, createRecipientStub, updateRecipientStub);

        sinon.assert.calledWith(updateRecipientStub, 1, { record: newRecipient }, trns);
        sinon.assert.notCalled(createRecipientStub);
    });

    it('should not call createRecipient or updateRecipient when existingRecipient belongs to a different upload', async () => {
        const trns = {};
        const upload = { id: 1 };
        const existingRecipient = { id: 1, upload_id: 2, updated_at: null };
        const newRecipient = { Unique_Entity_Identifier__c: 'UEI1', EIN__c: 'EIN1' };

        await updateOrCreateRecipient(existingRecipient, newRecipient, trns, upload, createRecipientStub, updateRecipientStub);

        sinon.assert.notCalled(createRecipientStub);
        sinon.assert.notCalled(updateRecipientStub);
    });
});

describe('validateSubrecipientRecord', () => {
    const validateSubrecipientRecord = validateUploadModule.__get__('validateSubrecipientRecord');
    it('returns an empty array and updates the recipient when the record is valid', async () => {
        const recipient = {
            Entity_Type_2__c: 'Subrecipient',
            Unique_Entity_Identifier__c: null,
            EIN__c: '123456789',
        };
        const existingRecipient = undefined;
        const findRecipientStub = sinon.stub().resolves(existingRecipient);
        const updateRecipientStub = sinon.stub().resolves();

        const upload = { id: 123 };
        const recordErrors = [];
        const trns = 'TRNS123';

        validateUploadModule.__set__('findRecipientInDatabase', findRecipientStub);
        validateUploadModule.__set__('updateOrCreateRecipient', updateRecipientStub);

        const errors = await validateSubrecipientRecord({
            upload,
            record: recipient,
            recordErrors,
            trns,
        });
        assert.deepStrictEqual(errors, [
            new ValidationError(
                'UEI is required for all new subrecipients',
                { col: 'C', severity: 'err' },
            ),
        ]);
        sinon.assert.notCalled(updateRecipientStub);
    });
});

describe('invalidate', () => {
    before(async () => {
        await fixtures.seed(knex);
    });

    after(async () => {
        await fixtures.clean(knex);
    });

    it('should invalidate', async () => {
        const { upload1 } = fixtures.uploads;
        const user = fixtures.users.staffUser;
        await validateUploadModule.invalidateUpload(upload1, user);
        const rows = await knex('uploads')
            .where('id', upload1.id)
            .select('uploads.*');
        const row = rows[0];
        assert.equal(row.invalidated_by, user.id);
        assert(row.invalidated_at !== null);
        assert(row.validated_at === null);
        assert(row.validated_by === null);
    });
});
