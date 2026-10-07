import { t } from '../strings.js';
import { currentRole } from '../session.js';

// A screen this role does not use (F7). Not a lock: anyone can change role.
export const notAllowed = {
  title: t.appName,
  tab: null,
  back: '/',
  render(view) {
    view.innerHTML = `
      <section class="screen"><div class="empty">
        <p>${t.roles.notAllowed(t.roles.short[currentRole()] ?? '')}</p>
        <p class="meta">${t.roles.notAllowedHelp}</p>
        <a class="btn btn--primary" href="#/">${t.roles.goHome}</a>
        <a class="btn" href="#/entrar">${t.roles.change}</a>
      </div></section>`;
  },
};

export const notFound = {
  title: t.notFound.title,
  tab: null,
  back: '/',
  render(view) {
    view.innerHTML = `
      <section class="screen"><div class="empty">
        <p>${t.notFound.body}</p>
        <a class="btn btn--primary" href="#/">${t.notFound.back}</a>
      </div></section>`;
  },
};
