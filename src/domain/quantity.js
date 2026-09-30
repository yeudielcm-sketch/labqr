// Quantities are integers in hundredths of the unit (qty 250 = 2.50). Convert only at the edges.

export const UNITS = ['pz', 'ml', 'l', 'g', 'kg'];

// "2.5", "2,5", " 3 " → 250, 250, 300. Returns null for anything that is not a non-negative number.
export function parseQty(text) {
  const s = String(text ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [int, dec = ''] = s.split('.');
  return Number(int) * 100 + Number(dec.padEnd(2, '0'));
}

// 250 → "2.5", 1800 → "18", 1234567 → "12,345.67"
export function formatQty(qty) {
  return (qty / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

export function formatQtyUnit(qty, unit) {
  return `${formatQty(qty)} ${unit}`;
}
