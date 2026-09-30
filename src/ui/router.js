// Hash router (#/...) so GitHub Pages never 404s on reload.
// Routes are patterns like '/i/:code'; the first match wins. A query (#/articulos?bajo=1)
// is parsed into `query`.

export function matchRoute(routes, path) {
  const [pathname, search = ''] = path.split('?');
  const parts = pathname.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(search));
  for (const route of routes) {
    const pattern = route.path.split('/').filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params = {};
    const ok = pattern.every((seg, i) => {
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = decodeURIComponent(parts[i]);
        return true;
      }
      return seg === parts[i];
    });
    if (ok) return { route, params, query };
  }
  return null;
}

export function currentPath() {
  const hash = location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/';
}

export function startRouter(routes, onRoute) {
  const run = () => onRoute(matchRoute(routes, currentPath()));
  window.addEventListener('hashchange', run);
  run();
  return run;
}

export function go(path) {
  location.hash = path;
}

// Updates the query without adding history entries or re-rendering the screen.
export function replaceQuery(query) {
  const [pathname] = currentPath().split('?');
  const search = new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString();
  history.replaceState(null, '', `#${pathname}${search ? `?${search}` : ''}`);
}
