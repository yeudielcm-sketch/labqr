import { describe, expect, it } from 'vitest';
import { backupIsDue, buildBackup, labSettings, mergeSettingsOnRestore, TABLES, validateBackup } from './backup.js';
import { inventoryCSV, loansCSV, parseCSV, parseInventoryCSV, templateCSV, toCSV } from './csv.js';
import { buildDemo } from '../db/seed.js';
import { stockByItem } from '../domain/stock.js';
import { loanLines, loanStatus } from '../domain/loans.js';

const demoTables = () => {
  const d = buildDemo();
  return { labs: d.labs, locations: d.locations, items: d.items, borrowers: d.borrowers, loans: d.loans, movements: d.movements, settings: [{ key: 'defaultLoanDays', value: 0 }] };
};

describe('JSON backup', () => {
  it('round-trips through JSON text unchanged', () => {
    const backup = buildBackup(demoTables(), '2026-10-01T00:00:00.000Z');
    const restored = JSON.parse(JSON.stringify(backup));
    expect(validateBackup(restored)).toBe(null);
    expect(restored).toEqual(backup);
  });

  it('rejects files that are not a LabQR backup', () => {
    expect(validateBackup(null)).toBe('notJson');
    expect(validateBackup({ app: 'Otra' })).toBe('notLabqr');
    expect(validateBackup({ app: 'LabQR', version: 99 })).toBe('version');
    const tables = demoTables();
    delete tables.loans;
    expect(validateBackup({ app: 'LabQR', version: 1, tables })).toBe('missingTable');
    const dup = demoTables();
    dup.items.push({ ...dup.items[0] });
    expect(validateBackup(buildBackup(dup))).toBe('badRows');
    expect(TABLES).toHaveLength(10);
    const old = demoTables();
    expect(validateBackup(buildBackup(old))).toBe(null); // backups from before F6/F7 have no practices, tasks or requests
  });

  it('checks tasks and requests in the file (F7)', () => {
    const d = buildDemo();
    const tables = { ...demoTables(), practices: d.practices, tasks: d.tasks, requests: d.requests };
    expect(validateBackup(buildBackup(tables))).toBe(null);
    const badStatus = { ...tables, requests: [{ ...d.requests[0], status: 'maybe' }] };
    expect(validateBackup(buildBackup(badStatus))).toBe('badRows');
    const badLines = { ...tables, requests: [{ ...d.requests[0], lines: [{ itemId: 'x', qty: -1 }] }] };
    expect(validateBackup(buildBackup(badLines))).toBe('badRows');
    const noDate = { ...tables, requests: [{ ...d.requests[0], createdAt: undefined }] };
    expect(validateBackup(buildBackup(noDate))).toBe('badRows');
  });

  it('never carries the role of one device to another (F7)', () => {
    const device = [{ key: 'role', value: 'labTech' }, { key: 'studentId', value: '1' }, { key: 'lastBackupAt', value: 'x' }];
    expect(labSettings(device)).toEqual([{ key: 'lastBackupAt', value: 'x' }]);
    const fromFile = [{ key: 'role', value: 'student' }, { key: 'defaultLoanDays', value: 2 }];
    expect(mergeSettingsOnRestore(fromFile, device)).toEqual([
      { key: 'defaultLoanDays', value: 2 },
      { key: 'role', value: 'labTech' },
      { key: 'studentId', value: '1' },
    ]);
  });

  it('asks for a backup after 7 days, or if there has never been one', () => {
    const now = new Date('2026-10-10T12:00:00Z').getTime();
    expect(backupIsDue(null, true, now)).toBe(true);
    expect(backupIsDue('2026-10-05T12:00:00Z', true, now)).toBe(false);
    expect(backupIsDue('2026-10-01T12:00:00Z', true, now)).toBe(true);
    expect(backupIsDue(null, false, now)).toBe(false);
  });
});

describe('CSV', () => {
  it('escapes and parses quotes, commas and newlines', () => {
    const text = toCSV(['a', 'b'], [['Vaso, 250 ml', 'dice "hola"\nadiós']]);
    expect(parseCSV(text)).toEqual([['a', 'b'], ['Vaso, 250 ml', 'dice "hola"\nadiós']]);
  });

  it('accepts semicolon-separated files from Excel in Spanish', () => {
    expect(parseCSV('nombre;tipo\r\nMatraz;material\r\n')).toEqual([['nombre', 'tipo'], ['Matraz', 'material']]);
  });

  it('exports inventory with plain numbers', () => {
    const d = buildDemo();
    const csv = inventoryCSV(d.items, stockByItem(d.movements), Object.fromEntries(d.labs.map((l) => [l.id, l])), Object.fromEntries(d.locations.map((l) => [l.id, l])));
    const rows = parseCSV(csv);
    expect(rows[0][0]).toBe('codigo');
    expect(rows).toHaveLength(d.items.length + 1);
    const etanol = rows.find((r) => r[1] === 'Alcohol etílico');
    expect(etanol.slice(6, 10)).toEqual(['350', '0', '350', '500']);
  });

  it('exports loan delivery time in seconds', () => {
    const d = buildDemo();
    const rows = d.loans.map((loan) => {
      const lines = loanLines(loan.id, d.movements);
      return { loan, borrower: d.borrowers.find((b) => b.id === loan.borrowerId), lines, status: loanStatus(loan, lines) };
    });
    const parsed = parseCSV(loansCSV(rows));
    expect(parsed[0][2]).toBe('duracion_segundos');
    expect(parsed.slice(1).map((r) => r[2])).toEqual(['48', '42', '72']);
  });

  it('parses the template and reports bad rows by spreadsheet line', () => {
    const ok = parseInventoryCSV(templateCSV());
    expect(ok.errors).toEqual([]);
    expect(ok.rows).toHaveLength(3);
    expect(ok.rows[1]).toMatchObject({ kind: 'reagent', unit: 'ml', qty: 100000, minStock: 50000, expiresAt: '2027-06-30' });
    expect(ok.rows[2]).toMatchObject({ kind: 'equipment', qty: 100, serial: 'MO-001' });

    const bad = parseInventoryCSV('laboratorio,prefijo,nombre,tipo,cantidad\nQuímica,QUI,Pinzas,herramienta,5\nQuímica,Q,Vaso,material,x\n');
    expect(bad.rows).toEqual([]);
    expect(bad.errors.map((e) => e.line)).toEqual([2, 3]);
    expect(parseInventoryCSV('nombre\nx').errors[0].message).toMatch(/Faltan columnas/);
  });
});
