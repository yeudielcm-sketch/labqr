import './styles/tokens.css';
import './styles/base.css';
import './styles/cylinder.css';
import './styles/screens.css';
import './styles/labels.css';
import './styles/board.css';
import { registerSW } from 'virtual:pwa-register';
import { startRouter } from './ui/router.js';
import { renderShell } from './ui/components/shell.js';
import { home } from './ui/screens/home.js';
import { menu } from './ui/screens/menu.js';
import { settings } from './ui/screens/settings.js';
import { items } from './ui/screens/items.js';
import { itemByCode } from './ui/screens/item.js';
import { newItem, editItem } from './ui/screens/itemForm.js';
import { scan } from './ui/screens/scan.js';
import { labels } from './ui/screens/labels.js';
import { loans } from './ui/screens/loans.js';
import { loanNew } from './ui/screens/loanNew.js';
import { loanDetail } from './ui/screens/loanDetail.js';
import { backup } from './ui/screens/backup.js';
import { board } from './ui/screens/board.js';
import { practiceList, practiceNew, practiceEdit } from './ui/screens/practices.js';
import { notAllowed, notFound } from './ui/screens/simple.js';
import { welcome } from './ui/screens/welcome.js';
import { taskDetail, taskEdit, taskList, taskNew } from './ui/screens/tasks.js';
import { requestDetail, requestList, requestNew } from './ui/screens/requests.js';
import { sharedRequest, sharedTask } from './ui/screens/shared.js';
import { requestPersistence } from './db/backupStore.js';
import { go } from './ui/router.js';
import { allowed, currentRole, loadRole } from './ui/session.js';

// `allow`: the action a role needs to open the screen (src/domain/roles.js). No `allow` = any role.
const routes = [
  { path: '/', screen: home },
  { path: '/entrar', screen: welcome },
  { path: '/escanear', screen: scan },
  { path: '/articulos', screen: items },
  { path: '/articulos/nuevo', screen: newItem, allow: 'editItem' },
  { path: '/vales', screen: loans, allow: 'lend' },
  { path: '/vales/nuevo', screen: loanNew, allow: 'lend' },
  { path: '/vales/:id', screen: loanDetail, allow: 'lend' },
  { path: '/tareas', screen: taskList, allow: 'tasks' },
  { path: '/tareas/nueva', screen: taskNew, allow: 'tasks' },
  { path: '/tareas/:id', screen: taskDetail },
  { path: '/tareas/:id/editar', screen: taskEdit, allow: 'tasks' },
  { path: '/solicitudes', screen: requestList },
  { path: '/solicitudes/nueva', screen: requestNew, allow: 'request' },
  { path: '/solicitudes/:id', screen: requestDetail },
  { path: '/menu', screen: menu },
  { path: '/ajustes', screen: settings },
  { path: '/etiquetas', screen: labels, allow: 'labels' },
  { path: '/respaldo', screen: backup, allow: 'admin' },
  { path: '/tablero', screen: board },
  { path: '/practicas', screen: practiceList, allow: 'practices' },
  { path: '/practicas/nueva', screen: practiceNew, allow: 'practices' },
  { path: '/practicas/:id', screen: practiceEdit, allow: 'practices' },
  { path: '/t/:data', screen: sharedTask },
  { path: '/r/:data', screen: sharedRequest },
  { path: '/i/:code', screen: itemByCode },
  { path: '/i/:code/editar', screen: editItem, allow: 'editItem' },
];

const shell = renderShell(document.getElementById('app'));
let lastPath = '';
let current = null;

// The role is read once before the first screen, so no screen ever renders without it.
loadRole().catch(() => null).then(() => startRouter(routes, async (match) => {
  const path = location.hash.split('?')[0];
  // No role yet (first open, or after "Borrar todo"): ask first, then come back here.
  // The exhibition board stays open without a role.
  if (!currentRole() && match?.route.screen !== welcome && match?.route.screen !== board) {
    const target = location.hash.replace(/^#/, '') || '/';
    return go(target === '/' ? '/entrar' : `/entrar?ir=${encodeURIComponent(target)}`);
  }
  let screen = match?.route.screen ?? notFound;
  if (match?.route.allow && !allowed(match.route.allow)) screen = notAllowed;
  current?.leave?.();
  current = screen;
  shell.setChrome({ title: screen.title, tab: screen.tab, back: screen.back, bare: screen.bare, brand: screen.brand, role: currentRole() });
  await screen.render(shell.view, match?.params ?? {}, match?.query ?? {});
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
}));

// Check for a new version every hour while the app stays open (GitHub Pages caches up to 10 min).
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});
requestPersistence().catch(() => {});
