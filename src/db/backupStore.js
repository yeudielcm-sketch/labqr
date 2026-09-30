// Reads and replaces the whole database for backups, and writes the CSV inventory import.
import { db } from './schema.js';
import { nextCode } from '../domain/codes.js';
import { TABLES } from '../io/backup.js';

export async function readAllTables() {
  const entries = await Promise.all(TABLES.map(async (name) => [name, await db.table(name).toArray()]));
  return Object.fromEntries(entries);
}

// Replaces everything in one transaction: if anything fails, nothing changes.
export async function replaceAllTables(tables) {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLES) {
      await db.table(name).clear();
      await db.table(name).bulkAdd(tables[name]);
    }
  });
}

// Creates missing labs/locations by name and adds items with their initial RECEIVE.
export async function importInventoryRows(rows) {
  const now = new Date().toISOString();
  return db.transaction('rw', db.labs, db.locations, db.items, db.movements, async () => {
    const labs = await db.labs.toArray();
    const locations = await db.locations.toArray();
    const codes = await db.items.orderBy('code').keys();
    const key = (s) => s.trim().toLowerCase();
    let created = 0;

    for (const r of rows) {
      let lab = labs.find((l) => key(l.name) === key(r.labName)) ?? labs.find((l) => l.prefix === r.prefix);
      if (!lab) {
        lab = { id: crypto.randomUUID(), name: r.labName, prefix: r.prefix, createdAt: now };
        await db.labs.add(lab);
        labs.push(lab);
      }
      let loc = null;
      if (r.locationName) {
        loc = locations.find((l) => l.labId === lab.id && key(l.name) === key(r.locationName));
        if (!loc) {
          loc = { id: crypto.randomUUID(), labId: lab.id, name: r.locationName, createdAt: now };
          await db.locations.add(loc);
          locations.push(loc);
        }
      }
      const code = nextCode(lab.prefix, codes);
      codes.push(code);
      const item = {
        id: crypto.randomUUID(), code, name: r.name, kind: r.kind, unit: r.unit, labId: lab.id, locationId: loc?.id ?? null,
        minStock: r.minStock, expiresAt: r.expiresAt, serial: r.serial, notes: r.notes, extra: {}, archived: false, createdAt: now, updatedAt: now,
      };
      await db.items.add(item);
      if (r.qty > 0) {
        await db.movements.add({ id: crypto.randomUUID(), itemId: item.id, type: 'RECEIVE', qty: r.qty, reason: 'Importación de inventario inicial', createdAt: now });
      }
      created++;
    }
    return created;
  });
}

// Asks the browser not to evict our data under storage pressure (SPEC F4).
export async function requestPersistence() {
  if (!navigator.storage?.persist) return null;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
