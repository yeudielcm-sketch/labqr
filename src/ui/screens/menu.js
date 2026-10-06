import { t } from '../strings.js';

export const menu = {
  title: t.menu.title,
  tab: null,
  back: '/',
  render(view) {
    view.innerHTML = `
      <section class="screen menu-list">
        <a class="label" href="#/ajustes">${t.menu.settings}</a>
        <a class="label" href="#/practicas">${t.menu.practices}</a>
        <a class="label" href="#/etiquetas">${t.menu.labels}</a>
        <a class="label" href="#/respaldo">${t.menu.backup}</a>
        <a class="label" href="#/tablero">${t.menu.board}</a>
      </section>`;
  },
};
