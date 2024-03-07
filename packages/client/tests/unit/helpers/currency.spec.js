import { expect } from 'chai';
import { formatCurrency } from '@/helpers/currency';

describe('currency helpers', () => {
  describe('formatCurrency', () => {
    it('formats basic currency value', () => {
      expect(formatCurrency(1.23)).equals('$1.23');
    });
    it('formats large currency value', () => {
      expect(formatCurrency(123456789.00)).equals('$123,456,789.00');
    });
    it('formats whole numbers with cents', () => {
      expect(formatCurrency(1)).equals('$1.00');
    });
    it('formats sub-cent values to the cent', () => {
      expect(formatCurrency(1.23456)).equals('$1.23');
    });
    it('formats negative values', () => {
      expect(formatCurrency(-1.23)).equals('-$1.23');
    });
    it('formats zero', () => {
      expect(formatCurrency(0)).equals('$0.00');
    });
    it('formats undefined/null values', () => {
      expect(formatCurrency(null)).equals('');
      expect(formatCurrency(undefined)).equals('');
    });
  });
});
