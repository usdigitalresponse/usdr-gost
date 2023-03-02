const _ = require('lodash');
const assert = require('assert');
const rewire = require('rewire');

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
