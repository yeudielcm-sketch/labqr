import { t } from '../strings.js';

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
