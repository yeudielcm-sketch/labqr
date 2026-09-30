import './styles/tokens.css';
import './styles/base.css';
import './styles/cylinder.css';
import './styles/screens.css';
import './styles/labels.css';
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
import { notFound } from './ui/screens/simple.js';
import { requestPersistence } from './db/backupStore.js';

const routes = [
  { path: '/', screen: home },
  { path: '/escanear', screen: scan },
  { path: '/articulos', screen: items },
  { path: '/articulos/nuevo', screen: newItem },
  { path: '/vales', screen: loans },
  { path: '/vales/nuevo', screen: loanNew },
  { path: '/vales/:id', screen: loanDetail },
  { path: '/menu', screen: menu },
  { path: '/ajustes', screen: settings },
  { path: '/etiquetas', screen: labels },
  { path: '/respaldo', screen: backup },
  { path: '/i/:code', screen: itemByCode },
  { path: '/i/:code/editar', screen: editItem },
];

const shell = renderShell(document.getElementById('app'));
let lastPath = '';
let current = null;

startRouter(routes, async (match) => {
  const screen = match?.route.screen ?? notFound;
  current?.leave?.();
  current = screen;
  shell.setChrome({ title: screen.title, tab: screen.tab, back: screen.back });
  await screen.render(shell.view, match?.params ?? {}, match?.query ?? {});
  const path = location.hash.split('?')[0];
  if (path !== lastPath) window.scrollTo(0, 0);
  lastPath = path;
});

registerSW({ immediate: true });
requestPersistence().catch(() => {});
