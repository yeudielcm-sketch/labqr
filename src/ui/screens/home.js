import { t } from '../strings.js';
import { cylinderSvg } from '../components/cylinder.js';
import { versionFooter } from '../components/version.js';

export const home = {
  title: t.home.title,
  tab: '/',
  render(view) {
    view.innerHTML = `
      <section class="screen">
        <div class="empty">
          ${cylinderSvg({ onHand: 0, title: 'Probeta vacía' })}
          <p>${t.home.empty}</p>
        </div>
        ${versionFooter()}
      </section>`;
  },
};
