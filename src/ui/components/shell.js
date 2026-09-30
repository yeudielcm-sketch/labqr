import { t } from '../strings.js';
import { icons } from './icons.js';

const TABS = [
  { path: '/', label: t.tabs.home, icon: icons.home },
  { path: '/escanear', label: t.tabs.scan, icon: icons.scan },
  { path: '/articulos', label: t.tabs.items, icon: icons.items },
  { path: '/vales', label: t.tabs.loans, icon: icons.loans },
];

export function renderShell(root) {
  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <a class="icon-btn" data-back href="#/" aria-label="Regresar" hidden>${icons.back}</a>
        <h1 class="topbar__title" data-title></h1>
        <a class="icon-btn" href="#/menu" aria-label="${t.menu.open}">${icons.menu}</a>
      </header>
      <main data-view></main>
      <nav class="tabbar" aria-label="Navegación principal">
        ${TABS.map((tab) => `<a href="#${tab.path}" data-tab="${tab.path}">${tab.icon}<span>${tab.label}</span></a>`).join('')}
      </nav>
    </div>`;
  return {
    view: root.querySelector('[data-view]'),
    setChrome({ title, tab, back, bare }) {
      root.querySelector('.app').classList.toggle('app--bare', Boolean(bare));
      root.querySelector('[data-title]').textContent = title;
      const backEl = root.querySelector('[data-back]');
      backEl.hidden = !back;
      if (back) backEl.setAttribute('href', `#${back}`);
      for (const a of root.querySelectorAll('[data-tab]')) {
        if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    },
  };
}
