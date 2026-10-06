// Full JSON backup (SPEC §5.7). The file is the whole database, table by table, so restoring
// it gives back exactly the same data (F4 criterion).

// The internal id stays 'LabQR' after the rename to C-Lab, so earlier backup files still restore.
export const BACKUP_APP = 'LabQR';
export const BACKUP_VERSION = 1;
export const TABLES = ['labs', 'locations', 'items', 'borrowers', 'loans', 'movements', 'settings', 'practices'];
// Tables added after the first release: older backups may not have them (restored as empty).
const OPTIONAL_TABLES = ['practices'];

export function withOptionalTables(tables) {
  const out = { ...tables };
  for (const name of OPTIONAL_TABLES) out[name] ??= [];
  return out;
}

export function buildBackup(tables, exportedAt = new Date().toISOString()) {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt, tables };
}

// Returns an error key, or null if the file can be restored.
export function validateBackup(data) {
  if (!data || typeof data !== 'object') return 'notJson';
  if (data.app !== BACKUP_APP) return 'notLabqr';
  if (data.version !== BACKUP_VERSION) return 'version';
  for (const name of TABLES) {
    const rows = data.tables?.[name];
    if (rows === undefined && OPTIONAL_TABLES.includes(name)) continue;
    if (!Array.isArray(rows)) return 'missingTable';
  }
  const ids = new Set();
  for (const name of TABLES.filter((n) => n !== 'settings')) {
    for (const row of data.tables[name] ?? []) {
      if (!row?.id || ids.has(`${name}:${row.id}`)) return 'badRows';
      ids.add(`${name}:${row.id}`);
    }
  }
  return null;
}

export function backupSummary(data) {
  const t = data.tables;
  return { items: t.items.length, loans: t.loans.length, movements: t.movements.length, exportedAt: data.exportedAt };
}

export function backupFileName(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `clab-respaldo-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

const DAY = 24 * 60 * 60 * 1000;
export const BACKUP_WARN_DAYS = 7;

// The reminder shows when there is data and the last backup is missing or older than 7 days.
export function backupIsDue(lastBackupAt, hasData, now = Date.now()) {
  if (!hasData) return false;
  if (!lastBackupAt) return true;
  return now - new Date(lastBackupAt).getTime() > BACKUP_WARN_DAYS * DAY;
}
