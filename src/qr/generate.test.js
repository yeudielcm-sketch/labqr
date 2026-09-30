import { describe, expect, it } from 'vitest';
import { itemUrl, qrSvg } from './generate.js';
import { extractCode } from '../domain/codes.js';

describe('QR content', () => {
  it('points to the item card under the Pages base path', () => {
    const url = itemUrl('QUI-0007', 'https://yeudielcm-sketch.github.io', '/labqr/');
    expect(url).toBe('https://yeudielcm-sketch.github.io/labqr/#/i/QUI-0007');
    expect(extractCode(url)).toBe('QUI-0007');
  });

  it('renders an SVG', () => {
    expect(qrSvg('https://x.test/#/i/BIO-0001')).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });
});
