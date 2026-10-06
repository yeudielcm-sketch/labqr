// Tablero de exposición (#/tablero, DESIGN.md): for a laptop or TV at the stand, readable at 3 m.
// One row of cylinders per location, open loans on the side, latest movements appearing live.
// "Live" = Dexie liveQuery: it updates when the app is used in another window of the SAME device
// (v0 has no sync between devices; see SPEC §2).
import { liveQuery } from 'dexie';
import { db } from '../../db/schema.js';
import { loanLines, loanStatus, daysLate } from '../../domain/loans.js';
import { formatQty } from '../../domain/quantity.js';
import { stockByItem, EMPTY_STOCK, isLowStock } from '../../domain/stock.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { animateCylinders, cylinderSvg } from '../components/cylinder.js';
import { equipmentState } from '../components/stockView.js';

let subscription = null;
let clockTimer = null;

async function snapshot() {
  const [labs, locations, items, movements, loans, borrowers] = await Promise.all([
    db.labs.toArray(), db.locations.toArray(), db.items.toArray(), db.movements.toArray(), db.loans.toArray(), db.borrowers.toArray(),
  ]);
  return { labs, locations, items: items.filter((i) => !i.archived), movements, loans, borrowers };
}

export const board = {
  title: t.board.title,
  tab: null,
  back: '/menu',
  bare: true,
  leave() {
    subscription?.unsubscribe();
    subscription = null;
    clearInterval(clockTimer);
  },
  render(view, _params, query) {
    this.leave();
    let prevOnHand = null;
    let prevMovementIds = null;

    view.innerHTML = `<section class="board" data-board><p class="board__loading">${t.board.loading}</p></section>`;
    const root = view.querySelector('[data-board]');

    const draw = (data) => {
      const labId = query.lab || data.labs.sort((a, b) => a.name.localeCompare(b.name, 'es'))[0]?.id;
      const lab = data.labs.find((l) => l.id === labId);
      if (!lab) {
        root.innerHTML = `<div class="empty"><p>${t.board.empty}</p><a class="btn btn--primary" href="#/ajustes">${t.home.loadDemo}</a></div>`;
        return;
      }
      const stocks = stockByItem(data.movements);
      const byId = Object.fromEntries(data.items.map((i) => [i.id, i]));
      const borrowerById = Object.fromEntries(data.borrowers.map((b) => [b.id, b]));
      const items = data.items.filter((i) => i.labId === labId);
      const locations = data.locations.filter((l) => l.labId === labId).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const groups = [...locations.map((l) => ({ name: l.name, items: items.filter((i) => i.locationId === l.id) })), { name: t.common.none, items: items.filter((i) => !i.locationId) }]
        .filter((g) => g.items.length);

      // Who holds each piece of equipment (latest LEND on an open line).
      const holder = {};
      for (const m of [...data.movements].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
        if (m.type === 'LEND') holder[m.itemId] = borrowerById[m.borrowerId]?.name;
      }

      const loanRows = data.loans
        .filter((l) => l.labId === labId)
        .map((loan) => {
          const lines = loanLines(loan.id, data.movements);
          return { loan, lines, status: loanStatus(loan, lines), borrower: borrowerById[loan.borrowerId] };
        })
        .filter((r) => r.status === 'open' || r.status === 'overdue')
        .sort((a, b) => (a.status === b.status ? a.loan.dueAt.localeCompare(b.loan.dueAt) : a.status === 'overdue' ? -1 : 1));

      const labItemIds = new Set(items.map((i) => i.id));
      const recent = data.movements
        .filter((m) => labItemIds.has(m.itemId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8);

      const cell = (item) => {
        const s = stocks[item.id] ?? EMPTY_STOCK;
        const from = prevOnHand && prevOnHand[item.id] !== undefined && prevOnHand[item.id] !== s.onHand ? prevOnHand[item.id] : null;
        if (item.kind === 'equipment') {
          const st = equipmentState(s, holder[item.id]);
          return `<div class="board-cell board-cell--equip board-cell--${st.key}"><span class="equip__dot" aria-hidden="true"></span><span class="board-cell__code">${esc(item.code)}</span><span class="board-cell__name">${esc(item.name)}</span><span class="board-cell__qty">${esc(st.key === 'out' ? holder[item.id] ?? '' : st.text)}</span></div>`;
        }
        return `<div class="board-cell${isLowStock(item, s) ? ' board-cell--low' : ''}">
          ${cylinderSvg({ onHand: s.onHand, lentOut: s.lentOut, minStock: item.minStock, size: 0.62, fromOnHand: from, title: item.name })}
          <span class="board-cell__code">${esc(item.code)}</span>
          <span class="board-cell__name">${esc(item.name)}</span>
          <span class="board-cell__qty">${formatQty(s.onHand)} ${item.unit}</span>
        </div>`;
      };

      root.innerHTML = `
        <header class="board__head">
          <div class="board__brand"><span class="board__logo">${t.appName}</span><span>${t.board.lab(esc(lab.name))}</span></div>
          <div class="board__labs">${data.labs.length > 1 ? data.labs.map((l) => `<a class="chip" aria-pressed="${l.id === labId}" href="#/tablero?lab=${l.id}">${esc(l.name)}</a>`).join('') : ''}</div>
          <time class="board__clock" data-clock></time>
        </header>
        <div class="board__body">
          <main class="board__shelves">
            ${groups.map((g) => `
              <section class="shelf">
                <h2 class="shelf__name">${esc(g.name)}</h2>
                <div class="shelf__row">${g.items.sort((a, b) => a.code.localeCompare(b.code)).map(cell).join('')}</div>
              </section>`).join('')}
          </main>
          <aside class="board__side">
            <section>
              <h2>${t.board.openLoans(loanRows.length)}</h2>
              ${loanRows.length ? loanRows.map((r) => `
                <div class="board-loan board-loan--${r.status}">
                  <strong>${esc(r.borrower?.group ? `${r.borrower.name} · ${r.borrower.group}` : r.borrower?.name ?? '')}</strong>
                  <span>${esc(r.loan.practice || t.loans.noPractice)}</span>
                  <span class="board-loan__state">${r.status === 'overdue' ? `<span class="hazard" aria-hidden="true"></span>${t.loans.late(daysLate(r.loan))}` : t.loans.status.open} · ${t.loans.pending(r.lines.filter((l) => l.pending > 0).length)}</span>
                </div>`).join('') : `<p class="board__calm">${t.board.noLoans}</p>`}
            </section>
            <section>
              <h2>${t.board.recent}</h2>
              <ol class="board-feed">
                ${recent.map((m) => {
                  const item = byId[m.itemId];
                  const fresh = prevMovementIds && !prevMovementIds.has(m.id);
                  return `<li class="board-feed__row board-feed__row--${m.type.toLowerCase()}${fresh ? ' is-new' : ''}">
                    <span class="board-feed__type">${m.type === 'LOSS' ? '<span class="hazard" aria-hidden="true"></span>' : ''}${t.movementTypes[m.type]}</span>
                    <span class="board-feed__what">${esc(item?.name ?? '')}</span>
                    <span class="board-feed__qty">${formatQty(Math.abs(m.qty))} ${item?.unit ?? ''}</span>
                    <span class="board-feed__when">${new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}</span>
                  </li>`;
                }).join('')}
              </ol>
            </section>
          </aside>
        </div>`;

      tick();
      animateCylinders(root);
      prevOnHand = Object.fromEntries(items.map((i) => [i.id, (stocks[i.id] ?? EMPTY_STOCK).onHand]));
      prevMovementIds = new Set(data.movements.map((m) => m.id));
    };

    const tick = () => {
      const el = root.querySelector('[data-clock]');
      if (el) el.textContent = new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
    };
    clockTimer = setInterval(tick, 15_000);
    subscription = liveQuery(snapshot).subscribe({ next: draw, error: () => { root.innerHTML = `<p>${t.board.error}</p>`; } });
  },
};
