import { describe, expect, it } from 'vitest';
import { ILLUSTRATION_KEYS, illustrationKey, illustrationSvg } from './illustrations.js';
import { buildDemo } from '../../db/seed.js';

describe('item illustrations (F8)', () => {
  it('matches names without caring about accents or case', () => {
    expect(illustrationKey({ name: 'Vaso de precipitado 250 ml', kind: 'material' })).toBe('beaker');
    expect(illustrationKey({ name: 'MATRAZ Erlenmeyer', kind: 'material' })).toBe('flask');
    expect(illustrationKey({ name: 'Microscopio estereoscópico', kind: 'equipment' })).toBe('stereo');
    expect(illustrationKey({ name: 'Microscopio óptico compuesto', kind: 'equipment' })).toBe('microscope');
    expect(illustrationKey({ name: 'Potenciómetro (medidor de pH)', kind: 'equipment' })).toBe('phMeter');
  });

  it('falls back by kind: liquid reagent = bottle, solid = jar, equipment = device', () => {
    expect(illustrationKey({ name: 'Lugol', kind: 'reagent', unit: 'ml' })).toBe('bottle');
    expect(illustrationKey({ name: 'Cloruro de sodio', kind: 'reagent', unit: 'g' })).toBe('jar');
    expect(illustrationKey({ name: 'Centrífuga', kind: 'equipment' })).toBe('device');
    expect(illustrationKey({ name: 'Gradilla', kind: 'material' })).toBe('beaker');
    expect(illustrationKey({})).toBe('beaker');
  });

  it('gives every demo item a drawing', () => {
    for (const item of buildDemo().items) {
      expect(ILLUSTRATION_KEYS).toContain(illustrationKey(item));
      expect(illustrationSvg(item)).toMatch(/^<svg/);
    }
  });
});
