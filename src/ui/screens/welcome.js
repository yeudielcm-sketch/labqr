// #/entrar (F7): "¿Quién eres?". No password: any role can be picked, and changed later.
import { ROLES } from '../../domain/roles.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { icons } from '../components/icons.js';
import { chooseRole, currentRole } from '../session.js';
import { versionFooter } from '../components/version.js';

export const welcome = {
  title: t.appName,
  tab: null,
  render(view, _params, query) {
    const now = currentRole();
    view.innerHTML = `
      <section class="screen stack welcome">
        <h2 class="welcome__title">${t.roles.title}</h2>
        <p class="meta">${t.roles.intro}</p>
        <div class="role-cards">
          ${ROLES.map((r) => `
            <button type="button" class="label role-card role-card--${r}" data-role="${r}" ${r === now ? 'aria-current="true"' : ''}>
              <span class="role-card__icon">${icons[r]}</span>
              <span class="role-card__name">${t.roles.names[r]}</span>
              <span class="meta">${t.roles.help[r]}</span>
            </button>`).join('')}
        </div>
        ${versionFooter()}
      </section>`;

    view.querySelector('.role-cards').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-role]');
      if (!b || b.disabled) return;
      b.disabled = true;
      await chooseRole(b.dataset.role);
      // Back to where the person was going (e.g. a printed QR opened before choosing a role).
      const next = query.ir?.startsWith('/') && !query.ir.startsWith('/entrar') ? query.ir : '/';
      go(next);
    });
  },
};
