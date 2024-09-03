import {
  describe, beforeEach, afterEach, expect, it, vi,
} from 'vitest';
import { daysUntil } from '@/helpers/dates';

describe('dates', () => {
  describe('daysUntil()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2021-01-15T22:00:00'));
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('when called with date in the past', () => {
      it('returns zero', () => {
        const result = daysUntil('2021-01-10');
        expect(result).toBe(0);
      });
    });
    describe('when called with today as date', () => {
      it('returns zero', () => {
        const result = daysUntil('2021-01-15');
        expect(result).toBe(0);
      });
    });
    describe('when called with tomorrow as date', () => {
      it('returns one', () => {
        const result = daysUntil('2021-01-16');
        expect(result).toBe(1);
      });
    });
    describe('when called with date in the future', () => {
      it('returns the correct number of days', () => {
        const result = daysUntil('2022-01-16');
        expect(result).toBe(366);
      });
    });
  });
});
