import {
  describe, beforeEach, afterEach, it, expect,
} from 'vitest';
import { apiURL } from '@/helpers/fetchApi';

describe('apiURL()', () => {
  const setupConfigRestore = function () {
    window.APP_CONFIG = window.APP_CONFIG || {};
    if (window.APP_CONFIG.apiURLForGOST === undefined) {
      return function () {
        delete window.APP_CONFIG.apiURLForGOST;
      };
    }
    const restoreValue = window.APP_CONFIG.apiURLForGOST;
    return function () {
      window.APP_CONFIG.apiURLForGOST = restoreValue;
    };
  };

  describe('When window.APP_CONFIG.apiURLForGOST is FQDN with path', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      window.APP_CONFIG.apiURLForGOST = 'https://example.com/path/to/';
    });
    afterEach(() => {
      restoreConfig();
    });

    it('correctly formats absolute endpoint paths', () => {
      const result = apiURL('/somewhere/fun');
      expect(result).toBe('https://example.com/path/to/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).toBe('https://example.com/path/to/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).toBe('https://example.com/path/to');
      expect(apiURL('/')).toBe('https://example.com/path/to/');
    });
  });
  describe('When window.APP_CONFIG.apiURLForGOST is path only', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      window.APP_CONFIG.apiURLForGOST = '/path/to/';
    });
    afterEach(() => {
      restoreConfig();
    });

    it('correctly formats absolute endpoint paths', () => {
      const result = apiURL('/somewhere/fun');
      expect(result).toBe('/path/to/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).toBe('/path/to/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).toBe('/path/to');
      expect(apiURL('/')).toBe('/path/to/');
    });
  });
  describe('When window.APP_CONFIG.apiURLForGOST not set', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      delete window.APP_CONFIG.apiURLForGOST;
    });
    afterEach(() => {
      restoreConfig();
    });

    it('correctly formats absolute endpoint paths', () => {
      const result = apiURL('/somewhere/fun');
      expect(result).toBe('/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).toBe('/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).toBe('');
      expect(apiURL('/')).toBe('/');
    });
  });
});
