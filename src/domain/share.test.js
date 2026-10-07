import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare, findShare, linesByCode, MAX_LINES, readRequestShare, readTaskShare, requestToShare, taskToShare } from './share.js';
import { buildDemo } from '../db/seed.js';

const demo = buildDemo();
const itemsById = Object.fromEntries(demo.items.map((i) => [i.id, i]));
const task = demo.tasks[0];
const practice = demo.practices.find((p) => p.id === task.practiceId);

describe('QR share (F7)', () => {
  it('round-trips accents, ñ and symbols through base64url', () => {
    const obj = { a: 'Titulación ácido-base · 4° A ñ', b: [1, 2] };
    const data = encodeShare(obj);
    expect(data).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShare(data)).toEqual(obj);
    expect(decodeShare('%%%')).toBe(null);
  });

  it('finds a task or request in a scanned URL', () => {
    expect(findShare('https://x.github.io/labqr/#/t/abc_-1')).toEqual({ kind: 't', data: 'abc_-1' });
    expect(findShare('https://x.github.io/labqr/#/r/xyz')).toEqual({ kind: 'r', data: 'xyz' });
    expect(findShare('https://x.github.io/labqr/#/i/QUI-0001')).toBe(null);
  });

  it('carries a task with names, so a phone without data can show it', () => {
    const shared = readTaskShare(decodeShare(encodeShare(taskToShare(task, practice, itemsById))));
    expect(shared.practice).toBe('Titulación ácido-base');
    expect(shared.group).toBe('4° A');
    expect(shared.lines.map((l) => l.code)).toEqual(practice.items.map((i) => itemsById[i.itemId].code));
    expect(shared.lines[0].name).toBe('Bureta 50 ml');
  });

  it('carries a request and maps it back to this device by code', () => {
    const shared = readTaskShare(taskToShare(task, practice, itemsById));
    const req = readRequestShare(decodeShare(encodeShare(requestToShare({
      id: 'abc-123', task: shared, name: 'Ana', studentId: '26100000001', group: '4A', lines: shared.lines,
    }))));
    expect(req).toMatchObject({ id: 'abc-123', name: 'Ana', studentId: '26100000001', practice: 'Titulación ácido-base' });
    const mapped = linesByCode([...req.lines, { code: 'ZZZ-9999', qty: 100 }], demo.items);
    expect(mapped.lines.map((l) => l.itemId)).toEqual(practice.items.map((i) => i.itemId));
    expect(mapped.missing).toEqual(['ZZZ-9999']);
  });

  it('rejects QRs that are not C-Lab or are malformed', () => {
    const good = taskToShare(task, practice, itemsById);
    expect(readTaskShare(null)).toBe(null);
    expect(readTaskShare({ ...good, k: 'r' })).toBe(null);
    expect(readTaskShare({ ...good, l: [['QUI-0001', -5, 'x']] })).toBe(null);
    expect(readTaskShare({ ...good, l: [['<script>', 100, 'x']] })).toBe(null);
    expect(readTaskShare({ ...good, l: Array(MAX_LINES + 1).fill(['QUI-0001', 100, 'x']) })).toBe(null);
    const req = requestToShare({ id: 'a', task: readTaskShare(good), name: 'Ana', studentId: '1', group: '', lines: [{ code: 'QUI-0001', qty: 100 }] });
    expect(readRequestShare({ ...req, i: '"><img>' })).toBe(null);
    expect(readRequestShare({ ...req, c: '' })).toBe(null);
  });

  it('keeps the task QR small enough to read from a phone screen', () => {
    const url = `https://yeudielcm-sketch.github.io/labqr/#/t/${encodeShare(taskToShare(task, practice, itemsById))}`;
    expect(url.length).toBeLessThan(700);
  });
});
