import { describe, expect, it } from 'vitest';
import { formatQty, parseQty } from './quantity.js';

describe('quantity', () => {
  it('parses decimal text into hundredths', () => {
    expect(parseQty('2.5')).toBe(250);
    expect(parseQty('2,5')).toBe(250);
    expect(parseQty(' 18 ')).toBe(1800);
    expect(parseQty('0.05')).toBe(5);
    expect(parseQty('1.')).toBe(100);
  });

  it('rejects invalid input', () => {
    expect(parseQty('')).toBe(null);
    expect(parseQty('-1')).toBe(null);
    expect(parseQty('1.234')).toBe(null);
    expect(parseQty('abc')).toBe(null);
  });

  it('formats hundredths for display', () => {
    expect(formatQty(250)).toBe('2.5');
    expect(formatQty(1800)).toBe('18');
    expect(formatQty(5)).toBe('0.05');
  });
});
