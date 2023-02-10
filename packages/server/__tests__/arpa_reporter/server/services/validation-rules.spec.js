const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');

describe('validation rules', () => {
    describe('record value formatters', () => {
        const formatters = rewire('../../../../src/arpa_reporter/services/validation-rules').__get__(
            'recordValueFormatters',
        );

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
                testMatrix[formatterName].forEach(([testInput, expected]) => {
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
                });
            });
        }
    });
});
