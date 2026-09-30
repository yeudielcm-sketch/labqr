import { describe, expect, it } from 'vitest';
import { matchRoute } from './router.js';

const routes = [{ path: '/' }, { path: '/articulos' }, { path: '/i/:code' }];

describe('matchRoute', () => {
  it('matches static and param routes', () => {
    expect(matchRoute(routes, '/').route.path).toBe('/');
    expect(matchRoute(routes, '/articulos').route.path).toBe('/articulos');
    expect(matchRoute(routes, '/i/QUI-0007').params).toEqual({ code: 'QUI-0007' });
  });

  it('parses the query', () => {
    const m = matchRoute(routes, '/articulos?bajo=1&q=vaso');
    expect(m.route.path).toBe('/articulos');
    expect(m.query).toEqual({ bajo: '1', q: 'vaso' });
  });

  it('returns null for unknown paths', () => {
    expect(matchRoute(routes, '/nada')).toBe(null);
    expect(matchRoute(routes, '/i')).toBe(null);
  });
});
