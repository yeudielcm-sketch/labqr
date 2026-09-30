import './styles/tokens.css';
import './styles/base.css';
import './styles/cylinder.css';
import { registerSW } from 'virtual:pwa-register';
import { startRouter } from './ui/router.js';
import { renderShell } from './ui/components/shell.js';
import { home } from './ui/screens/home.js';
import { menu } from './ui/screens/menu.js';
import { settings } from './ui/screens/settings.js';
import { itemByCode } from './ui/screens/item.js';
import { scan, items, loans, labels, backup, notFound } from './ui/screens/simple.js';

const routes = [
  { path: '/', screen: home },
  { path: '/escanear', screen: scan },
  { path: '/articulos', screen: items },
  { path: '/vales', screen: loans },
  { path: '/menu', screen: menu },
  { path: '/ajustes', screen: settings },
  { path: '/etiquetas', screen: labels },
  { path: '/respaldo', screen: backup },
  { path: '/i/:code', screen: itemByCode },
];

const shell = renderShell(document.getElementById('app'));

startRouter(routes, async (match) => {
  const screen = match?.route.screen ?? notFound;
  shell.setChrome({ title: screen.title, tab: screen.tab, back: screen.back });
  await screen.render(shell.view, match?.params ?? {});
  window.scrollTo(0, 0);
});

registerSW({ immediate: true });
