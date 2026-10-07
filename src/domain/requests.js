// Requests (F7): a student asks for the material of a task; the lab staff approves it (and
// that creates the loan) or rejects it. A request never moves stock by itself. Pure.
import { borrowerProblems } from './loans.js';

export const REQUEST_STATUS = ['pending', 'approved', 'rejected'];

export function requestProblems({ name, studentId, lines }) {
  const who = borrowerProblems({ name, type: 'student', studentId });
  if (who) return who;
  if (!lines?.length) return 'empty';
  if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) return 'qty';
  return null;
}

// The registered borrower for a request: same control number AND same name (ignoring case,
// accents and spaces), so a mistyped control number never charges a loan to someone else.
export function sameStudent(borrower, request) {
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  return borrower.type === 'student'
    && String(borrower.studentId ?? '').trim() === String(request.studentId ?? '').trim()
    && norm(borrower.name) === norm(request.name);
}

// A student already waiting for the same task should not send it twice.
export function hasPendingFor(requests, { taskId, studentId }) {
  return requests.some((r) => r.status === 'pending' && r.taskId === taskId && r.studentId === String(studentId ?? '').trim());
}

// Only a pending request can be decided, and only once.
export function canDecide(request) {
  return request?.status === 'pending';
}

// Pending first (oldest first: whoever came first is served first), then the rest, newest first.
export function sortRequests(requests) {
  return [...requests].sort((a, b) => {
    const pa = a.status === 'pending';
    const pb = b.status === 'pending';
    if (pa !== pb) return pa ? -1 : 1;
    const ca = String(a.createdAt ?? '');
    const cb = String(b.createdAt ?? '');
    return pa ? ca.localeCompare(cb) : cb.localeCompare(ca);
  });
}

// Counts per task, for the teacher: { [taskId]: { pending, approved, rejected } }.
export function requestCountsByTask(requests) {
  const out = {};
  for (const r of requests) {
    if (!r.taskId) continue;
    out[r.taskId] ??= { pending: 0, approved: 0, rejected: 0 };
    out[r.taskId][r.status] += 1;
  }
  return out;
}
