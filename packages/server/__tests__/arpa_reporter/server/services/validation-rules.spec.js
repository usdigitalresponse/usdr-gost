const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');

describe('validation rules', () => {
    const validationRulesModule = rewire('../../../../src/arpa_reporter/services/validation-rules');
    describe('record value formatters', () => {
        const formatters = validationRulesModule.__get__('recordValueFormatters');

        const testMatrix = {
            // 'fnKey': [[input, expected], ...]
            makeString: [
                [1, '1'],
                [{ foo: 'bar' }, '[object Object]'],
                [[1, 3, 5, 7], '1,3,5,7'],
                ['already a string', 'already a string'],
            ],
            trimWhitespace: [
                ['no trim required', 'no trim required'],
                ['   no whitespace on left side', 'no whitespace on left side'],
                ['no whitespace on right side    ', 'no whitespace on right side'],
                ['  no whitespace on either side  ', 'no whitespace on either side'],
                [123, 123],
                [[4, 5, 6], [4, 5, 6]],
            ],
            removeCommas: [
                ['no,commas,here', 'nocommashere'],
                ['spaces, still, remain', 'spaces still remain'],
                ['no commas to remove', 'no commas to remove'],
                [123, 123],
                [[4, 5, 6], [4, 5, 6]],
            ],
            removeSepDashes: [
                ['-one;-two;', 'one;two;'],
                ['-option with spaces;-more spaces;', 'option with spaces;more spaces;'],
                ['nothing to remove', 'nothing to remove'],
                [123, 123],
                [[4, 5, 6], [4, 5, 6]],
            ],
            toLowerCase: [
                ['NO LONGER ALL CAPS', 'no longer all caps'],
                ['No LoNgEr MiXeD cAsE', 'no longer mixed case'],
                ['still lower case', 'still lower case'],
                [123, 123],
                [[4, 5, 6], [4, 5, 6]],
            ],
        };
        for (const formatterName in testMatrix) {
            describe(`${formatterName}`, () => {
                const formatterFn = formatters[formatterName];
                for (const [testInput, expected] of testMatrix[formatterName]) {
                    let testDescription = `${typeof testInput} with value \`${testInput}\``;
                    if (_.isEqual(testInput, expected)) {
                        testDescription = `${testDescription} unmodified`;
                    } else {
                        testDescription = `${testDescription} formatted to "${expected}"`;
                    }

                    it(testDescription, () => {
                        const actual = formatterFn(testInput);
                        assert.deepEqual(actual, expected);
                    });
                }
            });
        }
    });

    describe('conditional requirement configs', () => {
        const configs = validationRulesModule.__get__('CONDITIONAL_REQS_CONFIGS');
        const funcLookup = validationRulesModule.__get__('CONDITIONAL_REQUIREMENTS_BY_FIELD_ID');
        it('has valid configurations', () => {
            const seenFieldIds = new Set();
            assert(configs.length > 0);
            for (const config of configs) {
                assert(config.fieldIDs && config.fieldIDs.length > 0,
                    'Conditional requirement config is missing fieldIDs');
                assert(config.func,
                    'Conditional requirement config is missing func');
                for (const fieldID of config.fieldIDs) {
                    if (seenFieldIds.has(fieldID)) {
                        throw new Error(`Field id ${fieldID} has overriding conditional requirements.`);
                    }
                    seenFieldIds.add(fieldID);
                }
            }
        });

        it('relaxes some requirements for projects that have not started', () => {
            const optionalIfNotStartedFn = funcLookup.Primary_Project_Demographics__c;
            assert(optionalIfNotStartedFn, 'Missing optionalIfNotStarted function');
            const testProject = {
                Completion_Status__c: 'Completed',
            };
            assert.equal(optionalIfNotStartedFn(testProject), true,
                'A completed project must include this field');

            testProject.Completion_Status__c = 'Not started';
            assert.equal(optionalIfNotStartedFn(testProject), false,
                'A not-started project can omit it');
        });

        it('requires a reason for canceled projects', () => {
            const cancellationReasonFunc = funcLookup.Cancellation_Reason__c;
            assert(cancellationReasonFunc, 'Missing requirement function for Cancellation_Reason__c');
            const testProject = {
                Completion_Status__c: 'Not started',
            };
            assert.equal(cancellationReasonFunc(testProject), false,
                'A non-cancelled project does not need a cancellation reason');

            testProject.Completion_Status__c = 'Cancelled';
            assert.equal(cancellationReasonFunc(testProject), true,
                'A cancelled project must include a cancellation reason');
        });
    });
});
