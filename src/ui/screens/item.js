import { db } from '../../db/schema.js';
import { extractCode } from '../../domain/codes.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';

// #/i/<code>: target of every printed QR.
export const itemByCode = {
  title: t.itemCard.title,
  tab: '/articulos',
  back: '/articulos',
  async render(view, { code }) {
    const clean = extractCode(code) ?? code;
    const item = await db.items.where('code').equals(clean).first();
    if (!item) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.itemCard.notFound(esc(clean))}</p></div></section>`;
      return;
    }
    view.innerHTML = `<section class="screen"><div class="label"><h2>${esc(item.name)}</h2><p class="code">${esc(item.code)}</p></div></section>`;
  },
};
