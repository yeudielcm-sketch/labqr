import { t } from '../strings.js';
import { ROLE_TABS } from '../../domain/roles.js';
import { icons } from './icons.js';

const TABS = {
  '/': { label: t.tabs.home, icon: icons.home },
  '/escanear': { label: t.tabs.scan, icon: icons.scan },
  '/articulos': { label: t.tabs.items, icon: icons.items },
  '/vales': { label: t.tabs.loans, icon: icons.loans },
  '/tareas': { label: t.tabs.tasks, icon: icons.tasks },
  '/solicitudes': { label: t.tabs.requests, icon: icons.requests },
};

export function renderShell(root) {
  root.innerHTML = `
    <div class="app">
      <header class="topbar">
        <a class="icon-btn" data-back href="#/" aria-label="Regresar" hidden>${icons.back}</a>
        <h1 class="topbar__title" data-title></h1>
        <a class="role-chip" data-role-chip href="#/entrar" hidden></a>
        <a class="icon-btn" data-menu href="#/menu" aria-label="${t.menu.open}">${icons.menu}</a>
      </header>
      <main data-view></main>
      <nav class="tabbar" aria-label="Navegación principal"></nav>
    </div>`;
  const tabbar = root.querySelector('.tabbar');
  let tabsFor = null;
  return {
    view: root.querySelector('[data-view]'),
    setChrome({ title, tab, back, bare, role, brand }) {
      root.querySelector('.app').classList.toggle('app--bare', Boolean(bare));
      // Without a role (welcome screen) there is nothing to navigate to yet.
      root.querySelector('.app').classList.toggle('app--no-role', !role);
      root.querySelector('[data-menu]').hidden = !role;
      if (role && role !== tabsFor) {
        tabbar.innerHTML = ROLE_TABS[role]
          .map((path) => `<a href="#${path}" data-tab="${path}">${TABS[path].icon}<span>${TABS[path].label}</span></a>`)
          .join('');
        tabsFor = role;
      }
      // Inicio shows the C-Lab mark; every other screen its own title (F8).
      const titleEl = root.querySelector('[data-title]');
      if (brand) titleEl.innerHTML = `<span class="brand">${icons.items}<span>${t.appName}</span></span>`;
      else titleEl.textContent = title;
      // The role is always visible and one tap from changing (F8). Named in full on Inicio,
      // icon only elsewhere so long titles keep their room.
      const chip = root.querySelector('[data-role-chip]');
      chip.hidden = !role;
      if (role) {
        chip.innerHTML = `${icons[role]}${brand ? `<span>${t.roles.short[role]}</span>` : ''}`;
        chip.setAttribute('aria-label', t.roles.chipLabel(t.roles.names[role]));
      }
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
