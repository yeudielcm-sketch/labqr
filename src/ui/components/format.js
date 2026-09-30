// Display helpers: dates in Mexico's format, relative wording.
const DAY = 24 * 60 * 60 * 1000;

export function formatDate(iso) {
  if (!iso) return '';
  // Date-only strings (YYYY-MM-DD) are calendar dates: show them without timezone shifts.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function daysUntil(isoDate, now = Date.now()) {
  return Math.ceil((new Date(`${isoDate}T23:59:59`).getTime() - now) / DAY);
}

export function relativeDays(isoDate) {
  const d = daysUntil(isoDate);
  if (d < 0) return `hace ${-d} ${d === -1 ? 'día' : 'días'}`;
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  return `en ${d} días`;
}
