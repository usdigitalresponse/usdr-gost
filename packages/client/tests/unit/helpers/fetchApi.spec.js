import { expect } from 'chai';
import { apiURL } from '../../../src/helpers/fetchApi';

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
      expect(result).to.equal('https://example.com/path/to/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).to.equal('https://example.com/path/to/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).to.equal('https://example.com/path/to');
      expect(apiURL('/')).to.equal('https://example.com/path/to/');
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
      expect(result).to.equal('/path/to/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).to.equal('/path/to/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).to.equal('/path/to');
      expect(apiURL('/')).to.equal('/path/to/');
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
      expect(result).to.equal('/somewhere/fun');
    });
    it('correctly formats relative endpoint paths', () => {
      const result = apiURL('oops/forgot/slash');
      expect(result).to.equal('/oops/forgot/slash');
    });
    it('correctly formats empty paths', () => {
      expect(apiURL('')).to.equal('');
      expect(apiURL('/')).to.equal('/');
    });
  });
});
