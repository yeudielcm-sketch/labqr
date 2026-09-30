import { describe, expect, it } from 'vitest';
import { adjustmentFor, deliverySeconds, dueDate, loanLines, loanStatus, validateLines } from './loans.js';

const mv = (type, itemId, qty, loanId = 'L1') => ({ type, itemId, qty, loanId });

describe('loanLines and loanStatus', () => {
  const loan = { id: 'L1', createdAt: '2026-10-01T15:00:00Z', confirmedAt: '2026-10-01T15:00:40Z', dueAt: '2026-10-01T23:59:00Z' };

  it('tracks pending per item across return, loss and consumption', () => {
    const lines = loanLines('L1', [
      mv('LEND', 'probeta', 400), mv('RETURN', 'probeta', 200), mv('LOSS', 'probeta', 100),
      mv('LEND', 'hcl', 5000), mv('CONSUME', 'hcl', 5000),
      mv('LEND', 'otro', 100, 'L2'),
    ]);
    expect(lines).toEqual([
      { itemId: 'probeta', lent: 400, returned: 200, lost: 100, consumed: 0, pending: 100 },
      { itemId: 'hcl', lent: 5000, returned: 0, lost: 0, consumed: 5000, pending: 0 },
    ]);
  });

  it('is open, overdue or closed', () => {
    const open = loanLines('L1', [mv('LEND', 'a', 100)]);
    const done = loanLines('L1', [mv('LEND', 'a', 100), mv('RETURN', 'a', 100)]);
    expect(loanStatus(loan, open, new Date('2026-10-01T20:00:00Z').getTime())).toBe('open');
    expect(loanStatus(loan, open, new Date('2026-10-02T08:00:00Z').getTime())).toBe('overdue');
    expect(loanStatus(loan, done, new Date('2026-10-05T08:00:00Z').getTime())).toBe('closed');
    expect(loanStatus({ ...loan, confirmedAt: null }, open)).toBe('draft');
  });

  it('measures delivery time in seconds', () => {
    expect(deliverySeconds(loan)).toBe(40);
  });
});

describe('dueDate', () => {
  it('ends the same day for 0 days and adds days otherwise', () => {
    const from = new Date(2026, 9, 1, 10, 30);
    const same = new Date(dueDate(from, 0));
    expect([same.getDate(), same.getHours(), same.getMinutes()]).toEqual([1, 23, 59]);
    expect(new Date(dueDate(from, 3)).getDate()).toBe(4);
  });
});

describe('validateLines', () => {
  it('rejects empty loans, zero quantities and more than what is in the lab', () => {
    expect(validateLines([], {})).toEqual([{ itemId: null, reason: 'empty' }]);
    expect(validateLines([{ itemId: 'a', qty: 0 }], { a: 500 })).toEqual([{ itemId: 'a', reason: 'qty' }]);
    expect(validateLines([{ itemId: 'a', qty: 600 }], { a: 500 })).toEqual([{ itemId: 'a', reason: 'stock' }]);
    expect(validateLines([{ itemId: 'a', qty: 500 }], { a: 500 })).toEqual([]);
  });
});

describe('adjustmentFor', () => {
  it('returns the signed difference to the physical count', () => {
    expect(adjustmentFor(1200, 1150)).toBe(-50);
    expect(adjustmentFor(1200, 1300)).toBe(100);
  });
});
