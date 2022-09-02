import { expect } from 'chai'

import { ecCodes } from '../../../../../../server/src/arpa_reporter/lib/arpa-ec-codes'
import {
  capitalizeFirstLetter,
  currency,
  ec,
  multiselect,
  subcategory,
  tin,
  zip,
  zip4
} from '../../../../../../server/src/arpa_reporter/lib/format'

describe('server/lib/format', () => {
  describe('capitalizeFirstLetter', () => {
    it('handles the null case', () => {
      expect(capitalizeFirstLetter(null)).to.be.null
      expect(capitalizeFirstLetter(undefined)).to.be.undefined
    })
    it('handles the empty string', () => {
      expect(capitalizeFirstLetter('')).to.equal('')
    })
    it('capitalizes the first letter of any string', () => {
      expect(capitalizeFirstLetter('a')).to.equal('A')
      expect(capitalizeFirstLetter('abc')).to.equal('Abc')
      expect(capitalizeFirstLetter('abc def')).to.equal('Abc def')

      expect(capitalizeFirstLetter('yes')).to.equal('Yes')
      expect(capitalizeFirstLetter('no')).to.equal('No')
    })
    it('lowercases letters other than the first letter', () => {
      expect(capitalizeFirstLetter('ABC')).to.equal('Abc')
      expect(capitalizeFirstLetter('ABC DEF')).to.equal('Abc def')

      expect(capitalizeFirstLetter('YES')).to.equal('Yes')
      expect(capitalizeFirstLetter('NO')).to.equal('No')
    })
  })

  describe('currency', () => {
    it('handles the null case', () => {
      expect(currency(null)).to.be.null
      expect(currency(undefined)).to.be.undefined
    })
    it('transforms numeric values to strings', () => {
      expect(currency(1234)).to.equal('1234')
      expect(currency(0)).to.equal('0')
    })
    it('rounds decimal values to two places', () => {
      expect(currency(0.0001)).to.equal('0')
      expect(currency(150000.435302)).to.equal('150000.44')
      expect(currency(150000.431302)).to.equal('150000.43')
    })
  })

  describe('ec', () => {
    it('handles the null case', () => {
      expect(ec(null)).to.be.undefined
      expect(ec(undefined)).to.be.undefined
    })
    it('handles known ec codes', () => {
      expect(ec('ec1')).to.equal('1-Public Health')
      expect(ec('ec3')).to.equal(
        '3-Public Health-Negative Economic Impact: Public Sector Capacity'
      )
      expect(ec('ec7')).to.equal('7-Administrative')
    })
    it("doesn't throw with unknown values", () => {
      expect(ec('ec6')).to.be.undefined
      expect(ec('abcd')).to.be.undefined
    })
  })

  describe('multiselect', () => {
    it('handles the null case', () => {
      expect(multiselect(null)).to.be.null
      expect(multiselect(undefined)).to.be.undefined
    })
    it('handles values with no delimiters', () => {
      expect(multiselect('abc')).to.equal('abc')
      expect(multiselect('abc - def')).to.equal('abc - def')
    })
    it('normalizes delimeters', () => {
      expect(multiselect('-abc;def;-ghi; jkl; -mno;')).to.equal('abc;def;ghi;jkl;mno')
    })
    it('trims preceding hyphens', () => {
      expect(multiselect('-abc;')).to.equal('abc')
      expect(multiselect('-abc; -def;')).to.equal('abc;def')
      expect(multiselect('-one; -two; -twenty-three;')).to.equal('one;two;twenty-three')
    })
    it('trims trailing delimeters', () => {
      expect(multiselect('abc;')).to.equal('abc')
      expect(multiselect('abc;def;')).to.equal('abc;def')
      expect(multiselect('abc;def;ghi; ')).to.equal('abc;def;ghi')
    })
    it('removes all commas', () => {
      expect(multiselect('a,b,c')).to.equal('abc')
      expect(multiselect('a,b;c,d')).to.equal('ab;cd')
      expect(multiselect(',a,b; -c,d')).to.equal('ab;cd')
    })
  })

  describe('subcategory', () => {
    it('handles the null case', () => {
      expect(subcategory(null)).to.be.null
      expect(subcategory(undefined)).to.be.undefined
    })
    it('handles unknown strings', () => {
      expect(subcategory('abcdef')).to.be.undefined
      expect(subcategory('1.0')).to.be.undefined
    })
    it('accepts a known subcategory codes', () => {
      expect(subcategory('1.1')).to.equal('1.1-COVID-19 Vaccination')
    })
    it('accepts all known subcategory codes', () => {
      Object.keys(ecCodes).forEach((code) => {
        expect(subcategory(code)).not.to.be.undefined
      })
    })
  })

  describe('tin', () => {
    it('handles the null case', () => {
      expect(tin(null)).to.be.null
      expect(tin(undefined)).to.be.undefined
    })
    it('accepts a string', () => {
      expect(tin('123456789')).to.equal('123456789')
    })
    it('accepts a number', () => {
      expect(tin(123456789)).to.equal('123456789')
    })
    it('removes hyphens if present', () => {
      expect(tin('12-3456789')).to.equal('123456789')
    })
  })

  describe('zip', () => {
    it('handles the null case', () => {
      expect(zip(null)).to.be.null
      expect(zip(undefined)).to.be.undefined
    })
    it('accepts a string', () => {
      expect(zip('12345')).to.equal('12345')
    })
    it('accepts a number', () => {
      expect(zip(12345)).to.equal('12345')
    })
    it('pads a number with zeroes if necessary', () => {
      expect(zip(123)).to.equal('00123')
      expect(zip('123')).to.equal('00123')
    })
  })

  describe('zip4', () => {
    it('handles the null case', () => {
      expect(zip4(null)).to.be.null
      expect(zip4(undefined)).to.be.undefined
    })
    it('accepts a string', () => {
      expect(zip4('1234')).to.equal('1234')
    })
    it('accepts a number', () => {
      expect(zip4(1234)).to.equal('1234')
    })
    it('pads a number with zeroes if necessary', () => {
      expect(zip4(123)).to.equal('0123')
      expect(zip4('123')).to.equal('0123')
    })
  })
})

// NOTE: This file was copied from tests/unit/server/lib/format.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
