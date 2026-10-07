import { t } from '../strings.js';
import { icons } from '../components/icons.js';
import { allowed, currentRole } from '../session.js';

// Each role sees only what it uses (F7); "Cambiar de rol" is always there. Every entry says
// what it is for, so nobody needs the manual to find it (F8).
export const menu = {
  title: t.menu.title,
  tab: null,
  back: '/',
  render(view) {
    const role = currentRole();
    const entries = [
      ['#/practicas', 'practices', t.menu.practices, t.menu.help.practices, allowed('practices')],
      ['#/tareas', 'tasks', t.menu.tasks, t.menu.help.tasks, allowed('tasks')],
      ['#/solicitudes', 'requests', t.menu.requests, t.menu.help.requests, allowed('decideRequest')],
      ['#/etiquetas', 'labels', t.menu.labels, t.menu.help.labels, allowed('labels')],
      ['#/respaldo', 'backup', t.menu.backup, t.menu.help.backup, allowed('admin')],
      ['#/tablero', 'board', t.menu.board, t.menu.help.board, allowed('admin')],
      ['#/ajustes', 'settings', t.menu.settings, allowed('admin') ? t.menu.help.settings : t.menu.help.settingsBasic, true],
      ['#/entrar', role, t.menu.roleTitle, t.menu.role(t.roles.names[role]), true],
    ];
    view.innerHTML = `
      <section class="screen menu-list">
        ${entries.filter((e) => e[4]).map(([href, icon, label, help]) => `
          <a class="label menu-item" href="${href}">
            <span class="menu-item__icon">${icons[icon]}</span>
            <span class="menu-item__label">${label}</span>
            <span class="menu-item__help meta">${help}</span>
          </a>`).join('')}
      </section>`;
  },
};
