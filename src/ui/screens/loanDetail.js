// Vale detail (#/vales/<id>): return by line — all or partial, broken/lost, or consumed (reagents).
import { getLoan, settleLine } from '../../db/movements.js';
import { deliverySeconds } from '../../domain/loans.js';
import { formatQty, parseQty } from '../../domain/quantity.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { formatDateTime } from '../components/format.js';
import { borrowerLabel, statusBadge } from './loans.js';

export const loanDetail = {
  title: t.loanDetail.title,
  tab: '/vales',
  back: '/vales',
  async render(view, { id }) {
    const data = await getLoan(id);
    if (!data) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.loanDetail.notFound}</p></div></section>`;
      return;
    }
    const { loan, borrower, lab, status, lines, movements } = data;
    const who = borrowerLabel(borrower);
    const pendingLines = lines.filter((l) => l.pending > 0);
    const secs = deliverySeconds(loan);

    view.innerHTML = `
      <section class="screen stack loan-detail">
        <header class="label loan-head loan-head--${status}">
          <h2>${esc(who)}</h2>
          <p class="loan-head__practice">${esc(loan.practice || t.loans.noPractice)}</p>
          <div>${statusBadge(status, loan)}</div>
          <dl class="kv">
            <div><dt>${t.loanDetail.delivered}</dt><dd>${formatDateTime(loan.confirmedAt)}${lab ? ` · ${esc(lab.name)}` : ''}</dd></div>
            <div><dt>${t.loanDetail.due}</dt><dd>${formatDateTime(loan.dueAt)}</dd></div>
            ${loan.closedAt ? `<div><dt>${t.loanDetail.closedAt}</dt><dd>${formatDateTime(loan.closedAt)}</dd></div>` : ''}
            ${secs !== null ? `<div><dt>${t.loanDetail.captureTime}</dt><dd>${secs} s</dd></div>` : ''}
          </dl>
        </header>

        ${pendingLines.length > 1 ? `<button type="button" class="btn btn--primary btn--block btn--big" data-return-all>${t.loanDetail.returnAll}</button>` : ''}

        <ul class="lines">
          ${lines.map((l) => lineHtml(l)).join('')}
        </ul>
        ${!pendingLines.length ? `<p class="notice">${t.loanDetail.allSettled}</p>` : ''}

        <section class="block">
          <h3>${t.loanDetail.history}</h3>
          <ol class="history">
            ${movements.map((m) => {
              const item = lines.find((l) => l.itemId === m.itemId)?.item;
              return `<li class="history__row history__row--${m.type.toLowerCase()}">
                <span class="history__type">${m.type === 'LOSS' ? '<span class="hazard" aria-hidden="true"></span>' : ''}${t.movementTypes[m.type]}</span>
                <span class="history__qty code">${formatQty(m.qty)} ${item?.unit ?? ''}</span>
                <span class="history__when meta">${esc(item?.name ?? '')} · ${formatDateTime(m.createdAt)}</span>
              </li>`;
            }).join('')}
          </ol>
        </section>
      </section>`;

    const rerender = () => this.render(view, { id });

    const settle = async (itemId, type, qty) => {
      const extra = type === 'LOSS' ? { reason: t.loanDetail.lossReason } : {};
      const ok = await settleLine(loan.id, itemId, type, qty, extra);
      if (!ok) return toast(t.loanDetail.badQty, { danger: true });
      const after = await getLoan(loan.id);
      toast(after.status === 'closed' ? t.loanDetail.closedToast : { RETURN: t.loanDetail.savedReturn, LOSS: t.loanDetail.savedLoss, CONSUME: t.loanDetail.savedConsume }[type]);
      rerender();
    };

    view.querySelector('.lines').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const line = lines.find((l) => l.itemId === b.dataset.item);
      const input = view.querySelector(`[data-qty="${line.itemId}"]`);
      const qty = input ? parseQty(input.value) : line.pending;
      if (!(qty > 0) || qty > line.pending) return toast(t.loanDetail.badQty, { danger: true });
      if (b.dataset.act === 'LOSS') {
        const ok = await confirmDialog(t.loanDetail.lossQ(`${formatQty(qty)} ${line.item.unit} de ${line.item.name}`, who), { confirmLabel: t.loanDetail.lossBtn, danger: true });
        if (!ok) return;
      }
      settle(line.itemId, b.dataset.act, qty);
    });

    view.querySelector('[data-return-all]')?.addEventListener('click', async (e) => {
      if (!(await confirmDialog(t.loanDetail.returnAllQ, { confirmLabel: t.loanDetail.returnBtn }))) return;
      e.target.disabled = true;
      for (const l of pendingLines) await settleLine(loan.id, l.itemId, 'RETURN', l.pending);
      toast(t.loanDetail.closedToast);
      rerender();
    });
  },
};

function lineHtml(l) {
  const { item } = l;
  const u = item.unit;
  const facts = [
    `${t.loanDetail.lent} ${formatQty(l.lent)}`,
    l.returned ? `${t.loanDetail.returned} ${formatQty(l.returned)}` : '',
    l.lost ? `${t.loanDetail.lost} ${formatQty(l.lost)}` : '',
    l.consumed ? `${t.loanDetail.consumed} ${formatQty(l.consumed)}` : '',
  ].filter(Boolean).join(' · ');
  const single = item.kind === 'equipment' || (l.pending === 100 && item.unit === 'pz');
  return `
    <li class="line label label--${item.kind}${l.pending > 0 ? '' : ' line--done'}">
      <div class="line__head">
        <a class="line__name" href="#/i/${encodeURIComponent(item.code)}">${esc(item.name)}</a>
        <span class="code line__code">${esc(item.code)}</span>
      </div>
      <p class="meta line__facts">${facts} ${u}</p>
      ${l.pending > 0 ? `
        <div class="line__pending">
          <span><strong class="code">${formatQty(l.pending)}</strong> ${u} ${t.loanDetail.pending.toLowerCase()}</span>
          ${single ? '' : `<input class="field field--num code-input" inputmode="decimal" data-qty="${item.id}" value="${formatQty(l.pending)}" aria-label="${t.moves.qty}" />`}
        </div>
        <div class="line__actions">
          <button type="button" class="btn btn--sm" data-act="RETURN" data-item="${item.id}">${t.loanDetail.returnBtn}</button>
          ${item.kind === 'reagent' ? `<button type="button" class="btn btn--sm" data-act="CONSUME" data-item="${item.id}">${t.loanDetail.consumeBtn}</button>` : ''}
          <button type="button" class="btn btn--sm btn--danger-outline" data-act="LOSS" data-item="${item.id}">${t.loanDetail.lossBtn}</button>
        </div>` : ''}
    </li>`;
}
