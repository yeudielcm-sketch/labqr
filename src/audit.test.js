// Regression tests for the independent audit of 30 sep 2026 (findings 1, 2, 7, 8, 9).
// Each one failed before its fix.
import { describe, expect, it } from 'vitest';
import { cylinderSvg } from './ui/components/cylinder.js';
import { formatQty, formatQtyInput, parseQty } from './domain/quantity.js';
import { extractCode } from './domain/codes.js';
import { inventoryCSV, parseInventoryCSV, toCSV, parseCSV } from './io/csv.js';

describe('audit 1: cylinder title is escaped', () => {
  it('does not inject markup from an item name', () => {
    const svg = cylinderSvg({ onHand: 1, title: '"><img src=x onerror=alert(1)>' });
    expect(svg).not.toContain('<img');
    expect(svg).toContain('&quot;&gt;&lt;img');
  });
});

describe('audit 2: what is shown can be read back', () => {
  it('parses thousands separators and never loses a displayed quantity', () => {
    for (const q of [100000, 132000, 150050, 5, 250, 1234567]) {
      expect(parseQty(formatQty(q))).toBe(q);
      expect(parseQty(formatQtyInput(q))).toBe(q);
    }
    expect(formatQtyInput(132000)).toBe('1320');
    expect(parseQty('2,5')).toBe(250);
    expect(parseQty('1,000')).toBe(100000);
    expect(parseQty('1,000.5')).toBe(100050);
  });
});

describe('audit 7: CSV cells cannot become spreadsheet formulas', () => {
  it('neutralizes =, +, @ and - text but keeps negative numbers', () => {
    const rows = parseCSV(toCSV(['a', 'b', 'c'], [['=HYPERLINK("http://x","y")', '@SUM(1)', '-30']]));
    expect(rows[1][0].startsWith("'")).toBe(true);
    expect(rows[1][1].startsWith("'")).toBe(true);
    expect(rows[1][2]).toBe('-30');
    const csv = inventoryCSV([{ id: '1', code: 'QUI-0001', name: '+cmd', kind: 'material', unit: 'pz', minStock: 0 }], {}, {}, {});
    expect(csv).toContain("'+cmd");
  });
});

describe('audit 8: extractCode never throws', () => {
  it('returns null for malformed percent escapes', () => {
    expect(extractCode('50%')).toBe(null);
    expect(extractCode('%E0')).toBe(null);
    expect(extractCode('https://x/#/i/%E0')).toBe(null);
  });
});

describe('audit 9: CSV import', () => {
  it('reports the real spreadsheet line even after blank lines', () => {
    const text = 'laboratorio,prefijo,nombre,tipo\n\nQuímica,QUI,Pinzas,herramienta\n';
    expect(parseInventoryCSV(text).errors[0].line).toBe(3);
  });

  it('rejects impossible dates and equipment with more than one piece', () => {
    const text = 'laboratorio,prefijo,nombre,tipo,cantidad,caducidad\nQuímica,QUI,HCl,reactivo,5,2027-13-45\nQuímica,QUI,Balanza,equipo,3,\n';
    const { rows, errors } = parseInventoryCSV(text);
    expect(rows).toEqual([]);
    expect(errors.map((e) => e.line)).toEqual([2, 3]);
  });
});
