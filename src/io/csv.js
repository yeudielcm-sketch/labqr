// CSV export (inventory, movements, loans) and the initial-inventory import (SPEC §5.7).
// Pure functions: rows in, text out (and back).
import { parseQty, UNITS } from '../domain/quantity.js';
import { deliverySeconds } from '../domain/loans.js';

const BOM = '﻿'; // lets Excel open accents correctly
// Plain decimal for spreadsheets (no thousands separator): 132000 → "1320".
const num = (q) => String((q ?? 0) / 100);

function cell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(header, rows) {
  return BOM + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

// RFC 4180-style parser: quoted fields, escaped quotes, commas and newlines inside quotes.
// Also accepts ";" as separator (Excel in Spanish often saves that way).
export function parseCSV(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

const KIND_ES = { equipment: 'equipo', material: 'material', reagent: 'reactivo' };
const KIND_FROM_ES = { equipo: 'equipment', material: 'material', reactivo: 'reagent' };
const extraText = (extra) => Object.entries(extra ?? {}).map(([k, v]) => `${k}: ${v}`).join('; ');

export function inventoryCSV(items, stocks, labsById, locsById) {
  const header = ['codigo', 'nombre', 'tipo', 'unidad', 'laboratorio', 'ubicacion', 'en_laboratorio', 'prestado', 'total', 'minimo', 'caducidad', 'serie', 'especificaciones', 'archivado'];
  const rows = items.map((i) => {
    const s = stocks[i.id] ?? { onHand: 0, lentOut: 0, total: 0 };
    return [i.code, i.name, KIND_ES[i.kind], i.unit, labsById[i.labId]?.name, locsById[i.locationId]?.name, num(s.onHand), num(s.lentOut), num(s.total),
      num(i.minStock ?? 0), i.expiresAt ?? '', i.serial ?? '', extraText(i.extra), i.archived ? 'si' : 'no'];
  });
  return toCSV(header, rows);
}

export function movementsCSV(movements, itemsById, borrowersById, loansById) {
  const header = ['fecha', 'tipo', 'codigo', 'articulo', 'cantidad', 'unidad', 'vale_practica', 'responsable', 'motivo', 'nota'];
  const types = { RECEIVE: 'Recepción', LEND: 'Préstamo', RETURN: 'Devolución', CONSUME: 'Consumo', LOSS: 'Merma', ADJUST: 'Ajuste' };
  const rows = [...movements]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => {
      const item = itemsById[m.itemId];
      return [m.createdAt, types[m.type], item?.code, item?.name, num(m.qty), item?.unit, loansById[m.loanId]?.practice ?? '', borrowersById[m.borrowerId]?.name ?? '', m.reason ?? '', m.note ?? ''];
    });
  return toCSV(header, rows);
}

// Includes the delivery time in seconds (SPEC §8) for the before/after metric.
export function loansCSV(loanRows) {
  const header = ['inicio_captura', 'entrega', 'duracion_segundos', 'devolver', 'cerrado', 'estado', 'solicitante', 'grupo', 'practica', 'articulos', 'pendientes'];
  const status = { open: 'abierto', overdue: 'vencido', closed: 'cerrado', draft: 'sin confirmar' };
  const rows = loanRows.map(({ loan, borrower, lines, status: st }) => [
    loan.createdAt, loan.confirmedAt ?? '', deliverySeconds(loan) ?? '', loan.dueAt, loan.closedAt ?? '', status[st],
    borrower?.name ?? '', borrower?.group ?? '', loan.practice ?? '', lines.length, lines.filter((l) => l.pending > 0).length,
  ]);
  return toCSV(header, rows);
}

// ---- Initial inventory import ----

export const TEMPLATE_HEADER = ['laboratorio', 'prefijo', 'ubicacion', 'nombre', 'tipo', 'unidad', 'cantidad', 'minimo', 'caducidad', 'serie', 'notas'];

export function templateCSV() {
  return toCSV(TEMPLATE_HEADER, [
    ['Química', 'QUI', 'Anaquel A', 'Vaso de precipitado 250 ml', 'material', 'pz', '24', '10', '', '', ''],
    ['Química', 'QUI', 'Gabinete de reactivos', 'Alcohol etílico 96 %', 'reactivo', 'ml', '1000', '500', '2027-06-30', '', ''],
    ['Biología', 'BIO', 'Mesa de microscopios', 'Microscopio óptico', 'equipo', 'pz', '1', '', '', 'MO-001', 'Revisar foco'],
  ]);
}

const normalizeHeader = (h) => h.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

// Returns { rows: [...valid], errors: [{ line, message }] }. Line numbers match the spreadsheet.
export function parseInventoryCSV(text) {
  const table = parseCSV(text);
  if (!table.length) return { rows: [], errors: [{ line: 1, message: 'El archivo está vacío.' }] };
  const header = table[0].map(normalizeHeader);
  const col = Object.fromEntries(TEMPLATE_HEADER.map((h) => [h, header.indexOf(h)]));
  const missing = ['laboratorio', 'prefijo', 'nombre', 'tipo'].filter((h) => col[h] < 0);
  if (missing.length) return { rows: [], errors: [{ line: 1, message: `Faltan columnas: ${missing.join(', ')}. Usa la plantilla.` }] };

  const rows = [];
  const errors = [];
  table.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (h) => (col[h] >= 0 ? (r[col[h]] ?? '').trim() : '');
    const kind = KIND_FROM_ES[normalizeHeader(get('tipo'))];
    const prefix = get('prefijo').toUpperCase();
    const unit = kind === 'equipment' ? 'pz' : (get('unidad').toLowerCase() || (kind === 'reagent' ? 'ml' : 'pz'));
    const qty = kind === 'equipment' ? 100 : parseQty(get('cantidad') || '0');
    const min = parseQty(get('minimo') || '0');
    const expires = get('caducidad');
    const problems = [];
    if (!get('nombre')) problems.push('falta el nombre');
    if (!get('laboratorio')) problems.push('falta el laboratorio');
    if (!/^[A-Z]{2,5}$/.test(prefix)) problems.push('el prefijo debe tener de 2 a 5 letras');
    if (!kind) problems.push('tipo debe ser equipo, material o reactivo');
    if (!UNITS.includes(unit)) problems.push(`unidad "${unit}" no válida (usa ${UNITS.join(', ')})`);
    if (qty === null) problems.push('cantidad no válida');
    if (min === null) problems.push('mínimo no válido');
    if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) problems.push('caducidad debe ser AAAA-MM-DD');
    if (problems.length) return errors.push({ line, message: problems.join('; ') });
    rows.push({
      labName: get('laboratorio'), prefix, locationName: get('ubicacion'), name: get('nombre'), kind, unit, qty,
      minStock: kind === 'equipment' ? 0 : min, expiresAt: kind === 'reagent' && expires ? expires : null,
      serial: kind === 'equipment' ? get('serie') || null : null, notes: get('notas') || null,
    });
  });
  return { rows, errors };
}
