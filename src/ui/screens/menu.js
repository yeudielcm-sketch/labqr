import { t } from '../strings.js';
import { allowed, currentRole } from '../session.js';

// Each role sees only what it uses (F7); "Cambiar de rol" is always there.
export const menu = {
  title: t.menu.title,
  tab: null,
  back: '/',
  render(view) {
    const entries = [
      ['#/ajustes', t.menu.settings, true],
      ['#/practicas', t.menu.practices, allowed('practices')],
      ['#/tareas', t.menu.tasks, allowed('tasks')],
      ['#/solicitudes', t.menu.requests, allowed('decideRequest')],
      ['#/etiquetas', t.menu.labels, allowed('labels')],
      ['#/respaldo', t.menu.backup, allowed('admin')],
      ['#/tablero', t.menu.board, allowed('admin')],
      ['#/entrar', t.menu.role(t.roles.names[currentRole()]), true],
    ];
    view.innerHTML = `
      <section class="screen menu-list">
        ${entries.filter(([, , show]) => show).map(([href, label]) => `<a class="label" href="${href}">${label}</a>`).join('')}
      </section>`;
  },
};
