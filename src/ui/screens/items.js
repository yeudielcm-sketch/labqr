// Artículos: search + filters over the catalog. Filters live in the URL query so
// Home cards can link to a filtered list and "back" keeps the search.
import { loadCatalog } from '../../db/catalog.js';
import { filterItems, KINDS } from '../../domain/catalog.js';
import { EMPTY_STOCK } from '../../domain/stock.js';
import { replaceQuery } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { flagsHtml, statusFlags, stockMini } from '../components/stockView.js';
import { itemVisual } from '../components/illustrations.js';
import { allowed } from '../session.js';

export function itemRow(item, stock, locationName) {
  return `
    <a class="label label--${item.kind} item-row" href="#/i/${encodeURIComponent(item.code)}">
      ${itemVisual(item, 'md')}
      <span class="item-row__code code">${esc(item.code)}</span>
      <span class="item-row__name">${esc(item.name)}</span>
      <span class="item-row__meta meta">${esc(locationName ?? t.common.none)}</span>
      <span class="item-row__stock">${stockMini(item, stock)}${flagsHtml(statusFlags(item, stock))}</span>
    </a>`;
}

export const items = {
  title: t.items.title,
  tab: '/articulos',
  async render(view, _params, query) {
    const cat = await loadCatalog();
    const f = {
      q: query.q ?? '',
      labId: query.lab ?? '',
      locationId: query.ubic ?? '',
      kind: query.tipo ?? '',
      low: query.bajo === '1',
      expiring: query.caduca === '1',
    };
    const locName = Object.fromEntries(cat.locations.map((l) => [l.id, l.name]));

    if (cat.items.length === 0) {
      view.innerHTML = `
        <section class="screen"><div class="empty">
          <p>${t.items.empty}</p>
          ${allowed('editItem') ? `
          <a class="btn btn--primary" href="#/ajustes">${t.home.loadDemo}</a>
          <a class="btn" href="#/articulos/nuevo">${t.items.add}</a>` : ''}
        </div></section>`;
      return;
    }

    view.innerHTML = `
      <section class="screen stack">
        <input class="field search" type="search" name="q" placeholder="${t.items.search}" value="${esc(f.q)}" autocomplete="off" enterkeyhint="search" />
        <div class="filters">
          <select class="field field--sm" name="lab" aria-label="${t.items.filterLab}">
            <option value="">${t.items.filterLab}: ${t.common.all}</option>
            ${cat.labs.map((l) => `<option value="${l.id}"${l.id === f.labId ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}
          </select>
          <select class="field field--sm" name="ubic" aria-label="${t.items.filterLocation}"></select>
        </div>
        <div class="chips" role="group" aria-label="${t.items.filterKind}">
          ${KINDS.map((k) => `<button type="button" class="chip chip--${k}" data-kind="${k}" aria-pressed="${f.kind === k}">${t.kinds[k]}</button>`).join('')}
          <button type="button" class="chip" data-toggle="low" aria-pressed="${f.low}"><span class="hazard" aria-hidden="true"></span>${t.items.low}</button>
          <button type="button" class="chip" data-toggle="expiring" aria-pressed="${f.expiring}"><span class="amber-dot" aria-hidden="true"></span>${t.items.expiring}</button>
        </div>
        <div class="list-head"><p class="meta" data-count></p><button type="button" class="link-btn" data-clear hidden>${t.items.clear}</button></div>
        <div class="list" data-list></div>
        ${allowed('editItem') ? `<a class="fab btn btn--primary" href="#/articulos/nuevo">+ ${t.items.add}</a>` : ''}
      </section>`;

    const $ = (sel) => view.querySelector(sel);
    const locSelect = $('[name="ubic"]');

    const fillLocations = () => {
      const options = cat.locations.filter((l) => !f.labId || l.labId === f.labId);
      if (!options.some((l) => l.id === f.locationId)) f.locationId = '';
      locSelect.innerHTML = `<option value="">${t.items.filterLocation}: ${t.common.all}</option>${options
        .map((l) => `<option value="${l.id}"${l.id === f.locationId ? ' selected' : ''}>${esc(l.name)}</option>`)
        .join('')}`;
    };

    const draw = () => {
      const list = filterItems(cat.items, cat.stocks, f);
      $('[data-count]').textContent = t.items.count(list.length);
      $('[data-clear]').hidden = !(f.q || f.labId || f.locationId || f.kind || f.low || f.expiring);
      $('[data-list]').innerHTML = list.length
        ? list.map((item) => itemRow(item, cat.stocks[item.id] ?? EMPTY_STOCK, locName[item.locationId])).join('')
        : `<div class="empty"><p>${t.items.noResults}</p></div>`;
      for (const b of view.querySelectorAll('[data-kind]')) b.setAttribute('aria-pressed', String(b.dataset.kind === f.kind));
      for (const b of view.querySelectorAll('[data-toggle]')) b.setAttribute('aria-pressed', String(f[b.dataset.toggle]));
      replaceQuery({ q: f.q, lab: f.labId, ubic: f.locationId, tipo: f.kind, bajo: f.low ? '1' : '', caduca: f.expiring ? '1' : '' });
    };

    $('[name="q"]').addEventListener('input', (e) => { f.q = e.target.value; draw(); });
    $('[name="lab"]').addEventListener('change', (e) => { f.labId = e.target.value; fillLocations(); draw(); });
    locSelect.addEventListener('change', (e) => { f.locationId = e.target.value; draw(); });
    view.querySelector('.chips').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.kind) f.kind = f.kind === b.dataset.kind ? '' : b.dataset.kind;
      if (b.dataset.toggle) f[b.dataset.toggle] = !f[b.dataset.toggle];
      draw();
    });
    $('[data-clear]').addEventListener('click', () => {
      Object.assign(f, { q: '', labId: '', locationId: '', kind: '', low: false, expiring: false });
      $('[name="q"]').value = '';
      $('[name="lab"]').value = '';
      fillLocations();
      draw();
    });

    fillLocations();
    draw();
  },
};
