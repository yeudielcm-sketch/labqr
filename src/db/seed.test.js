import { describe, expect, it } from 'vitest';
import { buildDemo } from './seed.js';
import { isExpired, isExpiringSoon, isLowStock, stockByItem } from '../domain/stock.js';

describe('buildDemo', () => {
  const demo = buildDemo();
  const stocks = stockByItem(demo.movements);

  it('matches SPEC §7: 2 labs, 3+ locations each, ~30 items, 5 borrowers, 3 loans', () => {
    expect(demo.labs.map((l) => l.prefix)).toEqual(['QUI', 'BIO']);
    for (const lab of demo.labs) expect(demo.locations.filter((l) => l.labId === lab.id).length).toBeGreaterThanOrEqual(3);
    expect(demo.items.length).toBeGreaterThanOrEqual(30);
    expect(demo.borrowers).toHaveLength(5);
    expect(demo.loans).toHaveLength(3);
  });

  it('keeps a consistent ledger: unique codes, no negative stock', () => {
    expect(new Set(demo.items.map((i) => i.code)).size).toBe(demo.items.length);
    for (const item of demo.items) {
      expect(stocks[item.id].onHand).toBeGreaterThanOrEqual(0);
      expect(stocks[item.id].lentOut).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes something low, something expiring and something expired', () => {
    expect(demo.items.some((i) => isLowStock(i, stocks[i.id]))).toBe(true);
    expect(demo.items.some((i) => isExpiringSoon(i))).toBe(true);
    expect(demo.items.some((i) => isExpired(i))).toBe(true);
  });

  it('equipment is always a single piece', () => {
    for (const item of demo.items.filter((i) => i.kind === 'equipment')) {
      expect(item.unit).toBe('pz');
      expect(stocks[item.id].total).toBe(100);
    }
  });
});

describe('demo tasks and requests (F7)', () => {
  it('point to demo practices and pass validation', async () => {
    const { taskProblems, visibleTasks } = await import('../domain/tasks.js');
    const { requestProblems } = await import('../domain/requests.js');
    const demo = buildDemo();
    const practiceIds = new Set(demo.practices.map((p) => p.id));
    expect(demo.tasks).toHaveLength(3);
    for (const task of demo.tasks) {
      expect(taskProblems(task)).toBe(null);
      expect(practiceIds.has(task.practiceId)).toBe(true);
    }
    expect(visibleTasks(demo.tasks, { group: '4A' })).toHaveLength(2);
    expect(demo.requests.map((r) => r.status)).toEqual(['pending']);
    expect(requestProblems(demo.requests[0])).toBe(null);
  });
});

describe('demo practices', () => {
  it('reference real demo items and pass validation', async () => {
    const { practiceProblems, linesFromPractice } = await import('../domain/practices.js');
    const demo = buildDemo();
    const itemsById = Object.fromEntries(demo.items.map((i) => [i.id, i]));
    expect(demo.practices).toHaveLength(3);
    for (const p of demo.practices) {
      expect(practiceProblems(p)).toBe(null);
      expect(linesFromPractice(p, itemsById, {}).missing).toEqual([]);
    }
  });
});
