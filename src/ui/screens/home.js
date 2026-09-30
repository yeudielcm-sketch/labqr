import { loadCatalog } from '../../db/catalog.js';
import { EMPTY_STOCK, isExpired, isExpiringSoon, isLowStock } from '../../domain/stock.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { cylinderSvg } from '../components/cylinder.js';
import { versionFooter } from '../components/version.js';

export const home = {
  title: t.home.title,
  tab: '/',
  async render(view, _params, query) {
    const cat = await loadCatalog();
    if (cat.items.length === 0) {
      view.innerHTML = `
        <section class="screen">
          <div class="empty">
            ${cylinderSvg({ onHand: 0, title: 'Probeta vacía' })}
            <p>${t.home.empty}</p>
            <a class="btn btn--primary" href="#/ajustes">${t.home.loadDemo}</a>
            <a class="btn" href="#/articulos/nuevo">${t.home.addItem}</a>
          </div>
          ${versionFooter()}
        </section>`;
      return;
    }

    const labId = query.lab ?? '';
    const items = cat.items.filter((i) => !i.archived && (!labId || i.labId === labId));
    const stockOf = (i) => cat.stocks[i.id] ?? EMPTY_STOCK;
    const low = items.filter((i) => isLowStock(i, stockOf(i)));
    const expiring = items.filter((i) => isExpiringSoon(i));
    const expired = items.filter((i) => isExpired(i));
    const lent = items.filter((i) => stockOf(i).lentOut > 0);
    const labQ = labId ? `&lab=${labId}` : '';

    // Overall level: share of pieces in the lab vs. total (just the headline cylinder).
    const onHand = items.reduce((s, i) => s + (i.unit === 'pz' ? stockOf(i).onHand : 0), 0);
    const lentOut = items.reduce((s, i) => s + (i.unit === 'pz' ? stockOf(i).lentOut : 0), 0);

    view.innerHTML = `
      <section class="screen stack home">
        <select class="field lab-select" aria-label="${t.items.filterLab}">
          <option value="">${t.home.allLabs}</option>
          ${cat.labs.map((l) => `<option value="${l.id}" ${l.id === labId ? 'selected' : ''}>Laboratorio ${esc(l.name)}</option>`).join('')}
        </select>

        <div class="home-hero">
          ${cylinderSvg({ onHand, lentOut, size: 0.8, title: 'Piezas en laboratorio' })}
          <div>
            <p class="big-num">${items.length}</p>
            <p>${t.home.itemsWord(items.length)}</p>
            <p class="meta">${lent.length ? t.home.lent(lent.length) : t.home.allGood}</p>
          </div>
        </div>

        <nav class="status-cards">
          ${card(`#/articulos?bajo=1${labQ}`, t.home.low(low.length), low.length, 'hazard')}
          ${card(`#/articulos?caduca=1${labQ}`, t.home.expiring(expiring.length), expiring.length, 'amber')}
          ${expired.length ? card(`#/articulos?caduca=1${labQ}`, t.home.expired(expired.length), expired.length, 'hazard') : ''}
        </nav>

        <p class="meta">${t.home.loansSoon}</p>
        ${versionFooter()}
      </section>`;

    view.querySelector('.lab-select').addEventListener('change', (e) => {
      location.hash = e.target.value ? `/?lab=${e.target.value}` : '/';
    });
  },
};

function card(href, text, n, level) {
  const marker = level === 'hazard' ? '<span class="hazard" aria-hidden="true"></span>' : '<span class="amber-dot" aria-hidden="true"></span>';
  return `<a class="status-card${n ? ` status-card--${level}` : ' status-card--calm'}" href="${href}">${n ? marker : ''}<span>${text}</span><span aria-hidden="true">›</span></a>`;
}
