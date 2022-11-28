import { expect } from 'chai';
import { apiURL } from '../../../src/helpers/fetchApi';

describe('apiURL()', () => {
  const setupConfigRestore = function () {
    if (window.apiURLForGOST === undefined) {
      return function () {
        delete window.apiURLForGOST;
      };
    }
    const restoreValue = window.apiURLForGOST;
    return function () {
      window.apiURLForGOST = restoreValue;
    };
  };

  describe('When apiURLForGOST is FQDN with path', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      window.apiURLForGOST = 'https://example.com/path/to/';
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
  describe('When GOST_API_URL env var is path only', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      window.apiURLForGOST = '/path/to/';
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
  describe('When GOST_API_URL env var not set', () => {
    let restoreConfig;
    beforeEach(() => {
      restoreConfig = setupConfigRestore();
      delete window.apiURLForGOST;
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
      console.log(`API URL IS: ${apiURL('')}`);
      expect(apiURL('')).to.equal('');
      expect(apiURL('/')).to.equal('/');
    });
  });
});
