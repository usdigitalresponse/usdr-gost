const { expect } = require('chai');
const grantscraper = require('../../src/lib/grantscraper');

describe('unit tests for time/date utility functions', () => {
    context('convertDateToEST', () => {
        it('verifies various dates work as expected', () => {
            const testData = {
                '2021-01-02': '2021-01-01',
                '2021-12-31': '2021-12-30',
                '2022-01-01': '2021-12-31',
            };
            // eslint-disable-next-line no-restricted-syntax
            for (const inputStr of Object.keys(testData)) {
                const dateinEST = grantscraper.convertDateToEST(inputStr);
                expect(testData[inputStr]).to.equal(dateinEST);
            }
        });
    });
    context('formatElapsedMs', () => {
        it('verifies formatted text converts back to same number of milliseconds', () => {
            // eslint-disable-next-line no-restricted-syntax
            for (const expectedMillis of [0, 1000, 1000 * 2, 1000 * 60 * 3, 1000 * 60 * 60 * 4]) {
                const formattedStr = grantscraper.formatElapsedMs(expectedMillis);
                const calcedMillis = (theStr) => {
                    const components = theStr.split(':');
                    const h = parseInt(components[0], 10) * 1000 * 60 * 60;
                    const m = parseInt(components[1], 10) * 1000 * 60;
                    const s = parseInt(components[2], 10) * 1000;
                    return h + m + s;
                };
                expect(expectedMillis).to.equal(calcedMillis(formattedStr));
            }
        });
    });
});
