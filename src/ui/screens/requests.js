// Solicitudes (F7): the student asks for a task's material; the lab staff attends it (the
// loan screen opens already filled) or rejects it with a reason the student can read.
import { getSetting, loadCatalog, setSetting } from '../../db/catalog.js';
import { getPractice } from '../../db/practices.js';
import { createRequest, getRequest, getTask, listRequests, rejectRequest } from '../../db/requests.js';
import { linesFromPractice } from '../../domain/practices.js';
import { canDecide } from '../../domain/requests.js';
import { formatQtyInput, parseQty } from '../../domain/quantity.js';
import { EMPTY_STOCK } from '../../domain/stock.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmWithNote, toast } from '../components/feedback.js';
import { formatDateTime } from '../components/format.js';
import { materialList } from '../components/materialList.js';
import { allowed } from '../session.js';

const STEP = 100;

export function requestFlag(status) {
  const marker = { pending: '<span class="open-dot" aria-hidden="true"></span>', rejected: '<span class="hazard" aria-hidden="true"></span>' }[status] ?? '';
  return `<span class="flag flag--${status === 'pending' ? 'open' : status === 'rejected' ? 'hazard' : 'closed'}">${marker}${t.requests.status[status]}</span>`;
}

function requestRow(r) {
  return `
    <a class="label request-row request-row--${r.status}" href="#/solicitudes/${esc(r.id)}">
      <span class="request-row__who">${esc(r.name)}${r.group ? ` · ${esc(r.group)}` : ''}</span>
      <span class="request-row__when meta">${formatDateTime(r.createdAt)}</span>
      <span class="request-row__practice">${esc(r.practice || '—')}</span>
      <span class="request-row__state">${requestFlag(r.status)}</span>
    </a>`;
}

export const requestList = {
  title: t.requests.title,
  tab: '/solicitudes',
  back: null,
  async render(view) {
    // On a shared device a student sees only their own requests (by control number).
    const student = allowed('request');
    const mine = student ? await getSetting('studentId', '') : null;
    const requests = (await listRequests()).filter((r) => !student || (mine && r.studentId === mine));
    view.innerHTML = `
      <section class="screen stack">
        ${student ? `<p class="meta">${t.requests.onlyYours}</p>` : ''}
        ${requests.length ? `<div class="list">${requests.map(requestRow).join('')}</div>` : `<div class="empty"><p>${t.requests.empty}</p></div>`}
        <p class="meta">${t.requests.sameDevice}</p>
      </section>`;
  },
};

export const requestNew = {
  title: t.requests.newTitle,
  tab: '/solicitudes',
  back: '/',
  async render(view, _params, query) {
    const task = query.tarea ? await getTask(query.tarea) : null;
    const practice = task ? await getPractice(task.practiceId) : null;
    if (!task || !practice || task.archived) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.tasks.notFound}</p><a class="btn btn--primary" href="#/">${t.roles.goHome}</a></div></section>`;
      return;
    }
    const [cat, name, studentId, group] = await Promise.all([
      loadCatalog(), getSetting('studentName', ''), getSetting('studentId', ''), getSetting('studentGroup', ''),
    ]);
    const itemsById = Object.fromEntries(cat.items.map((i) => [i.id, i]));
    const onHand = Object.fromEntries(cat.items.map((i) => [i.id, (cat.stocks[i.id] ?? EMPTY_STOCK).onHand]));
    const lines = linesFromPractice(practice, itemsById, onHand).lines;

    view.innerHTML = `
      <form class="screen stack request-new" novalidate>
        <header class="label task-head">
          <h2 class="task-head__name">${esc(practice.name)}</h2>
          <p class="meta">${esc(task.group)}${practice.teacher ? ` · ${esc(practice.teacher)}` : ''}</p>
        </header>
        <label class="field-group"><span>${t.requests.name}</span>
          <input class="field" name="sname" maxlength="60" autocomplete="name" value="${esc(name)}" placeholder="${t.requests.namePh}" /></label>
        <div class="row-2">
          <label class="field-group"><span>${t.requests.studentId}</span>
            <input class="field code-input" name="sid" maxlength="20" inputmode="numeric" value="${esc(studentId)}" /></label>
          <label class="field-group"><span>${t.requests.group}</span>
            <input class="field" name="sgroup" maxlength="20" value="${esc(group || task.group)}" /></label>
        </div>
        <section class="block">
          <h3>${t.requests.material}</h3>
          <p class="meta">${t.requests.materialHelp}</p>
          <ul class="lines" data-lines></ul>
        </section>
        <p class="form-error" role="alert" data-error hidden></p>
        <button class="btn btn--primary btn--block btn--big" type="submit">${t.requests.send}</button>
      </form>`;

    const form = view.querySelector('form');
    const $ = (s) => view.querySelector(s);
    const lineOf = (id) => lines.find((l) => l.itemId === id);

    const drawLines = () => {
      $('[data-lines]').innerHTML = lines.map((l) => {
        const item = itemsById[l.itemId];
        const control = item.kind === 'equipment'
          ? `<span class="qty-fixed code">1 pz</span>`
          : item.kind === 'material'
            ? `<div class="stepper">
                 <button type="button" class="stepper__btn" data-dec="${l.itemId}" aria-label="Menos">−</button>
                 <input class="field stepper__input code-input" inputmode="numeric" data-qty="${l.itemId}" value="${formatQtyInput(l.qty)}" aria-label="${t.moves.qty}" />
                 <button type="button" class="stepper__btn" data-inc="${l.itemId}" aria-label="Más">+</button>
               </div>`
            : `<div class="qty-unit"><input class="field code-input" inputmode="decimal" data-qty="${l.itemId}" value="${formatQtyInput(l.qty)}" aria-label="${t.moves.qty}" /><span>${item.unit}</span></div>`;
        return `
          <li class="line label label--${item.kind}${l.qty > 0 ? '' : ' line--bad'}">
            <div class="line__head"><span class="line__name">${esc(item.name)}</span><span class="code line__code">${esc(item.code)}</span></div>
            <div class="line__body"><span></span>${control}
              <button type="button" class="icon-btn icon-btn--sm" data-remove="${l.itemId}" aria-label="${t.newLoan.remove} ${esc(item.name)}">×</button></div>
          </li>`;
      }).join('') || `<li class="meta lines__empty">${t.requests.errors.empty}</li>`;
    };

    $('[data-lines]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.remove) lines.splice(lines.findIndex((l) => l.itemId === b.dataset.remove), 1);
      if (b.dataset.inc) lineOf(b.dataset.inc).qty += STEP;
      if (b.dataset.dec) { const l = lineOf(b.dataset.dec); l.qty = Math.max(STEP, l.qty - STEP); }
      drawLines();
    });
    $('[data-lines]').addEventListener('change', (e) => {
      const l = lineOf(e.target.dataset.qty);
      if (!l) return;
      l.qty = parseQty(e.target.value) ?? 0;
      drawLines();
    });

    let sending = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      sending = true;
      try {
        const fields = { name: form.sname.value, studentId: form.sid.value, group: form.sgroup.value };
        const res = await createRequest({ taskId: task.id, practiceId: practice.id, practice: practice.name, labId: practice.labId, ...fields, lines });
        if (res.problem) {
          const err = $('[data-error]');
          err.textContent = t.requests.errors[res.problem];
          err.hidden = false;
          return;
        }
        // Remembered on this device so the next request is faster (device setting, not backed up).
        await Promise.all([setSetting('studentName', fields.name.trim()), setSetting('studentId', fields.studentId.trim())]);
        toast(t.requests.sent);
        go(`/solicitudes/${res.request.id}?enviada=1`);
      } finally {
        sending = false;
      }
    });

    drawLines();
  },
};

export const requestDetail = {
  title: t.requests.detailTitle,
  tab: '/solicitudes',
  back: '/solicitudes',
  async render(view, { id }, query) {
    const [found, cat, mine] = await Promise.all([getRequest(id), loadCatalog(), getSetting('studentId', '')]);
    const student = allowed('request');
    const r = student && found?.studentId !== mine ? null : found;
    if (!r) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.requests.notFound}</p></div></section>`;
      return;
    }
    const itemsById = Object.fromEntries(cat.items.filter((i) => !i.archived).map((i) => [i.id, i]));
    const decide = allowed('decideRequest') && canDecide(r);
    view.innerHTML = `
      <section class="screen stack request-detail">
        ${query.enviada ? `<p class="notice">${t.requests.sentHelp}</p>` : ''}
        <header class="label task-head">
          <div class="task-head__top">${requestFlag(r.status)}<span class="meta">${formatDateTime(r.createdAt)}</span></div>
          <h2 class="task-head__name">${esc(r.name)}</h2>
          <p class="meta">${esc([r.group, r.studentId && `${t.requests.studentId} ${r.studentId}`].filter(Boolean).join(' · '))}</p>
          <p>${t.requests.fromTask(esc(r.practice || '—'))}</p>
          ${r.status === 'rejected' && r.reason ? `<p class="text-hazard">${esc(t.requests.reason(r.reason))}</p>` : ''}
        </header>
        ${decide ? `
          <button type="button" class="btn btn--primary btn--block btn--big" data-attend>${t.requests.attend}</button>
          <p class="meta">${t.requests.attendHelp}</p>` : ''}
        ${r.loanId && allowed('lend') ? `<a class="btn btn--block" href="#/vales/${esc(r.loanId)}">${t.requests.viewLoan}</a>` : ''}
        <section class="block">
          <h3>${t.requests.material}</h3>
          ${materialList(r.lines, itemsById, cat.stocks)}
        </section>
        ${decide ? `<button type="button" class="btn btn--block btn--danger-outline" data-reject>${t.requests.reject}</button>` : ''}
      </section>`;

    view.querySelector('[data-attend]')?.addEventListener('click', () => {
      go(`/vales/nuevo?solicitud=${encodeURIComponent(r.id)}`);
    });

    view.querySelector('[data-reject]')?.addEventListener('click', async () => {
      const res = await confirmWithNote(t.requests.rejectQ, { noteLabel: t.requests.rejectNote, notePlaceholder: t.requests.rejectNotePh, confirmLabel: t.requests.reject, danger: true });
      if (!res.ok) return;
      toast((await rejectRequest(r.id, res.note)) ? t.requests.rejected : t.requests.alreadyDecided, { danger: false });
      this.render(view, { id }, {});
    });
  },
};
