import { formatCurrency } from '@/helpers/currency';

describe('currency helpers', () => {
  describe('formatCurrency', () => {
    it('formats basic currency value', () => {
      expect(formatCurrency(1.23)).toBe('$1.23');
    });
    it('formats large currency value', () => {
      expect(formatCurrency(123456789.00)).toBe('$123,456,789.00');
    });
    it('formats whole numbers with cents', () => {
      expect(formatCurrency(1)).toBe('$1.00');
    });
    it('formats sub-cent values to the cent', () => {
      expect(formatCurrency(1.23456)).toBe('$1.23');
    });
    it('formats negative values', () => {
      expect(formatCurrency(-1.23)).toBe('-$1.23');
    });
    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
    it('formats undefined/null values', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
    });
  });
});
