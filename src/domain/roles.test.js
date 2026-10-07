import { describe, expect, it } from 'vitest';
import { can, isRole, ROLE_TABS, ROLES } from './roles.js';
import { groupKey, localDate, taskProblems, taskWhen, visibleTasks } from './tasks.js';
import { canDecide, hasPendingFor, requestCountsByTask, requestProblems, sameStudent, sortRequests } from './requests.js';

describe('roles', () => {
  it('knows the three roles and nothing else', () => {
    expect(ROLES).toEqual(['teacher', 'labTech', 'student']);
    expect(isRole('student')).toBe(true);
    expect(isRole('admin')).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });

  it('gives every role four tabs that start at Inicio', () => {
    for (const role of ROLES) {
      expect(ROLE_TABS[role]).toHaveLength(4);
      expect(ROLE_TABS[role][0]).toBe('/');
    }
  });

  it('lets only the lab staff move stock, administer and decide requests', () => {
    expect(can('labTech', 'moveStock')).toBe(true);
    expect(can('labTech', 'decideRequest')).toBe(true);
    expect(can('teacher', 'moveStock')).toBe(false);
    expect(can('teacher', 'tasks')).toBe(true);
    expect(can('student', 'lend')).toBe(false);
    expect(can('student', 'admin')).toBe(false);
    expect(can('student', 'request')).toBe(true);
    expect(can(null, 'request')).toBe(false);
  });
});

describe('tasks', () => {
  it('matches groups however they were typed', () => {
    expect(groupKey('4° a')).toBe('4A');
    expect(groupKey('4º A')).toBe(groupKey('4A'));
    expect(groupKey('  ')).toBe('');
  });

  it('needs a practice, a group and a date', () => {
    expect(taskProblems({ practiceId: '', group: '4A', date: '2026-10-10' })).toBe('practice');
    expect(taskProblems({ practiceId: 'p', group: ' ', date: '2026-10-10' })).toBe('group');
    expect(taskProblems({ practiceId: 'p', group: '4A', date: '10/10/2026' })).toBe('date');
    expect(taskProblems({ practiceId: 'p', group: '4A', date: '2026-10-10' })).toBe(null);
  });

  it('formats the local date', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('orders today, then upcoming, then recent past, and hides old or archived ones', () => {
    const today = '2026-10-07';
    const tasks = [
      { id: 'old', group: '4A', date: '2026-09-01' },
      { id: 'past', group: '4A', date: '2026-10-05' },
      { id: 'later', group: '4A', date: '2026-10-20' },
      { id: 'soon', group: '4 a', date: '2026-10-09' },
      { id: 'now', group: '4°A', date: today },
      { id: 'other', group: '4B', date: today },
      { id: 'gone', group: '4A', date: today, archived: true },
    ];
    expect(visibleTasks(tasks, { group: '4A', today }).map((t) => t.id)).toEqual(['now', 'soon', 'later', 'past']);
    expect(visibleTasks(tasks, { today }).map((t) => t.id)).toContain('other');
    expect(taskWhen({ date: today }, today)).toBe('today');
    expect(taskWhen({ date: '2026-10-05' }, today)).toBe('past');
  });
});

describe('requests', () => {
  const lines = [{ itemId: 'a', qty: 200 }];

  it('asks the student for name, control number and material', () => {
    expect(requestProblems({ name: '', studentId: '1', lines })).toBe('name');
    expect(requestProblems({ name: 'Sofía', studentId: ' ', lines })).toBe('studentId');
    expect(requestProblems({ name: 'Sofía', studentId: '1', lines: [] })).toBe('empty');
    expect(requestProblems({ name: 'Sofía', studentId: '1', lines: [{ itemId: 'a', qty: 0 }] })).toBe('qty');
    expect(requestProblems({ name: 'Sofía', studentId: '1', lines: [{ itemId: 'a', qty: 1.5 }] })).toBe('qty');
    expect(requestProblems({ name: 'Sofía', studentId: '1', lines })).toBe(null);
  });

  it('finds the student by control number AND name (audit F7 #3)', () => {
    const luis = { type: 'student', name: 'Luis Pérez', studentId: '123' };
    expect(sameStudent(luis, { name: 'luis  perez', studentId: '123' })).toBe(true);
    expect(sameStudent(luis, { name: 'Ana', studentId: '123' })).toBe(false);
    expect(sameStudent({ ...luis, type: 'team' }, { name: 'Luis Pérez', studentId: '123' })).toBe(false);
  });

  it('notices a request already waiting for the same task (audit F7 #6)', () => {
    const rows = [{ taskId: 't1', studentId: '123', status: 'pending' }, { taskId: 't2', studentId: '123', status: 'approved' }];
    expect(hasPendingFor(rows, { taskId: 't1', studentId: ' 123 ' })).toBe(true);
    expect(hasPendingFor(rows, { taskId: 't2', studentId: '123' })).toBe(false);
  });

  it('sorts even rows without a date instead of crashing (audit F7 #5)', () => {
    expect(() => sortRequests([{ status: 'pending' }, { status: 'pending', createdAt: 'x' }])).not.toThrow();
  });

  it('can be decided only while pending', () => {
    expect(canDecide({ status: 'pending' })).toBe(true);
    expect(canDecide({ status: 'approved' })).toBe(false);
    expect(canDecide(null)).toBe(false);
  });

  it('serves pending requests first, oldest first', () => {
    const rows = [
      { id: 'done-old', status: 'approved', createdAt: '2026-10-01' },
      { id: 'late', status: 'pending', createdAt: '2026-10-07T10:00' },
      { id: 'done-new', status: 'rejected', createdAt: '2026-10-06' },
      { id: 'first', status: 'pending', createdAt: '2026-10-07T09:00' },
    ];
    expect(sortRequests(rows).map((r) => r.id)).toEqual(['first', 'late', 'done-new', 'done-old']);
  });

  it('counts requests per task for the teacher', () => {
    const counts = requestCountsByTask([
      { taskId: 't1', status: 'pending' },
      { taskId: 't1', status: 'approved' },
      { taskId: 't1', status: 'pending' },
      { taskId: null, status: 'pending' },
    ]);
    expect(counts).toEqual({ t1: { pending: 2, approved: 1, rejected: 0 } });
  });
});
