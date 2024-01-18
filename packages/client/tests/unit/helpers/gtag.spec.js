import { expect } from 'chai';
import { setUserForGoogleAnalytics } from '@/helpers/gtag';

const user = {
  id: 5,
  agency_name: 'agency',
  tenant_display_name: 'tenant',
};

const gtagId = 'google_tag_id';

describe('gtag', () => {
  describe('#setUserForGoogleAnalytics()', () => {
    let observedGtagArgs;
    beforeEach(() => {
      observedGtagArgs = null;
      window.gtag = function (...args) {
        observedGtagArgs = args;
      };
      window.APP_CONFIG = { GOOGLE_TAG_ID: gtagId };
    });
    it('works when called with non-null user', () => {
      setUserForGoogleAnalytics(user);
      expect(observedGtagArgs).to.have.deep.ordered.members([
        'config',
        gtagId,
        {
          user_id: 5,
          user_properties: {
            organization_name: 'tenant',
            team_name: 'agency',
          },
        }]);
    });
    it('works when called with null user', () => {
      setUserForGoogleAnalytics(null);
      expect(observedGtagArgs).to.have.deep.ordered.members([
        'config',
        gtagId,
        {
          user_id: undefined,
          user_properties: {
            organization_name: undefined,
            team_name: undefined,
          },
        }]);
    });
    it('does not error when called and GA not enabled', () => {
      delete window.gtag;
      delete window.APP_CONFIG.GOOGLE_TAG_ID;
      expect(() => setUserForGoogleAnalytics(user)).to.not.throw();
      expect(observedGtagArgs).to.be.null;
    });
  });
});
