// Screens that are only an empty or pending state in F0.
import { t } from '../strings.js';

const emptyScreen = (title, tab, text, back) => ({
  title,
  tab,
  back,
  render(view) {
    view.innerHTML = `<section class="screen"><div class="empty"><p>${text}</p></div></section>`;
  },
});

export const backup = emptyScreen(t.menu.backup, null, t.pending.body, '/menu');

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
