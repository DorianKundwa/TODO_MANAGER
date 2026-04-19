/**
 * Tests for date helper utilities.
 */

import {
  formatDate,
  formatTime,
  getToday,
  isToday,
  isFuture,
  isPast,
  getRelativeDate,
  addToDate,
  getDayOfWeek,
  getGreeting,
} from '../../utils/dateHelpers';

describe('dateHelpers', () => {
  const TODAY = getToday();

  describe('formatDate', () => {
    it('formats a date string correctly', () => {
      expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
      expect(formatDate('2026-12-01')).toBe('Dec 1, 2026');
    });
  });

  describe('formatTime', () => {
    it('converts 24h time to 12h format', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('returns empty string for null', () => {
      expect(formatTime(null)).toBe('');
    });
  });

  describe('getToday', () => {
    it('returns a date in YYYY-MM-DD format', () => {
      expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(TODAY)).toBe(true);
    });

    it('returns false for other dates', () => {
      expect(isToday('2000-01-01')).toBe(false);
      expect(isToday('2099-12-31')).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture('2099-12-31')).toBe(true);
    });

    it('returns false for today and past dates', () => {
      expect(isFuture(TODAY)).toBe(false);
      expect(isFuture('2000-01-01')).toBe(false);
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast('2000-01-01')).toBe(true);
    });

    it('returns false for today and future dates', () => {
      expect(isPast(TODAY)).toBe(false);
      expect(isPast('2099-12-31')).toBe(false);
    });
  });

  describe('addToDate', () => {
    it('adds days correctly', () => {
      expect(addToDate('2026-01-01', 1, 'days')).toBe('2026-01-02');
      expect(addToDate('2026-01-31', 1, 'days')).toBe('2026-02-01');
    });

    it('adds weeks correctly', () => {
      expect(addToDate('2026-01-01', 1, 'weeks')).toBe('2026-01-08');
    });

    it('adds months correctly', () => {
      expect(addToDate('2026-01-15', 1, 'months')).toBe('2026-02-15');
    });
  });

  describe('getRelativeDate', () => {
    it('returns "Today" for today', () => {
      expect(getRelativeDate(TODAY)).toBe('Today');
    });

    it('returns a formatted date for far-future dates', () => {
      const result = getRelativeDate('2099-12-31');
      expect(result).toBe('Dec 31, 2099');
    });
  });

  describe('getGreeting', () => {
    it('returns a non-empty string', () => {
      const greeting = getGreeting();
      expect(['Good Morning', 'Good Afternoon', 'Good Evening']).toContain(greeting);
    });
  });
});
