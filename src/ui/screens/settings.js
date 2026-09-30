import { db } from '../../db/schema.js';
import { t } from '../strings.js';
import { versionFooter } from '../components/version.js';

export const settings = {
  title: t.settings.title,
  tab: null,
  back: '/menu',
  async render(view) {
    let dbStatus;
    try {
      await db.open();
      dbStatus = t.settings.storageReady;
    } catch {
      dbStatus = t.settings.storageError;
    }
    const offline = navigator.serviceWorker?.controller ? t.settings.offlineReady : t.settings.offlinePending;
    view.innerHTML = `
      <section class="screen stack">
        <div class="label">
          <h2>${t.settings.storage}</h2>
          <p class="meta">${dbStatus}</p>
          <p class="meta">${offline}</p>
        </div>
        ${versionFooter()}
      </section>`;
  },
};
