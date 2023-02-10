const { expect } = require('chai');
const requireSrc = require('../../utils');

const {
    contractMatches,
    cumulativeAmountIsEqual,
    dateIsInPeriodOfPerformance,
    dateIsInReportingPeriod,
    isAtLeast50K,
    isNotBlank,
    isNumber,
    isNumberOrBlank,
    isPositiveNumber,
    isPositiveNumberOrZero,
    isSum,
    isValidDate,
    isValidState,
    isValidSubrecipient,
    isValidZip,
    matchesFilePart,
    messageValue,
    numberIsLessThanOrEqual,
    numberIsGreaterThanOrEqual,
    validateFields,
    validateRecords,
    whenBlank,
    whenGreaterThanZero,
    whenUS,
} = requireSrc(__filename);

describe('validation helpers', () => {
    const validateContext = {
        fileParts: {
            projectId: 'DOH',
        },
        subrecipientsHash: {
            1010: {
                name: 'Payee',
            },
        },
        reportingPeriod: {
            startDate: '2020-03-01',
            endDate: '2020-09-30',
            periodOfPerformanceEndDate: '2020-12-30',
            crfEndDate: '2020-12-30',
        },
        firstReportingPeriodStartDate: '2020-03-01',
        periodSummaries: {
            periodSummaries: [
                {
                    project_code: '1',
                    award_number: '1001',
                    award_type: 'contracts',
                    current_obligation: 100.0,
                    current_expenditure: 10.00,
                },
                {
                    project_code: '1',
                    award_number: '1001',
                    award_type: 'contracts',
                    current_obligation: 200.0,
                    current_expenditure: 20.00,
                },
                {
                    project_code: '2',
                    award_number: '2002',
                    award_type: 'contracts',
                    current_obligation: 200.0,
                    current_expenditure: 20.00,
                },
            ],
        },
    };
    const testCases = [

        ['blank string', isNotBlank(''), false],
        ['non blank string', isNotBlank('Test'), true],
        ['number', isNumber(1), true],
        ['number', isNumber(''), false],
        ['numberOrBlank', isNumberOrBlank(1), true],
        ['numberOrBlank', isNumberOrBlank(''), true],
        ['non number', isNumber('Test'), false],
        ['positive number', isPositiveNumber(100), true],
        ['non positive number', isPositiveNumber(-100), false],
        ['positive number or zero', isPositiveNumberOrZero(0), true],
        ['positive number or zero', isPositiveNumberOrZero(100), true],
        ['positive number or zero allows blanks', isPositiveNumberOrZero(''), true],
        ['not a positive number or zero', isPositiveNumberOrZero(-10), false],
        ['valid date', isValidDate('2020-10-03'), true],
        ['invalid date', isValidDate('2020-15-99'), false],
        [
            'file part matches',
            matchesFilePart('projectId')('DOH', {}, validateContext),
            true,
        ],
        [
            'file part does not match',
            matchesFilePart('projectId')('OMB', {}, validateContext),
            false,
        ],
        [
            'valid subrecipient',
            isValidSubrecipient('1010', {}, validateContext),
            true,
        ],
        [
            'invalid subrecipient',
            isValidSubrecipient('1020', {}, validateContext),
            false,
        ],
        [
            'sum is correct',
            isSum(['amount1', 'amount2'])(
                100.0,
                { amount1: 40.0, amount2: 60.0 },
                validateContext,
            ),
            true,
        ],
        [
            'sum is not correct',
            isSum(['amount1', 'amount2'])(
                90.0,
                { amount1: 40.0, amount2: 60.0 },
                validateContext,
            ),
            false,
        ],
        [
            'sum convert strings to float',
            isSum(['amount1', 'amount2'])(
                '100.0',
                { amount1: '40.0', amount2: '60.0' },
                validateContext,
            ),
            true,
        ],
        [
            'number is less than or equal',
            numberIsLessThanOrEqual('total')(100, { total: 200 }, validateContext),
            true,
        ],
        [
            'number is not less than or equal',
            numberIsLessThanOrEqual('total')(500, { total: 200 }, validateContext),
            false,
        ],
        [
            'number is greater than or equal',
            numberIsGreaterThanOrEqual('total')(
                1000,
                { total: 200 },
                validateContext,
            ),
            true,
        ],
        [
            'number is not greater than or equal',
            numberIsGreaterThanOrEqual('total')(50, { total: 200 }, validateContext),
            false,
        ],
        [
            'date is in reporting period',
            dateIsInReportingPeriod(43929, {}, validateContext),
            true,
        ],
        [
            'date is before reporting period',
            dateIsInReportingPeriod(43800, {}, validateContext),
            false,
        ],
        [
            'date is after reporting period',
            dateIsInReportingPeriod(44197, {}, validateContext),
            false,
        ],
        [
            'date is in period or performance',
            dateIsInPeriodOfPerformance(44166, {}, validateContext),
            true,
        ],
        [
            'whenBlank conditional validation passes',
            whenBlank('duns number', isNotBlank)(
                '123',
                { 'duns number': '' },
                validateContext,
            ),
            true,
        ],
        [
            'whenBlank conditional validation fails',
            whenBlank('duns number', isNotBlank)(
                '',
                { 'duns number': '' },
                validateContext,
            ),
            false,
        ],
        [
            'whenBlank conditional validation ignored',
            whenBlank('duns number', isNotBlank)(
                '',
                { 'duns number': '123' },
                validateContext,
            ),
            true,
        ],
        [
            'whenGreaterThanZero conditional validation passes',
            whenGreaterThanZero(
                'total expenditure amount',
                dateIsInPeriodOfPerformance,
            )(44166, { 'total expenditure amount': 1000.0 }, validateContext),
            true,
        ],
        [
            'whenGreaterThanZero conditional validation fails',
            whenGreaterThanZero(
                'total expenditure amount',
                dateIsInPeriodOfPerformance,
            )(45000, { 'total expenditure amount': 1000.0 }, validateContext),
            false,
        ],
        [
            'whenGreaterThanZero conditional validation ignored',
            whenGreaterThanZero(
                'total expenditure amount',
                dateIsInPeriodOfPerformance,
            )(45000, { 'total expenditure amount': '' }, validateContext),
            true,
        ],
        [
            'valid US zip passes',
            isValidZip(
                98101,
                {},
                validateContext,
            ),
            true,
        ],
        [
            'valid US zip fails',
            isValidZip(
                981,
                {},
                validateContext,
            ),
            false,
        ],
        [
            'whenUS conditional validation passes',
            whenUS('country', isValidZip)(
                98101,
                { country: 'usa' },
                validateContext,
            ),
            true,
        ],
        [
            'whenUS conditional validation passes',
            whenUS('country', isValidZip)(
                98101,
                { country: 'united states' },
                validateContext,
            ),
            true,
        ],
        [
            'whenUS conditional validation fails',
            whenUS('country', isValidZip)(
                981,
                { country: 'usa' },
                validateContext,
            ),
            false,
        ],
        [
            'whenUS conditional validation fails',
            whenUS('country', isValidZip)(
                981,
                { country: 'united states' },
                validateContext,
            ),
            false,
        ],
        [
            'whenUS conditional validation skipped',
            whenUS('country', isValidZip)(
                981,
                { country: 'hk' },
                validateContext,
            ),
            true,
        ],
        [
            'whenUS conditional validation skipped',
            whenUS('country', isValidZip)(
                '',
                { country: 'hk' },
                validateContext,
            ),
            true,
        ],
        ['isAtLeast50K fails', isAtLeast50K(undefined), false],
        ['isAtLeast50K fails', isAtLeast50K(''), false],
        ['isAtLeast50K fails', isAtLeast50K(5000.00), false],
        ['isAtLeast50K passes', isAtLeast50K(50000.00), true],
        ['isAtLeast50K passes', isAtLeast50K(150000.00), true],

        [
            'cumulativeAmountIsEqual passes for obligation',
            cumulativeAmountIsEqual('current quarter obligation', contractMatches)(
                600.0,
                { 'project id': '1', 'contract number': '1001', 'current quarter obligation': 300.0 },
                validateContext,
            ),
            true,
        ],
        [
            'cumulativeAmountIsEqual passes for expenditure',
            cumulativeAmountIsEqual('total expenditure amount', contractMatches)(
                60.0,
                { 'project id': '1', 'contract number': '1001', 'total expenditure amount': 30.0 },
                validateContext,
            ),
            true,
        ],
        [
            'cumulativeAmountIsEqual fails',
            cumulativeAmountIsEqual('current quarter obligation', contractMatches)(
                200.0,
                { 'current quarter obligation': 300.0 },
                validateContext,
            ),
            false,
        ],
    ];
    testCases.forEach(([name, b, expectedResult]) => {
        it(`${name} should return ${expectedResult}`, () => {
            expect(b).to.equal(expectedResult);
        });
    });
    // isValidState() doesn't work in the testCases array,
    // because it has to run after beforeEach() has initialized
    // the dropdowns, so it has to be invoked inside an it() function.
    it.skip('isValidState("WA") should return true', () => {
        expect(isValidState('WA', {}, validateContext)).to.equal(true);
    });
    it.skip('isValidState("ZZ") should return false', () => {
        expect(isValidState('ZZ', {}, validateContext)).to.equal(false);
    });
});

describe('validateFields', () => {
    const requiredFields = [
        ['name', isNotBlank],
        ['date', isValidDate],
        ['description', isNotBlank, 'Description is required'],
    ];
    it('can validate a record', () => {
        const content = {
            name: 'George',
            date: '2020-10-02',
            description: 'testing',
        };
        const r = validateFields(requiredFields, content, 'Test', 1);
        expect(r).to.have.length(0);
    });
    it('can report multiple errors, with custom message', () => {
        const content = { name: '', date: '2020-10-02' };
        const r = validateFields(requiredFields, content, 'Test', 5);
        expect(r).to.have.length(2);
        expect(r[0].info.message).to.equal('Empty or invalid entry for name: ""');
        expect(r[0].info.tab).to.equal('Test');
        expect(r[0].info.row).to.equal(5);
        expect(r[1].info.message).to.equal('Description is required');
        expect(r[1].info.tab).to.equal('Test');
        expect(r[1].info.row).to.equal(5);
    });
});

describe('can exclude filters based on tags', () => {
    const requiredFields = [
        ['name', isNotBlank, 'Name is required', { tags: ['v2'] }],
    ];
    const content = { name: '' };
    it('includes filter with matching tag', () => {
        const r = validateFields(
            requiredFields,
            content,
            'Test Tab',
            1,
            { tags: ['v2'] },
        );
        expect(r).to.have.length(1);
    });
    it('ignores filter with non matching tag', () => {
        const r = validateFields(
            requiredFields,
            content,
            'Test Tab',
            1,
            { tags: ['v3'] },
        );
        expect(r).to.have.length(0);
    });
    it('ignores filter when context has no tags', () => {
        const r = validateFields(requiredFields, content, 'Test Tab', 1, {});
        expect(r).to.have.length(0);
    });
});

describe('custom message', () => {
    it('can include the invalid value in the message', () => {
        const validations = [
            ['type', (v) => v === 'FOO' || v === 'BAR', 'Type "{}" is not valid'],
        ];
        const content = { type: 'BAZ' };
        const r = validateFields(validations, content, 'Test', 5);
        expect(r).to.have.length(1);
        expect(r[0].info.message).to.equal('Type "BAZ" is not valid');
    });
});

describe('validateRecords', () => {
    const records = {
        test: [
            { content: { name: 'George' } },
            { content: { name: 'John' } },
            { content: { name: 'Thomas' } },
            { content: { name: 'James' } },
            { content: { name: '' } },
        ],
    };
    const validations = [['name', isNotBlank]];
    it('can validate a collection of records', () => {
        const log = validateRecords('test', validations)(records, {});
        expect(log).to.have.length(1);
    });
});

describe('date conversion for messages', () => {
    it('can convert spreadsheet dates', () => {
        expect(messageValue(44195, { isDateValue: true })).to.equal('12/30/2020');
    });
    it('only converts valid dates', () => {
        expect(messageValue('Friday', { isDateValue: true })).to.equal('Friday');
    });
    it('only converts dates', () => {
        expect(messageValue(44195)).to.equal(44195);
    });
});

/*                                 *  *  *                                    */

// NOTE: This file was copied from tests/server/services/validate-data/validate.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
