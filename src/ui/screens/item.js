// #/i/<code>: the item card, and target of every printed QR.
import { deleteItemIfUnused, getItemByCode, setArchived, updateItem } from '../../db/catalog.js';
import { extractCode } from '../../domain/codes.js';
import { formatQty } from '../../domain/quantity.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { formatDate, formatDateTime, relativeDays } from '../components/format.js';
import { flagsHtml, statusFlags, stockPanel } from '../components/stockView.js';
import { bindItemMoves, itemMovesHtml } from '../components/itemMoves.js';

export const itemByCode = {
  title: t.itemCard.title,
  tab: '/articulos',
  back: '/articulos',
  async render(view, { code }) {
    const clean = extractCode(code) ?? code;
    const data = await getItemByCode(clean);
    if (!data) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.itemCard.notFound(esc(clean))}</p></div></section>`;
      return;
    }
    const { item, lab, location, movements, loans, borrowers, stock } = data;

    // For equipment on loan: who has it (the borrower of the latest open LEND).
    const lastLend = movements.find((m) => m.type === 'LEND');
    const holder = stock.lentOut > 0 && lastLend ? borrowers[lastLend.borrowerId]?.name : null;

    const extraRows = Object.entries(item.extra ?? {});
    view.innerHTML = `
      <section class="screen stack item-card">
        ${item.archived ? `<p class="notice">${t.itemCard.archivedNote}</p>` : ''}
        <header class="label label--${item.kind} item-head">
          <span class="item-head__code code">${esc(item.code)}</span>
          <h2 class="item-head__name">${esc(item.name)}</h2>
          <p class="meta">${t.kinds[item.kind]} · ${esc(lab?.name ?? '')}</p>
          <div class="item-head__flags">${flagsHtml(statusFlags(item, stock))}</div>
        </header>

        ${stockPanel(item, stock, holder)}

        <p class="location-line">${esc(location?.name ?? t.common.none)}</p>

        <section class="block">
          <h3>${t.itemCard.data}</h3>
          <dl class="kv">
            ${item.serial ? `<div><dt>${t.itemCard.serial}</dt><dd class="code">${esc(item.serial)}</dd></div>` : ''}
            ${item.expiresAt ? `<div><dt>${t.itemCard.expires}</dt><dd>${formatDate(item.expiresAt)} <span class="meta">(${relativeDays(item.expiresAt)})</span></dd></div>` : ''}
            ${item.notes ? `<div><dt>${t.itemCard.notes}</dt><dd>${esc(item.notes)}</dd></div>` : ''}
          </dl>
          <div class="row-2">
            <a class="btn" href="#/i/${encodeURIComponent(item.code)}/editar">${t.common.edit}</a>
            <a class="btn" href="#/etiquetas?codigos=${encodeURIComponent(item.code)}">${t.itemCard.printLabel}</a>
          </div>
        </section>

        <section class="block">
          <h3>${t.itemCard.extra}</h3>
          ${extraRows.length ? '' : `<p class="meta">${t.itemCard.extraEmpty}</p>`}
          <dl class="kv" data-extra>
            ${extraRows.map(([k, v]) => `
              <div class="kv__row">
                <dt>${esc(k)}</dt><dd>${esc(v)}</dd>
                <button type="button" class="icon-btn icon-btn--sm" data-remove="${esc(k)}" aria-label="${t.common.delete} ${esc(k)}">×</button>
              </div>`).join('')}
          </dl>
          <form class="extra-form" data-extra-form>
            <input class="field" name="k" placeholder="${t.itemCard.extraKey}" required maxlength="40" />
            <input class="field" name="v" placeholder="${t.itemCard.extraValue}" required maxlength="120" />
            <button class="btn" type="submit">${t.itemCard.extraAdd}</button>
          </form>
        </section>

        ${item.archived ? '' : itemMovesHtml(item, stock)}

        <section class="block">
          <h3>${t.itemCard.history}</h3>
          ${movements.length ? `<ol class="history">${movements.map((m) => historyRow(m, item, loans, borrowers)).join('')}</ol>` : `<p class="meta">${t.itemCard.historyEmpty}</p>`}
        </section>

        <div class="danger-zone">
          ${movements.length
            ? `<button type="button" class="btn btn--block" data-archive>${item.archived ? t.itemCard.unarchive : t.itemCard.archive}</button>`
            : `<button type="button" class="btn btn--block btn--danger-outline" data-delete>${t.common.delete}</button>`}
        </div>
      </section>`;

    const rerender = () => this.render(view, { code: item.code });
    bindItemMoves(view, item, rerender);

    view.querySelector('[data-extra-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = e.target.k.value.trim();
      const value = e.target.v.value.trim();
      if (!key || !value) return;
      await updateItem(item.id, { extra: { ...item.extra, [key]: value } });
      toast(t.itemCard.extraSaved);
      rerender();
    });

    view.querySelector('[data-extra]').addEventListener('click', async (e) => {
      const key = e.target.closest('[data-remove]')?.dataset.remove;
      if (!key) return;
      const { [key]: _removed, ...rest } = item.extra;
      await updateItem(item.id, { extra: rest });
      toast(t.itemCard.extraRemoved);
      rerender();
    });

    view.querySelector('[data-archive]')?.addEventListener('click', async () => {
      if (!item.archived && !(await confirmDialog(t.itemCard.archiveQ, { confirmLabel: t.itemCard.archive }))) return;
      await setArchived(item.id, !item.archived);
      toast(item.archived ? t.itemCard.unarchivedToast : t.itemCard.archivedToast);
      rerender();
    });

    view.querySelector('[data-delete]')?.addEventListener('click', async () => {
      if (!(await confirmDialog(t.itemCard.deleteQ, { confirmLabel: t.common.delete, danger: true }))) return;
      if (await deleteItemIfUnused(item.id)) {
        toast(t.itemCard.deletedToast);
        go('/articulos');
      }
    });
  },
};

function historyRow(m, item, loans, borrowers) {
  const sign = { RECEIVE: '+', RETURN: '+', LEND: '−', CONSUME: '−', LOSS: '−' }[m.type] ?? (m.qty < 0 ? '−' : '+');
  const loan = m.loanId ? loans[m.loanId] : null;
  const who = m.borrowerId ? borrowers[m.borrowerId] : null;
  const details = [
    m.reason,
    m.note,
    loan?.practice ? t.itemCard.loan(loan.practice) : null,
    who && (m.type === 'LOSS' || m.type === 'LEND') ? t.itemCard.by(who.group ? `${who.name} · ${who.group}` : who.name) : null,
  ].filter(Boolean);
  return `
    <li class="history__row history__row--${m.type.toLowerCase()}">
      <span class="history__type">${m.type === 'LOSS' ? '<span class="hazard" aria-hidden="true"></span>' : ''}${t.movementTypes[m.type]}</span>
      <span class="history__qty code">${sign}${formatQty(Math.abs(m.qty))} ${item.unit}</span>
      <span class="history__when meta">${formatDateTime(m.createdAt)}</span>
      ${details.length ? `<span class="history__detail meta">${details.map(esc).join(' · ')}</span>` : ''}
    </li>`;
}
