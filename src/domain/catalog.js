// Search and filters for the item list. Pure: receives plain objects, returns plain objects.
import { EMPTY_STOCK, isExpired, isExpiringSoon, isLowStock } from './stock.js';

export const KINDS = ['equipment', 'material', 'reagent'];

// Lowercase and strip accents so "matraz" finds "Matraz" and "etilico" finds "etílico".
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesQuery(item, query) {
  const q = normalize(query);
  if (!q) return true;
  const haystack = [item.name, item.code, item.serial, item.notes, ...Object.keys(item.extra ?? {}), ...Object.values(item.extra ?? {})]
    .map(normalize)
    .join(' ');
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

// filters: { q, labId, locationId, kind, low, expiring }
export function filterItems(items, stocks, filters = {}, now = Date.now()) {
  return items
    .filter((item) => !item.archived || filters.archived)
    .filter((item) => !filters.labId || item.labId === filters.labId)
    .filter((item) => !filters.locationId || item.locationId === filters.locationId)
    .filter((item) => !filters.kind || item.kind === filters.kind)
    .filter((item) => !filters.low || isLowStock(item, stocks[item.id] ?? EMPTY_STOCK))
    .filter((item) => !filters.expiring || isExpiringSoon(item, now) || isExpired(item, now))
    .filter((item) => matchesQuery(item, filters.q))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
