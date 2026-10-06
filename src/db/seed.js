// Demo data (SPEC §7): the tool for the interview with lab staff.
// Built on the same ledger rules as real data: quantities only through movements.
import { db } from './schema.js';
import { formatCode } from '../domain/codes.js';

const DAY = 24 * 60 * 60 * 1000;
const at = (daysAgo, minutes = 0) => new Date(Date.now() - daysAgo * DAY + minutes * 60 * 1000).toISOString();
const dateOnly = (daysFromNow) => new Date(Date.now() + daysFromNow * DAY).toISOString().slice(0, 10);
const id = () => crypto.randomUUID();
const pz = (n) => n * 100;

// [key, name, kind, unit, qty (display units), min (display units), location key, extra fields]
const CATALOG = {
  QUI: {
    name: 'Química',
    locations: { equipo: 'Gabinete de equipo', vidrio: 'Anaquel A · Vidriería', gaveta: 'Anaquel B · Gaveta 2', reactivos: 'Gabinete de reactivos' },
    items: [
      ['balanza', 'Balanza analítica', 'equipment', 'pz', 1, 0, 'equipo', { capacidad: '210 g', resolución: '0.1 mg' }, { serial: 'BA-2019-014' }],
      ['parrilla', 'Parrilla de calentamiento con agitación', 'equipment', 'pz', 1, 0, 'equipo', { voltaje: '127 V', 'temperatura máx.': '350 °C' }, { serial: 'PC-0447' }],
      ['phmetro', 'Potenciómetro (medidor de pH)', 'equipment', 'pz', 1, 0, 'equipo', { rango: 'pH 0–14' }, { serial: 'PH-2021-03' }],
      ['vaso250', 'Vaso de precipitado 250 ml', 'material', 'pz', 24, 10, 'vidrio', { material: 'Vidrio borosilicato' }],
      ['vaso100', 'Vaso de precipitado 100 ml', 'material', 'pz', 30, 10, 'vidrio', { material: 'Vidrio borosilicato' }],
      ['matraz', 'Matraz Erlenmeyer 250 ml', 'material', 'pz', 18, 8, 'vidrio', {}],
      ['probeta', 'Probeta graduada 100 ml', 'material', 'pz', 12, 6, 'vidrio', { graduación: '1 ml' }],
      ['pipeta', 'Pipeta graduada 10 ml', 'material', 'pz', 20, 10, 'gaveta', { graduación: '0.1 ml' }],
      ['bureta', 'Bureta 50 ml', 'material', 'pz', 6, 4, 'gaveta', { llave: 'Teflón' }],
      ['tubos', 'Tubo de ensayo 16 × 150 mm', 'material', 'pz', 120, 50, 'gaveta', {}],
      ['pinzas', 'Pinzas para tubo de ensayo', 'material', 'pz', 15, 8, 'gaveta', {}],
      ['mechero', 'Mechero Bunsen', 'material', 'pz', 10, 5, 'gaveta', { gas: 'LP' }],
      ['embudo', 'Embudo de vidrio', 'material', 'pz', 8, 4, 'vidrio', {}],
      ['mortero', 'Mortero con pistilo', 'material', 'pz', 6, 0, 'gaveta', { material: 'Porcelana' }],
      ['nacl', 'Cloruro de sodio (NaCl)', 'reagent', 'g', 500, 100, 'reactivos', { pureza: '99 %', 'grado': 'Reactivo analítico' }, { expiresAt: dateOnly(700) }],
      ['etanol', 'Alcohol etílico', 'reagent', 'ml', 1000, 500, 'reactivos', { concentración: '96 %' }, { expiresAt: dateOnly(400) }],
      ['hcl', 'Ácido clorhídrico', 'reagent', 'ml', 500, 200, 'reactivos', { concentración: '1 M', peligro: 'Corrosivo' }, { expiresAt: dateOnly(20) }],
      ['naoh', 'Hidróxido de sodio (NaOH)', 'reagent', 'g', 250, 100, 'reactivos', { presentación: 'Lentejas', peligro: 'Corrosivo' }, { expiresAt: dateOnly(500) }],
      ['fenol', 'Fenolftaleína', 'reagent', 'ml', 100, 50, 'reactivos', { concentración: '1 %' }, { expiresAt: dateOnly(-14) }],
      ['cuso4', 'Sulfato de cobre pentahidratado', 'reagent', 'g', 250, 50, 'reactivos', { peligro: 'Irritante' }, { expiresAt: dateOnly(900) }],
      ['agua', 'Agua destilada', 'reagent', 'l', 20, 5, 'reactivos', {}],
    ],
  },
  BIO: {
    name: 'Biología',
    locations: { micro: 'Mesa de microscopios', vidrio: 'Anaquel de vidriería', refri: 'Refrigerador de reactivos' },
    items: [
      ['micro1', 'Microscopio óptico compuesto', 'equipment', 'pz', 1, 0, 'micro', { objetivos: '4×, 10×, 40×, 100×', iluminación: 'LED' }, { serial: 'MO-2020-001', notes: 'Microscopio 1' }],
      ['micro2', 'Microscopio óptico compuesto', 'equipment', 'pz', 1, 0, 'micro', { objetivos: '4×, 10×, 40×, 100×', iluminación: 'LED' }, { serial: 'MO-2020-002', notes: 'Microscopio 2' }],
      ['micro3', 'Microscopio óptico compuesto', 'equipment', 'pz', 1, 0, 'micro', { objetivos: '4×, 10×, 40×, 100×', iluminación: 'LED' }, { serial: 'MO-2020-003', notes: 'Microscopio 3' }],
      ['micro4', 'Microscopio óptico compuesto', 'equipment', 'pz', 1, 0, 'micro', { objetivos: '4×, 10×, 40×', iluminación: 'Espejo' }, { serial: 'MO-2014-011', notes: 'Microscopio 4. Revisar el revólver.' }],
      ['estereo', 'Microscopio estereoscópico', 'equipment', 'pz', 1, 0, 'micro', { aumento: '20× – 40×' }, { serial: 'ME-2018-002' }],
      ['porta', 'Portaobjetos', 'material', 'pz', 100, 50, 'vidrio', { medida: '25 × 75 mm' }],
      ['cubre', 'Cubreobjetos', 'material', 'pz', 200, 100, 'vidrio', { medida: '22 × 22 mm' }],
      ['petri', 'Caja de Petri', 'material', 'pz', 40, 20, 'vidrio', { diámetro: '90 mm' }],
      ['diseccion', 'Estuche de disección', 'material', 'pz', 8, 4, 'vidrio', { contenido: 'Bisturí, tijeras, pinzas, aguja' }],
      ['azul', 'Azul de metileno', 'reagent', 'ml', 250, 100, 'refri', { concentración: '1 %' }, { expiresAt: dateOnly(25) }],
      ['lugol', 'Lugol', 'reagent', 'ml', 250, 100, 'refri', {}, { expiresAt: dateOnly(300) }],
      ['glicerina', 'Glicerina', 'reagent', 'ml', 500, 100, 'refri', { pureza: '99 %' }, { expiresAt: dateOnly(800) }],
    ],
  },
};

const BORROWERS = [
  ['eq1', 'Equipo 1', 'team', '4° A'],
  ['eq2', 'Equipo 2', 'team', '4° A'],
  ['eq3', 'Equipo 3', 'team', '4° B'],
  ['eq5', 'Equipo 5', 'team', '2° C'],
  ['doc', 'Mtra. Laura Méndez', 'teacher', ''],
];

export function buildDemo() {
  const labs = [];
  const locations = [];
  const items = [];
  const movements = [];
  const ref = {}; // key → item
  const move = (key, type, qty, createdAt, extra = {}) =>
    movements.push({ id: id(), itemId: ref[key].id, type, qty, createdAt, ...extra });

  for (const [prefix, spec] of Object.entries(CATALOG)) {
    const lab = { id: id(), name: spec.name, prefix, createdAt: at(30) };
    labs.push(lab);
    const locIds = {};
    for (const [key, name] of Object.entries(spec.locations)) {
      locIds[key] = id();
      locations.push({ id: locIds[key], labId: lab.id, name, createdAt: at(30) });
    }
    spec.items.forEach(([key, name, kind, unit, qty, min, loc, extra, more = {}], i) => {
      const item = {
        id: id(),
        code: formatCode(prefix, i + 1),
        name,
        kind,
        unit,
        labId: lab.id,
        locationId: locIds[loc],
        minStock: min * 100,
        extra,
        archived: false,
        createdAt: at(30),
        updatedAt: at(30),
        ...more,
      };
      items.push(item);
      ref[key] = item;
      move(key, 'RECEIVE', qty * 100, at(30), { reason: 'Existencia inicial' });
    });
  }

  const borrowers = BORROWERS.map(([key, name, type, group]) => ({ id: id(), key, name, type, group, createdAt: at(20) }));
  const who = Object.fromEntries(borrowers.map((b) => [b.key, b.id]));
  borrowers.forEach((b) => delete b.key);
  const labId = (prefix) => labs.find((l) => l.prefix === prefix).id;

  // History outside of loans.
  move('etanol', 'CONSUME', 65000, at(12), { reason: 'Práctica de destilación (grupo completo)' });
  move('nacl', 'CONSUME', 12000, at(9), { reason: 'Preparación de soluciones' });
  move('tubos', 'ADJUST', -300, at(7), { note: 'Conteo físico: faltaron 3 tubos' });
  move('vaso250', 'LOSS', pz(1), at(6), { reason: 'Rotura', note: 'Se cayó durante la limpieza' });

  // Loan 1 — closed: titration practice, everything returned, reagent consumed.
  const l1 = { id: id(), borrowerId: who.eq1, labId: labId('QUI'), practice: 'Titulación ácido-base', createdAt: at(3, 0), confirmedAt: at(3, 0.8), dueAt: at(3, 120), closedAt: at(3, 115) };
  move('bureta', 'LEND', pz(2), l1.confirmedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('vaso250', 'LEND', pz(4), l1.confirmedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('pipeta', 'LEND', pz(2), l1.confirmedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('hcl', 'LEND', 5000, l1.confirmedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('bureta', 'RETURN', pz(2), l1.closedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('vaso250', 'RETURN', pz(4), l1.closedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('pipeta', 'RETURN', pz(2), l1.closedAt, { loanId: l1.id, borrowerId: l1.borrowerId });
  move('hcl', 'CONSUME', 5000, l1.closedAt, { loanId: l1.id, borrowerId: l1.borrowerId });

  // Loan 2 — open: onion cell observation, today.
  const l2 = { id: id(), borrowerId: who.eq3, labId: labId('BIO'), practice: 'Observación de células de cebolla', createdAt: at(0, -40), confirmedAt: at(0, -39.3), dueAt: at(0, 60) };
  move('micro2', 'LEND', pz(1), l2.confirmedAt, { loanId: l2.id, borrowerId: l2.borrowerId });
  move('porta', 'LEND', pz(10), l2.confirmedAt, { loanId: l2.id, borrowerId: l2.borrowerId });
  move('cubre', 'LEND', pz(10), l2.confirmedAt, { loanId: l2.id, borrowerId: l2.borrowerId });
  move('azul', 'LEND', 2000, l2.confirmedAt, { loanId: l2.id, borrowerId: l2.borrowerId });

  // Loan 3 — overdue with a loss: density practice, partial return, one cylinder broken.
  const l3 = { id: id(), borrowerId: who.eq2, labId: labId('QUI'), practice: 'Densidad de líquidos', createdAt: at(5, 0), confirmedAt: at(5, 1.2), dueAt: at(4, 0) };
  move('probeta', 'LEND', pz(4), l3.confirmedAt, { loanId: l3.id, borrowerId: l3.borrowerId });
  move('vaso100', 'LEND', pz(3), l3.confirmedAt, { loanId: l3.id, borrowerId: l3.borrowerId });
  move('probeta', 'RETURN', pz(2), at(5, 110), { loanId: l3.id, borrowerId: l3.borrowerId });
  move('probeta', 'LOSS', pz(1), at(5, 110), { loanId: l3.id, borrowerId: l3.borrowerId, reason: 'Rotura', note: 'Se rompió la base al guardarla' });

  // Teacher practices (F6): material lists that pre-fill a loan.
  const practice = (name, prefix, teacher, list) => ({
    id: id(), name, teacher, labId: labId(prefix), archived: false, createdAt: at(25), updatedAt: at(25),
    items: list.map(([key, qty]) => ({ itemId: ref[key].id, qty })),
  });
  const practices = [
    practice('Titulación ácido-base', 'QUI', 'Mtra. Laura Méndez', [['bureta', pz(2)], ['vaso250', pz(4)], ['pipeta', pz(2)], ['hcl', 5000], ['naoh', 1000]]),
    practice('Densidad de líquidos', 'QUI', 'Mtra. Laura Méndez', [['probeta', pz(4)], ['vaso100', pz(3)], ['balanza', pz(1)]]),
    practice('Observación de células de cebolla', 'BIO', '', [['micro1', pz(1)], ['porta', pz(10)], ['cubre', pz(10)], ['azul', 2000]]),
  ];

  return { labs, locations, items, borrowers, loans: [l1, l2, l3], movements, practices };
}

export async function loadDemo() {
  const demo = buildDemo();
  await db.transaction('rw', db.tables, async () => {
    await db.labs.bulkAdd(demo.labs);
    await db.locations.bulkAdd(demo.locations);
    await db.items.bulkAdd(demo.items);
    await db.borrowers.bulkAdd(demo.borrowers);
    await db.loans.bulkAdd(demo.loans);
    await db.movements.bulkAdd(demo.movements);
    await db.practices.bulkAdd(demo.practices);
    await db.settings.put({ key: 'defaultLoanDays', value: 0 });
    await db.settings.put({ key: 'demoLoadedAt', value: new Date().toISOString() });
  });
  return { items: demo.items.length, loans: demo.loans.length };
}
