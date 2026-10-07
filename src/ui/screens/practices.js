// Prácticas (F6): a teacher's material list, saved once and used to pre-fill loans.
import { db } from '../../db/schema.js';
import { loadCatalog } from '../../db/catalog.js';
import { getPractice, listPractices, savePractice, setPracticeArchived } from '../../db/practices.js';
import { filterItems } from '../../domain/catalog.js';
import { formatQty, formatQtyInput, parseQty } from '../../domain/quantity.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { lineThumb } from '../components/illustrations.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { allowed } from '../session.js';

const STEP = 100;

export const practiceList = {
  title: t.practices.title,
  tab: null,
  back: '/menu',
  async render(view) {
    const [practices, labs] = await Promise.all([listPractices(), db.labs.toArray()]);
    const labName = Object.fromEntries(labs.map((l) => [l.id, l.name]));
    view.innerHTML = `
      <section class="screen stack">
        <p class="meta">${t.practices.intro}</p>
        <a class="btn btn--primary btn--block" href="#/practicas/nueva">+ ${t.practices.add}</a>
        ${practices.length
          ? `<div class="list">${practices.map((p) => `
              <a class="label practice-row" href="#/practicas/${esc(p.id)}">
                <span class="practice-row__name">${esc(p.name)}</span>
                <span class="meta">${esc([labName[p.labId], p.teacher].filter(Boolean).join(' · '))}</span>
                <span class="meta">${t.practices.count(p.items?.length ?? 0)}</span>
              </a>`).join('')}</div>`
          : `<div class="empty"><p>${t.practices.empty}</p></div>`}
      </section>`;
  },
};

function formScreen(mode) {
  return {
    title: mode === 'new' ? t.practices.newTitle : t.practices.editTitle,
    tab: null,
    back: '/practicas',
    async render(view, params) {
      const [cat, existing] = await Promise.all([loadCatalog(), mode === 'edit' ? getPractice(params.id) : null]);
      if (mode === 'edit' && !existing) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${t.practices.notFound}</p></div></section>`;
        return;
      }
      if (!cat.labs.length) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${t.itemForm.needLab}</p><a class="btn btn--primary" href="#/ajustes">${t.itemForm.goSettings}</a></div></section>`;
        return;
      }
      const itemsById = Object.fromEntries(cat.items.map((i) => [i.id, i]));
      const state = {
        name: existing?.name ?? '',
        teacher: existing?.teacher ?? '',
        labId: existing?.labId ?? cat.labs[0].id,
        items: (existing?.items ?? []).filter((l) => itemsById[l.itemId]).map((l) => ({ ...l })),
      };

      view.innerHTML = `
        <form class="screen stack practice-form" novalidate>
          <label class="field-group"><span>${t.practices.name}</span>
            <input class="field" name="pname" maxlength="80" value="${esc(state.name)}" placeholder="${t.practices.namePh}" /></label>
          <div class="row-2">
            <label class="field-group"><span>${t.practices.lab}</span>
              <select class="field" name="labId">${cat.labs.map((l) => `<option value="${l.id}" ${l.id === state.labId ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>
            <label class="field-group"><span>${t.practices.teacher}</span>
              <input class="field" name="teacher" maxlength="60" value="${esc(state.teacher)}" placeholder="${t.practices.teacherPh}" /></label>
          </div>
          <section class="block">
            <h3>${t.practices.items}</h3>
            <input class="field search" type="search" name="q" placeholder="${t.practices.search}" autocomplete="off" />
            <ul class="results" data-results></ul>
            <ul class="lines" data-lines></ul>
          </section>
          <p class="form-error" role="alert" data-error hidden></p>
          <div class="form-actions">
            <a class="btn" href="#/practicas">${t.common.cancel}</a>
            <button class="btn btn--primary" type="submit">${t.common.save}</button>
          </div>
          ${existing ? `
            ${allowed('tasks') ? `<a class="btn btn--block" href="#/tareas/nueva?practica=${esc(existing.id)}">${t.practices.assign}</a>` : ''}
            <a class="btn btn--block" href="#/vales/nuevo?practica=${esc(existing.id)}">${t.practices.useInLoan}</a>
            <button type="button" class="btn btn--block btn--danger-outline" data-archive>${t.practices.archive}</button>` : ''}
        </form>`;

      const form = view.querySelector('form');
      const $ = (s) => view.querySelector(s);

      const drawLines = () => {
        $('[data-lines]').innerHTML = state.items.length
          ? state.items.map((l) => {
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
              <li class="line line--thumb label label--${item.kind}${l.qty > 0 ? '' : ' line--bad'}">${lineThumb(item)}
                <div class="line__head"><span class="line__name">${esc(item.name)}</span><span class="code line__code">${esc(item.code)}</span></div>
                <div class="line__body"><span></span>${control}
                  <button type="button" class="icon-btn icon-btn--sm" data-remove="${l.itemId}" aria-label="${t.newLoan.remove} ${esc(item.name)}">×</button></div>
              </li>`;
          }).join('')
          : `<li class="meta lines__empty">${t.practices.itemsEmpty}</li>`;
      };

      const drawResults = (q) => {
        const found = q.trim() ? filterItems(cat.items, cat.stocks, { q, labId: form.labId.value }).slice(0, 6) : [];
        $('[data-results]').innerHTML = found
          .map((i) => `<li><button type="button" class="result label--${i.kind}" data-add="${i.id}"><span class="code">${esc(i.code)}</span><span>${esc(i.name)}</span><span class="meta">${formatQty(cat.stocks[i.id]?.onHand ?? 0)} ${i.unit}</span></button></li>`)
          .join('');
      };

      form.q.addEventListener('input', (e) => drawResults(e.target.value));
      form.labId.addEventListener('change', () => drawResults(form.q.value));
      $('[data-results]').addEventListener('click', (e) => {
        const id = e.target.closest('[data-add]')?.dataset.add;
        if (!id) return;
        const line = state.items.find((l) => l.itemId === id);
        if (line && itemsById[id].kind !== 'equipment') line.qty += STEP;
        else if (!line) state.items.push({ itemId: id, qty: STEP });
        form.q.value = '';
        drawResults('');
        drawLines();
      });
      $('[data-lines]').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.remove) state.items = state.items.filter((l) => l.itemId !== b.dataset.remove);
        const line = state.items.find((l) => l.itemId === (b.dataset.inc || b.dataset.dec));
        if (line && b.dataset.inc) line.qty += STEP;
        if (line && b.dataset.dec) line.qty = Math.max(STEP, line.qty - STEP);
        drawLines();
      });
      $('[data-lines]').addEventListener('change', (e) => {
        const line = state.items.find((l) => l.itemId === e.target.dataset.qty);
        if (!line) return;
        line.qty = parseQty(e.target.value) ?? 0;
        drawLines();
      });

      let saving = false;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (saving) return;
        saving = true;
        const res = await savePractice({ id: existing?.id, name: form.pname.value, teacher: form.teacher.value, labId: form.labId.value, items: state.items });
        saving = false;
        if (res.problem) {
          const err = $('[data-error]');
          err.textContent = t.practices.errors[res.problem];
          err.hidden = false;
          return;
        }
        toast(t.practices.saved);
        go('/practicas');
      });

      $('[data-archive]')?.addEventListener('click', async () => {
        if (!(await confirmDialog(t.practices.archiveQ, { confirmLabel: t.practices.archive, danger: true }))) return;
        await setPracticeArchived(existing.id, true);
        toast(t.practices.archived);
        go('/practicas');
      });

      drawLines();
    },
  };
}

export const practiceNew = formScreen('new');
export const practiceEdit = formScreen('edit');
