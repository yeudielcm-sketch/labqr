// Practices (F6): a teacher's material list that pre-fills a loan. Pure functions.

// Turns a practice into loan lines. Items that are archived or gone are reported as `missing`;
// lines asking for more than is in the lab stay in `lines` and are reported in `short`
// (the loan screen marks them in red so the lab staff decides).
export function linesFromPractice(practice, itemsById, onHandById) {
  const lines = [];
  const short = [];
  const missing = [];
  for (const { itemId, qty } of practice.items ?? []) {
    const item = itemsById[itemId];
    if (!item || item.archived) {
      missing.push(itemId);
      continue;
    }
    const want = item.kind === 'equipment' ? 100 : qty;
    lines.push({ itemId, qty: want });
    const available = onHandById[itemId] ?? 0;
    if (want > available) short.push({ itemId, want, available });
  }
  return { lines, short, missing };
}

// Adds lines to a loan draft: same item → quantities add up (equipment stays at one piece).
export function mergeLines(current, added, itemsById) {
  const out = current.map((l) => ({ ...l }));
  for (const a of added) {
    const existing = out.find((l) => l.itemId === a.itemId);
    if (!existing) out.push({ ...a });
    else if (itemsById[a.itemId]?.kind !== 'equipment') existing.qty += a.qty;
  }
  return out;
}

// A practice needs a name and at least one item with a positive quantity.
export function practiceProblems(practice) {
  if (!practice.name?.trim()) return 'name';
  if (!practice.items?.length) return 'empty';
  if (practice.items.some((i) => !(i.qty > 0))) return 'qty';
  return null;
}
