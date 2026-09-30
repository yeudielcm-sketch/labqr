// Loan (vale) state derived from its movements (SPEC §4). Pure: no DOM, no Dexie.

const DAY = 24 * 60 * 60 * 1000;

// Per item in the loan: how much went out and what happened to it.
export function loanLines(loanId, movements) {
  const lines = new Map();
  for (const m of movements) {
    if (m.loanId !== loanId) continue;
    if (!lines.has(m.itemId)) lines.set(m.itemId, { itemId: m.itemId, lent: 0, returned: 0, lost: 0, consumed: 0 });
    const l = lines.get(m.itemId);
    if (m.type === 'LEND') l.lent += m.qty;
    if (m.type === 'RETURN') l.returned += m.qty;
    if (m.type === 'LOSS') l.lost += m.qty;
    if (m.type === 'CONSUME') l.consumed += m.qty;
  }
  return [...lines.values()].map((l) => ({ ...l, pending: l.lent - l.returned - l.lost - l.consumed }));
}

export function pendingTotal(lines) {
  return lines.reduce((s, l) => s + Math.max(l.pending, 0), 0);
}

// open: something pending; overdue: open and past dueAt; closed: nothing pending.
export function loanStatus(loan, lines, now = Date.now()) {
  if (!loan.confirmedAt) return 'draft';
  if (pendingTotal(lines) === 0) return 'closed';
  return new Date(loan.dueAt).getTime() < now ? 'overdue' : 'open';
}

// Due date: end of the day `days` from `from` (0 = same day), in local time.
export function dueDate(from, days) {
  const d = new Date(from);
  d.setDate(d.getDate() + Math.max(0, days));
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
}

// Seconds from starting the capture to handing out the material (SPEC §8).
export function deliverySeconds(loan) {
  if (!loan.confirmedAt) return null;
  return Math.round((new Date(loan.confirmedAt) - new Date(loan.createdAt)) / 1000);
}

export function daysLate(loan, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(loan.dueAt).getTime()) / DAY));
}

// Lines to lend must be positive and never more than what is in the lab.
// Returns a list of { itemId, reason } problems (empty = ok).
export function validateLines(lines, onHandById) {
  const problems = [];
  if (!lines.length) problems.push({ itemId: null, reason: 'empty' });
  for (const l of lines) {
    if (!(l.qty > 0)) problems.push({ itemId: l.itemId, reason: 'qty' });
    else if (l.qty > (onHandById[l.itemId] ?? 0)) problems.push({ itemId: l.itemId, reason: 'stock' });
  }
  return problems;
}

// Physical count → the ADJUST quantity that makes onHand match (signed).
export function adjustmentFor(onHand, counted) {
  return counted - onHand;
}
