import { expect } from 'chai';
import { getFeatureFlags } from '@/helpers/featureFlags/helpers';

describe('featureFlags', () => {
  describe('helpers', () => {
    describe('getFeatureFlags()', () => {
      describe('Defaults to empty object', () => {
        beforeEach(() => {
          if (window.APP_CONFIG !== undefined) {
            delete window.APP_CONFIG;
          }
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
          const actualFeatureFlags = { useFoo: true, numberFlag: 1234 };
          window.APP_CONFIG = { featureFlags: actualFeatureFlags };
          expect(getFeatureFlags()).to.eql(actualFeatureFlags);
          expect(getFeatureFlags().useFoo).to.be.true;
          expect(getFeatureFlags().numberFlag).to.equal(1234);
        });
      });
    });
  });
});
