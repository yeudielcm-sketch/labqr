// Vales: list of loans (open/overdue first) with a big "Nuevo vale" action.
import { loadLoans } from '../../db/movements.js';
import { daysLate } from '../../domain/loans.js';
import { replaceQuery } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { formatDateTime } from '../components/format.js';

export function borrowerLabel(b) {
  if (!b) return '—';
  return b.group ? `${b.name} · ${b.group}` : b.name;
}

export function statusBadge(status, loan) {
  if (status === 'overdue') return `<span class="flag flag--hazard"><span class="hazard" aria-hidden="true"></span>${t.loans.late(daysLate(loan))}</span>`;
  if (status === 'open') return `<span class="flag flag--open"><span class="open-dot" aria-hidden="true"></span>${t.loans.status.open}</span>`;
  return `<span class="flag flag--closed">${t.loans.status[status]}</span>`;
}

function loanRow({ loan, borrower, lines, status }) {
  const pending = lines.filter((l) => l.pending > 0).length;
  return `
    <a class="label loan-row loan-row--${status}" href="#/vales/${loan.id}">
      <span class="loan-row__who">${esc(borrowerLabel(borrower))}</span>
      <span class="loan-row__when meta">${formatDateTime(loan.confirmedAt ?? loan.createdAt)}</span>
      <span class="loan-row__practice">${esc(loan.practice || t.loans.noPractice)}</span>
      <span class="loan-row__state">${statusBadge(status, loan)}<span class="meta">${status === 'closed' ? t.loans.lines(lines.length) : t.loans.pending(pending)}</span></span>
    </a>`;
}

export const loans = {
  title: t.loans.title,
  tab: '/vales',
  async render(view, _params, query) {
    const all = await loadLoans();
    let filter = query.estado ?? 'abiertos';

    view.innerHTML = `
      <section class="screen stack">
        <a class="btn btn--primary btn--block btn--big" href="#/vales/nuevo">+ ${t.loans.newLoan}</a>
        ${all.length ? `
        <div class="chips" role="group">
          <button type="button" class="chip" data-f="abiertos">${t.loans.open}</button>
          <button type="button" class="chip" data-f="vencidos">${t.loans.overdue}</button>
          <button type="button" class="chip" data-f="cerrados">${t.loans.closed}</button>
          <button type="button" class="chip" data-f="todos">${t.loans.all}</button>
        </div>
        <div class="list" data-list></div>` : `<div class="empty"><p>${t.loans.empty}</p></div>`}
      </section>`;
    if (!all.length) return;

    const matches = (row) =>
      filter === 'todos' ||
      (filter === 'abiertos' && row.status !== 'closed') ||
      (filter === 'vencidos' && row.status === 'overdue') ||
      (filter === 'cerrados' && row.status === 'closed');

    const rank = { overdue: 0, open: 1, closed: 2, draft: 3 };
    const draw = () => {
      const rows = all.filter(matches).sort((a, b) => rank[a.status] - rank[b.status]);
      view.querySelector('[data-list]').innerHTML = rows.length ? rows.map(loanRow).join('') : `<div class="empty"><p>${t.loans.emptyFilter}</p></div>`;
      for (const b of view.querySelectorAll('[data-f]')) b.setAttribute('aria-pressed', String(b.dataset.f === filter));
      replaceQuery({ estado: filter === 'abiertos' ? '' : filter });
    };
    view.querySelector('.chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      filter = b.dataset.f;
      draw();
    });
    draw();
  },
};

