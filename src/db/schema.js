import Dexie from 'dexie';

// Data model from SPEC §4. Only indexed fields are listed; Dexie stores the rest as-is.
// Stock is never stored: it is derived from `movements` in src/domain/stock.js.
export const db = new Dexie('labqr');

db.version(1).stores({
  labs: 'id, name',
  locations: 'id, labId',
  items: 'id, &code, labId, locationId, kind, archived',
  borrowers: 'id, name, type',
  loans: 'id, borrowerId, labId, createdAt, closedAt',
  movements: 'id, itemId, loanId, type, createdAt',
  settings: 'key',
});

// v2 (F6): practices = a teacher's material list that pre-fills a loan.
db.version(2).stores({
  practices: 'id, labId, name, archived',
});

// v3 (F7): tasks = a practice assigned to a group for a date; requests = a student's
// request for that material, which the lab staff approves (→ loan) or rejects.
// Only new tables: devices already on v2 keep all their data when they upgrade.
db.version(3).stores({
  tasks: 'id, practiceId, date, archived',
  requests: 'id, taskId, status, createdAt',
});
