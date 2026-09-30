import { describe, expect, it } from 'vitest';
import { filterItems, matchesQuery } from './catalog.js';

const items = [
  { id: '1', name: 'Alcohol etílico', code: 'QUI-0001', kind: 'reagent', labId: 'q', locationId: 'q1', minStock: 100000, expiresAt: '2026-10-10', extra: { concentración: '96%' } },
  { id: '2', name: 'Microscopio', code: 'BIO-0001', kind: 'equipment', labId: 'b', locationId: 'b1', minStock: 0, serial: 'MX-778', extra: { marca: 'Velab' } },
  { id: '3', name: 'Matraz Erlenmeyer', code: 'QUI-0002', kind: 'material', labId: 'q', locationId: 'q2', minStock: 500, extra: {} },
  { id: '4', name: 'Pinzas viejas', code: 'QUI-0003', kind: 'material', labId: 'q', locationId: 'q2', minStock: 0, archived: true, extra: {} },
];
const stocks = { 1: { onHand: 50000 }, 2: { onHand: 100 }, 3: { onHand: 800 } };
const now = new Date('2026-10-01T12:00:00Z').getTime();
const names = (list) => list.map((i) => i.name);

describe('matchesQuery', () => {
  it('ignores accents and case, and searches code, serial and extra fields', () => {
    expect(matchesQuery(items[0], 'etilico')).toBe(true);
    expect(matchesQuery(items[0], '96%')).toBe(true);
    expect(matchesQuery(items[1], 'mx-778')).toBe(true);
    expect(matchesQuery(items[1], 'velab')).toBe(true);
    expect(matchesQuery(items[2], 'qui-0002')).toBe(true);
    expect(matchesQuery(items[2], 'matraz vaso')).toBe(false);
  });
});

describe('filterItems', () => {
  it('hides archived items and sorts by name', () => {
    expect(names(filterItems(items, stocks, {}, now))).toEqual(['Alcohol etílico', 'Matraz Erlenmeyer', 'Microscopio']);
  });

  it('filters by lab, location and kind', () => {
    expect(names(filterItems(items, stocks, { labId: 'q' }, now))).toEqual(['Alcohol etílico', 'Matraz Erlenmeyer']);
    expect(names(filterItems(items, stocks, { locationId: 'b1' }, now))).toEqual(['Microscopio']);
    expect(names(filterItems(items, stocks, { kind: 'material' }, now))).toEqual(['Matraz Erlenmeyer']);
  });

  it('filters low stock and expiring', () => {
    expect(names(filterItems(items, stocks, { low: true }, now))).toEqual(['Alcohol etílico']);
    expect(names(filterItems(items, stocks, { expiring: true }, now))).toEqual(['Alcohol etílico']);
  });
});
