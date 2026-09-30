// Quantities are integers in hundredths of the unit (qty 250 = 2.50). Convert only at the edges.

export const UNITS = ['pz', 'ml', 'l', 'g', 'kg'];

// "2.5", "2,5", " 3 ", "1,000", "1,320.5" → 250, 250, 300, 100000, 132050.
// A comma followed by groups of exactly 3 digits is a thousands separator (es-MX display);
// otherwise a single comma is a decimal comma. Returns null for anything that is not a non-negative number.
export function parseQty(text) {
  let s = String(text ?? '').trim();
  s = /^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [int, dec = ''] = s.split('.');
  return Number(int) * 100 + Number(dec.padEnd(2, '0'));
}

// 250 → "2.5", 1800 → "18", 1234567 → "12,345.67"
export function formatQty(qty) {
  return (qty / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

// For input fields: no thousands separator, so the value can be edited and read back.
export function formatQtyInput(qty) {
  return String(qty / 100);
}

export function formatQtyUnit(qty, unit) {
  return `${formatQty(qty)} ${unit}`;
}
