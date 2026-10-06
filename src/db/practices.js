// Practices (F6): stored material lists that pre-fill a loan.
import { db } from './schema.js';
import { practiceProblems } from '../domain/practices.js';

const now = () => new Date().toISOString();

export async function listPractices({ includeArchived = false } = {}) {
  const all = await db.practices.toArray();
  return all
    .filter((p) => includeArchived || !p.archived)
    .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { numeric: true }));
}

export function getPractice(id) {
  return db.practices.get(id);
}

// Returns the saved practice, or { problem } if it is not valid.
export async function savePractice({ id, name, teacher, labId, items }) {
  const practice = { name: name.trim(), teacher: teacher?.trim() || '', labId, items };
  const problem = practiceProblems(practice);
  if (problem) return { problem };
  if (id) {
    await db.practices.update(id, { ...practice, updatedAt: now() });
    return { practice: { id, ...practice } };
  }
  const created = { id: crypto.randomUUID(), ...practice, archived: false, createdAt: now(), updatedAt: now() };
  await db.practices.add(created);
  return { practice: created };
}

// Practices are only a template (no movements point to them), so archiving is enough to hide one.
export async function setPracticeArchived(id, archived) {
  await db.practices.update(id, { archived, updatedAt: now() });
}
