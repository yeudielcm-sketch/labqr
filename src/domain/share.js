// Passing tasks and requests between phones inside a QR (F7, no server). The whole content
// travels in the QR as compact JSON in base64url, so the phone that reads it needs no data.
// Items are referred to by their printed code (QUI-0007), the same on every device that
// shares the lab's catalog. Pure: no DOM, no Dexie.
import { isValidCode } from './codes.js';

export const SHARE_VERSION = 1;
export const MAX_LINES = 25;
const NAME_MAX = 40;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(data) {
  try {
    const b64 = String(data).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

// Finds a shared task or request in what a scanner read (a full URL or just the hash part).
export function findShare(scanned) {
  const m = /#\/([tr])\/([A-Za-z0-9_-]+)/.exec(String(scanned ?? ''));
  return m ? { kind: m[1], data: m[2] } : null;
}

// Task → QR: practice, group, date, notes and the material with names (the student's phone
// may have no catalog at all).
export function taskToShare(task, practice, itemsById) {
  const l = (practice?.items ?? [])
    .map(({ itemId, qty }) => itemsById[itemId] && [itemsById[itemId].code, qty, text(itemsById[itemId].name, NAME_MAX), itemsById[itemId].unit])
    .filter(Boolean)
    .slice(0, MAX_LINES);
  return { v: SHARE_VERSION, k: 't', p: text(practice?.name, 80), m: text(practice?.teacher, 60), g: task.group, d: task.date, n: text(task.notes, 200), l };
}

const linesOk = (l, withNames) =>
  Array.isArray(l) && l.length > 0 && l.length <= MAX_LINES
  && l.every((x) => Array.isArray(x) && isValidCode(x[0]) && Number.isInteger(x[1]) && x[1] > 0 && (!withNames || typeof x[2] === 'string'));

// Returns a clean task, or null if the QR is not a C-Lab task.
export function readTaskShare(obj) {
  if (obj?.v !== SHARE_VERSION || obj.k !== 't' || !linesOk(obj.l, true)) return null;
  if (!text(obj.p, 80) || !/^\d{4}-\d{2}-\d{2}$/.test(obj.d ?? '')) return null;
  return {
    practice: text(obj.p, 80), teacher: text(obj.m, 60), group: text(obj.g, 20), date: obj.d, notes: text(obj.n, 200),
    lines: obj.l.map(([code, qty, name, unit]) => ({ code, qty, name: text(name, NAME_MAX), unit: text(unit, 4) || 'pz' })),
  };
}

// Request → QR: who asks, for which task, and the material by code (the lab phone has the catalog).
export function requestToShare({ id, task, name, studentId, group, lines }) {
  return {
    v: SHARE_VERSION, k: 'r', i: id, p: task.practice, g: task.group, d: task.date,
    s: text(name, 60), c: text(String(studentId ?? ''), 20), gr: text(group, 20),
    l: lines.map((x) => [x.code, x.qty]),
  };
}

export function readRequestShare(obj) {
  if (obj?.v !== SHARE_VERSION || obj.k !== 'r' || !SAFE_ID.test(obj.i ?? '') || !linesOk(obj.l, false)) return null;
  if (!text(obj.s, 60) || !text(obj.c, 20)) return null;
  return {
    id: obj.i, practice: text(obj.p, 80), taskGroup: text(obj.g, 20), date: typeof obj.d === 'string' ? obj.d : '',
    name: text(obj.s, 60), studentId: text(obj.c, 20), group: text(obj.gr, 20),
    lines: obj.l.map(([code, qty]) => ({ code, qty })),
  };
}

// Codes → this device's items. Archived or unknown codes are reported, never guessed.
export function linesByCode(lines, items) {
  const byCode = Object.fromEntries(items.filter((i) => !i.archived).map((i) => [i.code, i]));
  const out = [];
  const missing = [];
  for (const { code, qty } of lines) {
    if (byCode[code]) out.push({ itemId: byCode[code].id, qty });
    else missing.push(code);
  }
  return { lines: out, missing };
}
