// Tasks and requests (F7). A request holds only what was asked for; stock moves when the
// lab staff confirms the loan that the request turns into.
import { db } from './schema.js';
import { groupKey, taskProblems } from '../domain/tasks.js';
import { linesByCode } from '../domain/share.js';
import { canDecide, hasPendingFor, requestProblems, sameStudent, sortRequests } from '../domain/requests.js';

const now = () => new Date().toISOString();

// ---- Tasks ----

export async function listTasks() {
  return db.tasks.toArray();
}

export function getTask(id) {
  return db.tasks.get(id);
}

export async function saveTask({ id, practiceId, group, date, notes }) {
  const task = { practiceId, group: group.trim(), date, notes: notes?.trim() || '' };
  const problem = taskProblems(task);
  if (problem) return { problem };
  if (id) {
    // 0 rows = the task no longer exists (e.g. a backup was restored meanwhile).
    if (!(await db.tasks.update(id, { ...task, updatedAt: now() }))) return { problem: 'notFound' };
    return { task: { id, ...task } };
  }
  const created = { id: crypto.randomUUID(), ...task, archived: false, createdAt: now(), updatedAt: now() };
  await db.tasks.add(created);
  return { task: created };
}

// Requests point to tasks, so a task is archived, never deleted.
export async function setTaskArchived(id, archived) {
  await db.tasks.update(id, { archived, updatedAt: now() });
}

// ---- Requests ----

export async function listRequests() {
  return sortRequests(await db.requests.toArray());
}

export function getRequest(id) {
  return db.requests.get(id);
}

export async function createRequest({ taskId = null, practiceId = null, practice = '', labId, name, group, studentId, lines }) {
  const fields = { name: name.trim(), group: group?.trim() || '', studentId: String(studentId ?? '').trim(), lines };
  const problem = requestProblems(fields);
  if (problem) return { problem };
  if (taskId && hasPendingFor(await db.requests.toArray(), { taskId, studentId: fields.studentId })) return { problem: 'duplicate' };
  const request = { id: crypto.randomUUID(), taskId, practiceId, practice, labId, ...fields, status: 'pending', createdAt: now() };
  await db.requests.add(request);
  return { request };
}

// A request that arrived by QR from a student's phone (F7). The id comes from that phone, so
// scanning the same QR twice opens the same request instead of creating another one.
// Returns { request, missing } or { problem }.
export async function importSharedRequest(shared, items) {
  const { lines, missing } = linesByCode(shared.lines, items);
  const labId = items.find((i) => i.id === lines[0]?.itemId)?.labId ?? null;
  return db.transaction('rw', db.requests, db.tasks, db.practices, async () => {
    const existing = await db.requests.get(shared.id);
    if (existing) return { request: existing, missing: [] };
    const fields = { name: shared.name, group: shared.group, studentId: shared.studentId, lines };
    const problem = requestProblems(fields);
    if (problem) return { problem };
    // Link it to this device's task when there is one for the same practice, group and day.
    const practices = await db.practices.toArray();
    const practice = practices.find((p) => p.name === shared.practice && !p.archived);
    const task = practice && (await db.tasks.where('practiceId').equals(practice.id).toArray())
      .find((x) => x.date === shared.date && groupKey(x.group) === groupKey(shared.taskGroup));
    const request = {
      id: shared.id, taskId: task?.id ?? null, practiceId: practice?.id ?? null, practice: shared.practice, labId,
      ...fields, status: 'pending', source: 'qr', createdAt: now(),
    };
    await db.requests.add(request);
    return { request, missing };
  });
}

// The borrower for an approved request: the same student (by control number) if already
// registered, otherwise a new one. Called when the lab staff starts attending the request.
export async function borrowerForRequest(request) {
  return db.transaction('rw', db.borrowers, async () => {
    const existing = await db.borrowers.filter((b) => sameStudent(b, request)).first();
    if (existing) return existing;
    const b = { id: crypto.randomUUID(), name: request.name, type: 'student', group: request.group, studentId: request.studentId, createdAt: now() };
    await db.borrowers.add(b);
    return b;
  });
}

export async function rejectRequest(id, reason) {
  return db.transaction('rw', db.requests, async () => {
    const r = await db.requests.get(id);
    if (!canDecide(r)) return false;
    await db.requests.update(id, { status: 'rejected', reason: reason || '', decidedAt: now() });
    return true;
  });
}
