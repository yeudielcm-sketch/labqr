// Catalog reads and writes. Every write that changes quantities goes through `movements`.
import { db } from './schema.js';
import { nextCode } from '../domain/codes.js';
import { stockByItem, stockOf } from '../domain/stock.js';

const now = () => new Date().toISOString();

export async function loadCatalog() {
  const [labs, locations, items, movements] = await Promise.all([
    db.labs.toArray(),
    db.locations.toArray(),
    db.items.toArray(),
    db.movements.toArray(),
  ]);
  labs.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  locations.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return { labs, locations, items, stocks: stockByItem(movements) };
}

export async function isEmpty() {
  return (await db.labs.count()) === 0 && (await db.items.count()) === 0;
}

export async function getItemByCode(code) {
  const item = await db.items.where('code').equals(code).first();
  if (!item) return null;
  const [lab, location, movements] = await Promise.all([
    db.labs.get(item.labId),
    item.locationId ? db.locations.get(item.locationId) : null,
    db.movements.where('itemId').equals(item.id).toArray(),
  ]);
  movements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const loanIds = [...new Set(movements.map((m) => m.loanId).filter(Boolean))];
  const loans = await db.loans.bulkGet(loanIds);
  const borrowerIds = [...new Set([...loans.map((l) => l?.borrowerId), ...movements.map((m) => m.borrowerId)].filter(Boolean))];
  const borrowers = Object.fromEntries((await db.borrowers.bulkGet(borrowerIds)).filter(Boolean).map((b) => [b.id, b]));
  return {
    item,
    lab,
    location,
    movements,
    loans: Object.fromEntries(loans.filter(Boolean).map((l) => [l.id, l])),
    borrowers,
    stock: stockOf(movements),
  };
}

// Creates the item and, if there is an initial quantity, its first RECEIVE.
export async function createItem(fields, initialQty) {
  return db.transaction('rw', db.items, db.labs, db.movements, async () => {
    const lab = await db.labs.get(fields.labId);
    const codes = await db.items.orderBy('code').keys();
    const item = {
      id: crypto.randomUUID(),
      code: nextCode(lab.prefix, codes),
      archived: false,
      extra: {},
      createdAt: now(),
      updatedAt: now(),
      ...fields,
    };
    await db.items.add(item);
    if (initialQty > 0) {
      await db.movements.add({
        id: crypto.randomUUID(),
        itemId: item.id,
        type: 'RECEIVE',
        qty: initialQty,
        reason: 'Existencia inicial',
        createdAt: now(),
      });
    }
    return item;
  });
}

// `code` and `kind` never change: the code is printed on labels.
export async function updateItem(id, fields) {
  const { code, id: _id, kind, createdAt, ...rest } = fields;
  await db.items.update(id, { ...rest, updatedAt: now() });
}

export async function setArchived(id, archived) {
  await db.items.update(id, { archived, updatedAt: now() });
}

export async function deleteItemIfUnused(id) {
  return db.transaction('rw', db.items, db.movements, async () => {
    if ((await db.movements.where('itemId').equals(id).count()) > 0) return false;
    await db.items.delete(id);
    return true;
  });
}

export async function saveLab({ id, name, prefix }) {
  if (id) return db.labs.update(id, { name, prefix });
  return db.labs.add({ id: crypto.randomUUID(), name, prefix, createdAt: now() });
}

export async function labHasItems(labId) {
  return (await db.items.where('labId').equals(labId).count()) > 0;
}

export async function deleteLabIfEmpty(labId) {
  return db.transaction('rw', db.labs, db.locations, db.items, async () => {
    if (await labHasItems(labId)) return false;
    await db.locations.where('labId').equals(labId).delete();
    await db.labs.delete(labId);
    return true;
  });
}

export async function saveLocation({ id, labId, name }) {
  if (id) return db.locations.update(id, { name });
  return db.locations.add({ id: crypto.randomUUID(), labId, name, createdAt: now() });
}

export async function deleteLocationIfEmpty(locationId) {
  return db.transaction('rw', db.locations, db.items, async () => {
    if ((await db.items.where('locationId').equals(locationId).count()) > 0) return false;
    await db.locations.delete(locationId);
    return true;
  });
}

export async function getSetting(key, fallback) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function wipeAll() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
}
