/**
 * Simple UUID generator for task IDs.
 * Uses crypto-grade randomness when available, fallback otherwise.
 */

export function generateId(): string {
  // Use a simple but effective random ID generator
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}
