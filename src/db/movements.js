// Every quantity change is a new movement (append-only ledger). Loans group LEND/RETURN/LOSS/CONSUME.
import { db } from './schema.js';
import { stockOf } from '../domain/stock.js';
import { adjustmentFor, borrowerProblems, loanLines, loanStatus, pendingTotal, splitReagentReturn, validateLines } from '../domain/loans.js';
import { canDecide } from '../domain/requests.js';

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

async function onHandOf(itemId) {
  return stockOf(await db.movements.where('itemId').equals(itemId).toArray()).onHand;
}

// ---- Item movements outside loans ----

export async function receive(itemId, qty, note) {
  await db.movements.add({ id: newId(), itemId, type: 'RECEIVE', qty, note: note || null, createdAt: now() });
}

export async function registerLoss(itemId, qty, reason, note) {
  return db.transaction('rw', db.movements, async () => {
    if (qty > (await onHandOf(itemId))) return false;
    await db.movements.add({ id: newId(), itemId, type: 'LOSS', qty, reason, note: note || null, createdAt: now() });
    return true;
  });
}

// Physical count: stores the difference as ADJUST. A note is mandatory (SPEC §3).
export async function adjustToCount(itemId, counted, note) {
  return db.transaction('rw', db.movements, async () => {
    const qty = adjustmentFor(await onHandOf(itemId), counted);
    if (qty === 0) return 0;
    await db.movements.add({ id: newId(), itemId, type: 'ADJUST', qty, note, createdAt: now() });
    return qty;
  });
}

// ---- Borrowers ----

export async function listBorrowers() {
  return (await db.borrowers.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
}

export async function createBorrower({ name, type, group, studentId }) {
  if (borrowerProblems({ name, type, studentId })) return null;
  const b = { id: newId(), name, type, group: group || '', studentId: studentId || '', createdAt: now() };
  await db.borrowers.add(b);
  return b;
}

// ---- Loans ----

// Writes the loan and its LEND movements in one transaction. `createdAt` is when the
// capture started (SPEC §8); confirmedAt is now. With `requestId` (F7), the student's request
// is approved in the same transaction, so there is never a loan without its request or the reverse.
export async function confirmLoan({ borrowerId, labId, practice, practiceId = null, requestId = null, createdAt, dueAt, lines }) {
  return db.transaction('rw', db.loans, db.movements, db.borrowers, db.requests, async () => {
    if (!borrowerId || !(await db.borrowers.get(borrowerId))) return { ok: false, problems: [{ itemId: null, reason: 'borrower' }] };
    if (requestId && !canDecide(await db.requests.get(requestId))) return { ok: false, problems: [{ itemId: null, reason: 'request' }] };
    const onHand = {};
    for (const l of lines) onHand[l.itemId] = await onHandOf(l.itemId);
    const problems = validateLines(lines, onHand);
    if (problems.length) return { ok: false, problems };
    const confirmedAt = now();
    const loan = { id: newId(), borrowerId, labId, practice: practice || '', practiceId, createdAt, confirmedAt, dueAt };
    if (requestId) loan.requestId = requestId;
    await db.loans.add(loan);
    await db.movements.bulkAdd(
      lines.map((l) => ({ id: newId(), itemId: l.itemId, type: 'LEND', qty: l.qty, loanId: loan.id, borrowerId, createdAt: confirmedAt })),
    );
    if (requestId) await db.requests.update(requestId, { status: 'approved', loanId: loan.id, decidedAt: confirmedAt });
    return { ok: true, loan };
  });
}

// RETURN / LOSS / CONSUME against a loan line. Closes the loan when nothing is pending.
export async function settleLine(loanId, itemId, type, qty, extra = {}) {
  return db.transaction('rw', db.loans, db.movements, async () => {
    const loan = await db.loans.get(loanId);
    const line = loanLines(loanId, await db.movements.where('loanId').equals(loanId).toArray()).find((l) => l.itemId === itemId);
    if (!loan || !line || qty <= 0 || qty > line.pending) return false;
    await db.movements.add({ id: newId(), itemId, type, qty, loanId, borrowerId: loan.borrowerId, ...extra, createdAt: now() });
    const after = loanLines(loanId, await db.movements.where('loanId').equals(loanId).toArray());
    if (pendingTotal(after) === 0) await db.loans.update(loanId, { closedAt: now() });
    return true;
  });
}

export async function loadLoans() {
  const [loans, borrowers, movements] = await Promise.all([db.loans.toArray(), db.borrowers.toArray(), db.movements.where('loanId').above('').toArray()]);
  const byId = Object.fromEntries(borrowers.map((b) => [b.id, b]));
  return loans
    .map((loan) => {
      const lines = loanLines(loan.id, movements);
      return { loan, borrower: byId[loan.borrowerId], lines, status: loanStatus(loan, lines) };
    })
    .sort((a, b) => b.loan.createdAt.localeCompare(a.loan.createdAt));
}

export async function getLoan(id) {
  const loan = await db.loans.get(id);
  if (!loan) return null;
  const movements = await db.movements.where('loanId').equals(id).toArray();
  const lines = loanLines(id, movements);
  const [borrower, items, lab] = await Promise.all([
    db.borrowers.get(loan.borrowerId),
    db.items.bulkGet(lines.map((l) => l.itemId)),
    db.labs.get(loan.labId),
  ]);
  return {
    loan,
    borrower,
    lab,
    status: loanStatus(loan, lines),
    lines: lines.map((l, i) => ({ ...l, item: items[i] })).sort((a, b) => a.item.code.localeCompare(b.item.code)),
    movements: movements.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

// Reagent back from a practice in one step (F6): `returned` goes back to the lab and the rest
// of what was pending is recorded as consumed, in a single transaction.
export async function settleReagent(loanId, itemId, returned) {
  return db.transaction('rw', db.loans, db.movements, async () => {
    const loan = await db.loans.get(loanId);
    const line = loanLines(loanId, await db.movements.where('loanId').equals(loanId).toArray()).find((l) => l.itemId === itemId);
    const split = line && splitReagentReturn(line.pending, returned);
    if (!loan || !split || line.pending <= 0) return false;
    const createdAt = now();
    const base = { itemId, loanId, borrowerId: loan.borrowerId, createdAt };
    if (split.returned > 0) await db.movements.add({ id: newId(), type: 'RETURN', qty: split.returned, ...base });
    if (split.consumed > 0) await db.movements.add({ id: newId(), type: 'CONSUME', qty: split.consumed, ...base });
    const after = loanLines(loanId, await db.movements.where('loanId').equals(loanId).toArray());
    if (pendingTotal(after) === 0) await db.loans.update(loanId, { closedAt: now() });
    return split;
  });
}
