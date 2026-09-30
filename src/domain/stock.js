// Stock is derived from the append-only ledger (SPEC §4). Nothing here touches the DOM or Dexie.
//
// Clarification of SPEC §4: LOSS and CONSUME tied to a loan (loanId set) happen while the
// item is out, so they reduce `lentOut`, not `onHand`. Without a loanId they reduce `onHand`.
// ADJUST carries a signed qty.

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRING_DAYS = 30;

export function stockOf(movements) {
  let onHand = 0;
  let lentOut = 0;
  for (const m of movements) {
    switch (m.type) {
      case 'RECEIVE': onHand += m.qty; break;
      case 'LEND': onHand -= m.qty; lentOut += m.qty; break;
      case 'RETURN': onHand += m.qty; lentOut -= m.qty; break;
      case 'CONSUME':
      case 'LOSS':
        if (m.loanId) lentOut -= m.qty;
        else onHand -= m.qty;
        break;
      case 'ADJUST': onHand += m.qty; break;
    }
  }
  return { onHand, lentOut, total: onHand + lentOut };
}

export function isLowStock(item, stock) {
  return item.minStock > 0 && stock.onHand < item.minStock;
}

export function isExpired(item, now = Date.now()) {
  return Boolean(item.expiresAt) && new Date(item.expiresAt).getTime() < now;
}

export function isExpiringSoon(item, now = Date.now()) {
  if (!item.expiresAt || isExpired(item, now)) return false;
  return new Date(item.expiresAt).getTime() - now <= EXPIRING_DAYS * DAY;
}

// Groups a flat movement list by itemId → { [itemId]: stock }.
export function stockByItem(movements) {
  const groups = new Map();
  for (const m of movements) {
    if (!groups.has(m.itemId)) groups.set(m.itemId, []);
    groups.get(m.itemId).push(m);
  }
  const out = {};
  for (const [itemId, list] of groups) out[itemId] = stockOf(list);
  return out;
}

export const EMPTY_STOCK = Object.freeze({ onHand: 0, lentOut: 0, total: 0 });
