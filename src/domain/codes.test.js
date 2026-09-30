import { describe, expect, it } from 'vitest';
import { extractCode, formatCode, isValidCode, nextCode } from './codes.js';

describe('codes', () => {
  it('formats with a 4-digit sequence', () => {
    expect(formatCode('qui', 7)).toBe('QUI-0007');
    expect(formatCode('BIO', 12345)).toBe('BIO-12345');
  });

  it('validates codes', () => {
    expect(isValidCode('QUI-0001')).toBe(true);
    expect(isValidCode('qui-0001')).toBe(false);
    expect(isValidCode('QUI-1')).toBe(false);
  });

  it('continues the sequence of its own lab only', () => {
    expect(nextCode('QUI', [])).toBe('QUI-0001');
    expect(nextCode('QUI', ['QUI-0001', 'QUI-0009', 'BIO-0050'])).toBe('QUI-0010');
  });

  it('extracts the code from a scanned URL, a bare code or hand input', () => {
    expect(extractCode('https://x.github.io/labqr/#/i/QUI-0007')).toBe('QUI-0007');
    expect(extractCode('QUI-0007')).toBe('QUI-0007');
    expect(extractCode(' qui 7 ')).toBe('QUI-0007');
    expect(extractCode('bio-12')).toBe('BIO-0012');
    expect(extractCode('hola')).toBe(null);
    expect(extractCode('')).toBe(null);
  });
});
