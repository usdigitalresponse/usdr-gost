import {
  describe, beforeEach, it, expect,
  vi,
} from 'vitest';
import { setUserForGoogleAnalytics } from '@/helpers/gtag';

const user = {
  id: 5,
  agency_id: 8,
  tenant_id: 9,
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
      expect(observedGtagArgs).toEqual(expect.arrayContaining([
        'config',
        gtagId,
        {
          user_id: 5,
          user_properties: {
            organization_id: 9,
            team_id: 8,
          },
        }]));
    });
    it('works when called with null user', () => {
      setUserForGoogleAnalytics(null);
      expect(observedGtagArgs).toEqual(expect.arrayContaining([
        'config',
        gtagId,
        {
          user_id: undefined,
          user_properties: {
            organization_id: undefined,
            team_id: undefined,
          },
        }]));
    });
    it('does not error when called and GA not enabled', () => {
      delete window.gtag;
      delete window.APP_CONFIG.GOOGLE_TAG_ID;
      expect(() => setUserForGoogleAnalytics(user)).not.toThrow();
      expect(observedGtagArgs).toBeNull();
    });
    it('enables GA debug mode when instructed via APP_CONFIG', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementationOnce(vi.fn());
      window.APP_CONFIG.GOOGLE_ANALYTICS_DEBUG = true;
      setUserForGoogleAnalytics(user);
      expect(observedGtagArgs[2]).toHaveProperty('debug_mode', true);
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      consoleLogSpy.mockRestore();
    });
    it('disables GA debug mode when not instructed via APP_CONFIG', () => {
      window.APP_CONFIG.GOOGLE_ANALYTICS_DEBUG = undefined;
      setUserForGoogleAnalytics(user);
      expect(observedGtagArgs[2]).not.toHaveProperty('debug_mode');
    });
  });
});
