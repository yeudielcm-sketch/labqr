// Etiquetas: pick items → letter-size print sheets with QR + code + name (CSS @media print).
import { getSetting, loadCatalog, setSetting } from '../../db/catalog.js';
import { itemUrl, qrSvg } from '../../qr/generate.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { toast } from '../components/feedback.js';

export const LAYOUTS = {
  large: { perSheet: 10, className: 'sheet--large' },
  small: { perSheet: 24, className: 'sheet--small' },
};

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function labelHtml(item, lab, location) {
  return `
    <div class="qr-label label--${item.kind}">
      <div class="qr-label__qr">${qrSvg(itemUrl(item.code))}</div>
      <div class="qr-label__text">
        <span class="qr-label__code">${esc(item.code)}</span>
        <span class="qr-label__name">${esc(item.name)}</span>
        <span class="qr-label__place">${esc([lab?.name, location?.name].filter(Boolean).join(' · '))}</span>
      </div>
    </div>`;
}

export const labels = {
  title: t.labels.title,
  tab: null,
  back: '/menu',
  async render(view, _params, query) {
    const cat = await loadCatalog();
    const active = cat.items.filter((i) => !i.archived).sort((a, b) => a.code.localeCompare(b.code));
    if (!active.length) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.labels.empty}</p><a class="btn btn--primary" href="#/ajustes">${t.home.loadDemo}</a></div></section>`;
      return;
    }
    const labById = Object.fromEntries(cat.labs.map((l) => [l.id, l]));
    const locById = Object.fromEntries(cat.locations.map((l) => [l.id, l]));
    const preselected = new Set((query.codigos ?? '').split(',').filter(Boolean));
    const selected = new Set(active.filter((i) => preselected.has(i.code)).map((i) => i.id));
    const f = { labId: '', locationId: '' };
    let layout = await getSetting('labelLayout', 'large');

    view.innerHTML = `
      <section class="screen stack labels-screen">
        <p class="meta no-print">${t.labels.intro}</p>
        <div class="filters no-print">
          <select class="field field--sm" name="lab" aria-label="${t.labels.lab}">
            <option value="">${t.labels.lab}: ${t.labels.all}</option>
            ${cat.labs.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}
          </select>
          <select class="field field--sm" name="loc" aria-label="${t.labels.location}"></select>
        </div>
        <div class="chips no-print" role="group" aria-label="${t.labels.layout}">
          <button type="button" class="chip" data-layout="large">${t.labels.large}</button>
          <button type="button" class="chip" data-layout="small">${t.labels.small}</button>
        </div>
        <div class="list-head no-print">
          <button type="button" class="link-btn" data-all>${t.labels.selectAll}</button>
          <button type="button" class="link-btn" data-none>${t.labels.selectNone}</button>
        </div>
        <ul class="pick-list no-print" data-pick></ul>
        <div class="print-bar no-print">
          <span data-summary></span>
          <button type="button" class="btn btn--primary" data-print>${t.labels.print}</button>
        </div>
        <h3 class="no-print">${t.labels.preview}</h3>
        <div class="sheets" data-sheets></div>
      </section>`;

    const $ = (s) => view.querySelector(s);
    const locSelect = $('[name="loc"]');
    const visible = () => active.filter((i) => (!f.labId || i.labId === f.labId) && (!f.locationId || i.locationId === f.locationId));

    const fillLocations = () => {
      const options = cat.locations.filter((l) => !f.labId || l.labId === f.labId);
      locSelect.innerHTML = `<option value="">${t.labels.location}: ${t.labels.all}</option>${options.map((l) => `<option value="${l.id}"${l.id === f.locationId ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}`;
    };

    const drawPick = () => {
      $('[data-pick]').innerHTML = visible()
        .map((i) => `
          <li><label class="pick label--${i.kind}">
            <input type="checkbox" value="${i.id}" ${selected.has(i.id) ? 'checked' : ''} />
            <span class="code">${esc(i.code)}</span>
            <span>${esc(i.name)}</span>
          </label></li>`)
        .join('');
    };

    const drawSheets = () => {
      const chosen = active.filter((i) => selected.has(i.id));
      const { perSheet, className } = LAYOUTS[layout];
      const sheets = chunk(chosen, perSheet);
      $('[data-summary]').textContent = chosen.length ? `${t.labels.selected(chosen.length)} · ${t.labels.sheets(sheets.length)}` : t.labels.none;
      $('[data-print]').disabled = !chosen.length;
      $('[data-sheets]').innerHTML = sheets
        .map((page) => `<div class="sheet ${className}">${page.map((i) => labelHtml(i, labById[i.labId], locById[i.locationId])).join('')}</div>`)
        .join('');
      for (const b of view.querySelectorAll('[data-layout]')) b.setAttribute('aria-pressed', String(b.dataset.layout === layout));
    };

    $('[name="lab"]').addEventListener('change', (e) => { f.labId = e.target.value; f.locationId = ''; fillLocations(); drawPick(); });
    locSelect.addEventListener('change', (e) => { f.locationId = e.target.value; drawPick(); });
    $('[data-pick]').addEventListener('change', (e) => {
      if (e.target.checked) selected.add(e.target.value);
      else selected.delete(e.target.value);
      drawSheets();
    });
    $('[data-all]').addEventListener('click', () => { for (const i of visible()) selected.add(i.id); drawPick(); drawSheets(); });
    $('[data-none]').addEventListener('click', () => { for (const i of visible()) selected.delete(i.id); drawPick(); drawSheets(); });
    view.querySelector('.chips').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-layout]');
      if (!b) return;
      layout = b.dataset.layout;
      await setSetting('labelLayout', layout);
      drawSheets();
    });
    $('[data-print]').addEventListener('click', () => {
      if (!selected.size) return toast(t.labels.none, { danger: true });
      window.print();
    });

    fillLocations();
    drawPick();
    drawSheets();
  },
};
