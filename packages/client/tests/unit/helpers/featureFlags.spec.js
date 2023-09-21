import { expect } from 'chai';
import { getFeatureFlags } from '@/helpers/featureFlags/utils';

describe('featureFlags', () => {
  describe('helpers', () => {
    describe('getFeatureFlags()', () => {
      describe('Defaults to empty object', () => {
        beforeEach(() => {
          if (window.APP_CONFIG !== undefined) {
            delete window.APP_CONFIG;
          }
          window.sessionStorage.removeItem('featureFlags');
        });

        it('when window.APP_CONFIG does not exist', () => {
          expect(getFeatureFlags()).to.be.an('object').that.is.empty;
        });

        it('when window.APP_CONFIG.featureFlags does not exist', () => {
          window.APP_CONFIG = {};
          expect(getFeatureFlags()).to.be.an('object').that.is.empty;
        });

        it('when window.APP_CONFIG.featureFlags is actually an empty object', () => {
          window.APP_CONFIG = { featureFlags: {} };
          expect(getFeatureFlags()).to.be.an('object').that.is.empty;
        });
      });

      describe('When featureFlags are defined', () => {
        it('Returns the featureFlags object', () => {
          const expectedFeatureFlags = { useFoo: true, numberFlag: 1234 };
          window.APP_CONFIG = { featureFlags: expectedFeatureFlags };
          const actualFeatureFlags = getFeatureFlags();
          expect(actualFeatureFlags.useFoo).to.be.true;
          expect(actualFeatureFlags.numberFlag).to.equal(1234);
          expect(actualFeatureFlags).to.eql(expectedFeatureFlags);
        });
        it('Ignores session storage overrides when JSON is malformed', () => {
          window.sessionStorage.setItem('featureFlags', 'i}am]not,JS;ON>{');
          const expectedFeatureFlags = { useFoo: true, numberFlag: 1234 };
          window.APP_CONFIG = { featureFlags: expectedFeatureFlags };
          const actualFeatureFlags = getFeatureFlags();
          expect(actualFeatureFlags.useFoo).to.be.true;
          expect(actualFeatureFlags.numberFlag).to.equal(1234);
          expect(actualFeatureFlags).to.eql(expectedFeatureFlags);
        });
        it('Overrides feature flag values from session storage', () => {
          const defaultFeatureFlags = { useFoo: true, numberFlag: 1234 };
          window.APP_CONFIG = { featureFlags: defaultFeatureFlags };
          const overriddenFeatureFlags = { useFoo: false, stringFlag: 'hi!' };
          window.sessionStorage.setItem('featureFlags', JSON.stringify(overriddenFeatureFlags));
          const actualFeatureFlags = getFeatureFlags();
          expect(actualFeatureFlags.useFoo).to.be.false;
          expect(actualFeatureFlags.numberFlag).to.equal(1234);
          expect(actualFeatureFlags.stringFlag).to.equal('hi!');
          expect(actualFeatureFlags).to.not.eql(defaultFeatureFlags);
          expect(actualFeatureFlags).to.eql({ useFoo: false, numberFlag: 1234, stringFlag: 'hi!' });
        });
      });
    });
  });
});
