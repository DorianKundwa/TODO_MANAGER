/**
 * Tests for the ID generator utility.
 */

import { generateId } from '../../utils/idGenerator';

describe('idGenerator', () => {
  it('should generate a unique ID', () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('should generate different IDs on subsequent calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
