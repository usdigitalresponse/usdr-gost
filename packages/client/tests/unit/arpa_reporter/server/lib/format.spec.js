// eslint-disable-next-line import-alias/import-alias
import { ecCodes } from '../../../../../../server/src/arpa_reporter/lib/arpa-ec-codes';
// eslint-disable-next-line import-alias/import-alias
import {
  capitalizeFirstLetter,
  currency,
  ec,
  multiselect,
  subcategory,
  tin,
  zip,
  zip4,
} from '../../../../../../server/src/arpa_reporter/lib/format';

describe('server/lib/format', () => {
  describe('capitalizeFirstLetter', () => {
    it('handles the null case', () => {
      expect(capitalizeFirstLetter(null)).toBeNull();
      expect(capitalizeFirstLetter(undefined)).toBeUndefined();
    });
    it('handles the empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });
    it('capitalizes the first letter of any string', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
      expect(capitalizeFirstLetter('abc')).toBe('Abc');
      expect(capitalizeFirstLetter('abc def')).toBe('Abc def');

      expect(capitalizeFirstLetter('yes')).toBe('Yes');
      expect(capitalizeFirstLetter('no')).toBe('No');
    });
    it('lowercases letters other than the first letter', () => {
      expect(capitalizeFirstLetter('ABC')).toBe('Abc');
      expect(capitalizeFirstLetter('ABC DEF')).toBe('Abc def');

      expect(capitalizeFirstLetter('YES')).toBe('Yes');
      expect(capitalizeFirstLetter('NO')).toBe('No');
    });
    it('passes through non-string values', () => {
      expect(capitalizeFirstLetter(123)).toBe(123);
      expect(capitalizeFirstLetter([])).toEqual([]);
    });
  });

  describe('currency', () => {
    it('handles the null case', () => {
      expect(currency(null)).toBeNull();
      expect(currency(undefined)).toBeUndefined();
    });
    it('transforms numeric values to strings', () => {
      expect(currency(1234)).toBe('1234');
      expect(currency(0)).toBe('0');
    });
    it('rounds decimal values to two places', () => {
      expect(currency(0.0001)).toBe('0');
      expect(currency(150000.435302)).toBe('150000.44');
      expect(currency(150000.431302)).toBe('150000.43');
    });
    it('passes through non-numeric values', () => {
      expect(capitalizeFirstLetter('123')).toBe('123');
      expect(capitalizeFirstLetter([])).toEqual([]);
    });
  });

  describe('ec', () => {
    it('handles the null case', () => {
      expect(ec(null)).toBeUndefined();
      expect(ec(undefined)).toBeUndefined();
    });
    it('handles known ec codes', () => {
      expect(ec('ec1')).toBe('1-Public Health');
      expect(ec('ec3')).toBe('3-Public Health-Negative Economic Impact: Public Sector Capacity');
      expect(ec('ec7')).toBe('7-Administrative');
    });
    it("doesn't throw with unknown values", () => {
      expect(ec('ec6')).toBeUndefined();
      expect(ec('abcd')).toBeUndefined();
    });
  });

  describe('multiselect', () => {
    it('handles the null case', () => {
      expect(multiselect(null)).toBeNull();
      expect(multiselect(undefined)).toBeUndefined();
    });
    it('handles values with no delimiters', () => {
      expect(multiselect('abc')).toBe('abc');
      expect(multiselect('abc - def')).toBe('abc - def');
    });
    it('normalizes delimeters', () => {
      expect(multiselect('-abc;def;-ghi; jkl; -mno;')).toBe('abc;def;ghi;jkl;mno');
    });
    it('trims preceding hyphens', () => {
      expect(multiselect('-abc;')).toBe('abc');
      expect(multiselect('-abc; -def;')).toBe('abc;def');
      expect(multiselect('-one; -two; -twenty-three;')).toBe('one;two;twenty-three');
    });
    it('trims trailing delimeters', () => {
      expect(multiselect('abc;')).toBe('abc');
      expect(multiselect('abc;def;')).toBe('abc;def');
      expect(multiselect('abc;def;ghi; ')).toBe('abc;def;ghi');
    });
    it('removes all commas', () => {
      expect(multiselect('a,b,c')).toBe('abc');
      expect(multiselect('a,b;c,d')).toBe('ab;cd');
      expect(multiselect(',a,b; -c,d')).toBe('ab;cd');
    });
    it('passes through non-string values', () => {
      expect(capitalizeFirstLetter(123)).toBe(123);
      expect(capitalizeFirstLetter([])).toEqual([]);
    });
  });

  describe('subcategory', () => {
    it('handles the null case', () => {
      expect(subcategory(null)).toBeNull();
      expect(subcategory(undefined)).toBeUndefined();
    });
    it('handles unknown strings', () => {
      expect(subcategory('abcdef')).toBeUndefined();
      expect(subcategory('1.0')).toBeUndefined();
    });
    it('accepts a known subcategory codes', () => {
      expect(subcategory('1.1')).toBe('1.1-COVID-19 Vaccination');
    });
    it('accepts all known subcategory codes', () => {
      Object.keys(ecCodes).forEach((code) => {
        expect(subcategory(code)).toBeDefined();
      });
    });
  });

  describe('tin', () => {
    it('handles the null case', () => {
      expect(tin(null)).toBeNull();
      expect(tin(undefined)).toBeUndefined();
    });
    it('accepts a string', () => {
      expect(tin('123456789')).toBe('123456789');
    });
    it('accepts a number', () => {
      expect(tin(123456789)).toBe('123456789');
    });
    it('removes hyphens if present', () => {
      expect(tin('12-3456789')).toBe('123456789');
    });
  });

  describe('zip', () => {
    it('handles the null case', () => {
      expect(zip(null)).toBeNull();
      expect(zip(undefined)).toBeUndefined();
    });
    it('accepts a string', () => {
      expect(zip('12345')).toBe('12345');
    });
    it('accepts a number', () => {
      expect(zip(12345)).toBe('12345');
    });
    it('pads a number with zeroes if necessary', () => {
      expect(zip(123)).toBe('00123');
      expect(zip('123')).toBe('00123');
    });
  });

  describe('zip4', () => {
    it('handles the null case', () => {
      expect(zip4(null)).toBeNull();
      expect(zip4(undefined)).toBeUndefined();
    });
    it('accepts a string', () => {
      expect(zip4('1234')).toBe('1234');
    });
    it('accepts a number', () => {
      expect(zip4(1234)).toBe('1234');
    });
    it('pads a number with zeroes if necessary', () => {
      expect(zip4(123)).toBe('0123');
      expect(zip4('123')).toBe('0123');
    });
  });
});

// NOTE: This file was copied from tests/unit/server/lib/format.spec.js (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z
