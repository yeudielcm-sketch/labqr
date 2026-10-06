import { describe, expect, it } from 'vitest';
import { linesFromPractice, mergeLines, practiceProblems } from './practices.js';
import { borrowerProblems, splitReagentReturn } from './loans.js';

const items = {
  vaso: { id: 'vaso', kind: 'material' },
  hcl: { id: 'hcl', kind: 'reagent' },
  balanza: { id: 'balanza', kind: 'equipment' },
  viejo: { id: 'viejo', kind: 'material', archived: true },
};

describe('linesFromPractice', () => {
  it('fills lines, flags what is short and skips archived or deleted items', () => {
    const practice = { items: [
      { itemId: 'vaso', qty: 400 }, { itemId: 'hcl', qty: 5000 }, { itemId: 'balanza', qty: 300 },
      { itemId: 'viejo', qty: 100 }, { itemId: 'borrado', qty: 100 },
    ] };
    const r = linesFromPractice(practice, items, { vaso: 2300, hcl: 3000, balanza: 100 });
    expect(r.lines).toEqual([{ itemId: 'vaso', qty: 400 }, { itemId: 'hcl', qty: 5000 }, { itemId: 'balanza', qty: 100 }]);
    expect(r.short).toEqual([{ itemId: 'hcl', want: 5000, available: 3000 }]);
    expect(r.missing).toEqual(['viejo', 'borrado']);
  });
});

describe('mergeLines', () => {
  it('adds quantities of the same item but keeps equipment at one piece', () => {
    const merged = mergeLines([{ itemId: 'vaso', qty: 100 }, { itemId: 'balanza', qty: 100 }], [{ itemId: 'vaso', qty: 400 }, { itemId: 'balanza', qty: 100 }, { itemId: 'hcl', qty: 5000 }], items);
    expect(merged).toEqual([{ itemId: 'vaso', qty: 500 }, { itemId: 'balanza', qty: 100 }, { itemId: 'hcl', qty: 5000 }]);
  });
});

describe('practiceProblems', () => {
  it('needs a name and positive quantities', () => {
    expect(practiceProblems({ name: ' ', items: [{ itemId: 'a', qty: 1 }] })).toBe('name');
    expect(practiceProblems({ name: 'X', items: [] })).toBe('empty');
    expect(practiceProblems({ name: 'X', items: [{ itemId: 'a', qty: 0 }] })).toBe('qty');
    expect(practiceProblems({ name: 'X', items: [{ itemId: 'a', qty: 100 }] })).toBe(null);
  });
});

describe('splitReagentReturn', () => {
  it('what did not come back counts as consumed', () => {
    expect(splitReagentReturn(5000, 1200)).toEqual({ returned: 1200, consumed: 3800 });
    expect(splitReagentReturn(5000, 0)).toEqual({ returned: 0, consumed: 5000 });
    expect(splitReagentReturn(5000, 5000)).toEqual({ returned: 5000, consumed: 0 });
    expect(splitReagentReturn(5000, 6000)).toBe(null);
    expect(splitReagentReturn(5000, null)).toBe(null);
  });
});

describe('borrowerProblems', () => {
  it('students must give their control number', () => {
    expect(borrowerProblems({ name: 'Ana', type: 'student', studentId: '' })).toBe('studentId');
    expect(borrowerProblems({ name: 'Ana', type: 'student', studentId: '21308050123' })).toBe(null);
    expect(borrowerProblems({ name: 'Equipo 4', type: 'team' })).toBe(null);
    expect(borrowerProblems({ name: '', type: 'teacher' })).toBe('name');
  });
});
