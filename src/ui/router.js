// Hash router (#/...) so GitHub Pages never 404s on reload.
// Routes are patterns like '/i/:code'; the first match wins.

export function matchRoute(routes, path) {
  const parts = path.split('/').filter(Boolean);
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
    if (ok) return { route, params };
  }
  return null;
}

export function currentPath() {
  const hash = location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : '/';
}

export function startRouter(routes, onRoute) {
  const run = () => onRoute(matchRoute(routes, currentPath()), currentPath());
  window.addEventListener('hashchange', run);
  run();
}

export function go(path) {
  location.hash = path;
}
