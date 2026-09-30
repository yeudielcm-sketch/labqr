import { describe, expect, it } from 'vitest';
import { isExpired, isExpiringSoon, isLowStock, stockByItem, stockOf } from './stock.js';

const m = (type, qty, extra = {}) => ({ type, qty, itemId: 'a', ...extra });

describe('stockOf', () => {
  it('derives on hand, lent out and total from the ledger', () => {
    const s = stockOf([m('RECEIVE', 2400), m('LEND', 600, { loanId: 'L1' }), m('RETURN', 200, { loanId: 'L1' })]);
    expect(s).toEqual({ onHand: 2000, lentOut: 400, total: 2400 });
  });

  it('a loss inside a loan reduces what is lent, not what is in the lab', () => {
    const s = stockOf([m('RECEIVE', 1000), m('LEND', 300, { loanId: 'L1' }), m('LOSS', 100, { loanId: 'L1' })]);
    expect(s).toEqual({ onHand: 700, lentOut: 200, total: 900 });
  });

  it('a loss or consumption outside a loan reduces the lab', () => {
    const s = stockOf([m('RECEIVE', 50000), m('CONSUME', 2500), m('LOSS', 500)]);
    expect(s.onHand).toBe(47000);
  });

  it('adjust is signed', () => {
    expect(stockOf([m('RECEIVE', 1000), m('ADJUST', -200), m('ADJUST', 50)]).onHand).toBe(850);
  });

  it('groups by item', () => {
    const r = stockByItem([m('RECEIVE', 100), { type: 'RECEIVE', qty: 300, itemId: 'b' }]);
    expect(r.a.onHand).toBe(100);
    expect(r.b.onHand).toBe(300);
  });
});

describe('alerts', () => {
  const now = new Date('2026-10-01T12:00:00Z').getTime();

  it('low stock only when a minimum is set', () => {
    expect(isLowStock({ minStock: 1000 }, { onHand: 900 })).toBe(true);
    expect(isLowStock({ minStock: 1000 }, { onHand: 1000 })).toBe(false);
    expect(isLowStock({ minStock: 0 }, { onHand: 0 })).toBe(false);
  });

  it('expiring soon is within 30 days and not yet expired', () => {
    expect(isExpiringSoon({ expiresAt: '2026-10-20' }, now)).toBe(true);
    expect(isExpiringSoon({ expiresAt: '2027-01-01' }, now)).toBe(false);
    expect(isExpiringSoon({ expiresAt: '2026-09-01' }, now)).toBe(false);
    expect(isExpired({ expiresAt: '2026-09-01' }, now)).toBe(true);
    expect(isExpiringSoon({}, now)).toBe(false);
  });
});
