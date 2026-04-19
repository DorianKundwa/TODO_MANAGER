/**
 * Tests for the ID generator utility.
 */

import { generateId } from '../../utils/idGenerator';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    // All 100 generated IDs should be unique
    expect(ids.size).toBe(100);
  });

  it('matches expected format (timestamp-random-random)', () => {
    const id = generateId();
    const parts = id.split('-');
    expect(parts.length).toBe(3);
  });
});
