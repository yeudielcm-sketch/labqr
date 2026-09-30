import { db } from '../../db/schema.js';
import {
  deleteLabIfEmpty, deleteLocationIfEmpty, getSetting, isEmpty, labHasItems,
  saveLab, saveLocation, setSetting, wipeAll,
} from '../../db/catalog.js';
import { loadDemo } from '../../db/seed.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { versionFooter } from '../components/version.js';

const PREFIX_RE = /^[A-Z]{2,5}$/;

export const settings = {
  title: t.settings.title,
  tab: null,
  back: '/menu',
  async render(view) {
    let dbStatus = t.settings.storageReady;
    try {
      await db.open();
    } catch {
      dbStatus = t.settings.storageError;
    }
    const labs = (await db.labs.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const locations = (await db.locations.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const locked = Object.fromEntries(await Promise.all(labs.map(async (l) => [l.id, await labHasItems(l.id)])));
    const loanDays = await getSetting('defaultLoanDays', 0);
    const empty = await isEmpty();
    const offline = navigator.serviceWorker?.controller ? t.settings.offlineReady : t.settings.offlinePending;

    view.innerHTML = `
      <section class="screen stack settings">
        <section class="block">
          <h3>${t.settings.demo}</h3>
          <p class="meta">${empty ? t.settings.demoHelp : t.settings.demoOnlyEmpty}</p>
          <button type="button" class="btn btn--primary btn--block" data-demo ${empty ? '' : 'disabled'}>${t.settings.demoLoad}</button>
        </section>

        <section class="block">
          <h3>${t.settings.labs}</h3>
          ${labs.length ? '' : `<p class="meta">${t.settings.noLabs}</p>`}
          ${labs.map((lab) => `
            <div class="label label--equipment lab-card">
              <form class="lab-form" data-lab="${lab.id}">
                <input class="field" name="labName" value="${esc(lab.name)}" aria-label="${t.settings.labName}" required maxlength="40" />
                <input class="field code-input prefix" name="prefix" value="${esc(lab.prefix)}" aria-label="${t.settings.labPrefix}" maxlength="5" autocapitalize="characters" ${locked[lab.id] ? `readonly title="${t.settings.labPrefixLocked}"` : ''} />
              </form>
              <ul class="loc-list">
                ${locations.filter((l) => l.labId === lab.id).map((loc) => `
                  <li>
                    <form class="loc-form" data-loc="${loc.id}">
                      <input class="field field--sm" name="locName" value="${esc(loc.name)}" aria-label="${t.settings.locations}" required maxlength="60" />
                      <button class="icon-btn icon-btn--sm" type="button" data-del-loc="${loc.id}" aria-label="${t.common.delete} ${esc(loc.name)}">×</button>
                    </form>
                  </li>`).join('')}
                <li>
                  <form class="loc-form" data-new-loc="${lab.id}">
                    <input class="field field--sm" name="locName" placeholder="${t.settings.locationPh}" required maxlength="60" />
                    <button class="btn btn--sm" type="submit">${t.settings.addLocation}</button>
                  </form>
                </li>
              </ul>
              ${locked[lab.id] ? '' : `<button type="button" class="link-btn link-btn--danger" data-del-lab="${lab.id}">${t.common.delete} ${esc(lab.name)}</button>`}
            </div>`).join('')}
          <form class="lab-form lab-form--new" data-new-lab>
            <input class="field" name="labName" placeholder="${t.settings.labNamePh}" aria-label="${t.settings.labName}" required maxlength="40" />
            <input class="field code-input prefix" name="prefix" placeholder="${t.settings.labPrefixPh}" aria-label="${t.settings.labPrefix}" maxlength="5" autocapitalize="characters" required />
            <button class="btn btn--primary" type="submit">${t.settings.addLab}</button>
          </form>
          <p class="meta">${t.settings.labPrefixHelp}</p>
        </section>

        <section class="block">
          <h3>${t.settings.loanDays}</h3>
          <form class="inline-form" data-loan-days>
            <input class="field field--num" name="days" type="number" min="0" max="60" inputmode="numeric" value="${loanDays}" />
            <button class="btn" type="submit">${t.common.save}</button>
          </form>
          <p class="meta">${t.settings.loanDaysHelp}</p>
        </section>

        <section class="block">
          <h3>${t.settings.storage}</h3>
          <p class="meta">${dbStatus}</p>
          <p class="meta">${offline}</p>
        </section>

        <section class="block danger-zone">
          <h3>${t.settings.wipe}</h3>
          <p class="meta">${t.settings.wipeHelp}</p>
          <form class="stack" data-wipe>
            <input class="field code-input" name="word" placeholder="${t.settings.wipeType}" autocomplete="off" autocapitalize="characters" aria-label="${t.settings.wipeType}" />
            <button class="btn btn--block btn--danger-outline" type="submit" disabled>${t.settings.wipeConfirm}</button>
          </form>
        </section>

        ${versionFooter()}
      </section>`;

    const root = view.querySelector('.settings');
    const rerender = () => this.render(view);
    const prefixTaken = (prefix, exceptId) => labs.some((l) => l.prefix === prefix && l.id !== exceptId);

    view.querySelector('[data-demo]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      const { items } = await loadDemo();
      toast(t.settings.demoLoaded(items));
      go('/');
    });

    root.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;

      if (form.matches('[data-lab], [data-new-lab]')) {
        const id = form.dataset.lab;
        const name = form.labName.value.trim();
        const prefix = form.prefix.value.trim().toUpperCase();
        if (!name || !PREFIX_RE.test(prefix)) return toast(t.settings.errLab, { danger: true });
        if (prefixTaken(prefix, id)) return toast(t.settings.errPrefixTaken, { danger: true });
        await saveLab({ id, name, prefix });
        toast(t.settings.labSaved);
        return rerender();
      }

      if (form.matches('[data-loc], [data-new-loc]')) {
        const name = form.locName.value.trim();
        if (!name) return;
        await saveLocation({ id: form.dataset.loc, labId: form.dataset.newLoc, name });
        toast(t.settings.locationSaved);
        return rerender();
      }

      if (form.matches('[data-loan-days]')) {
        const days = Math.max(0, Math.min(60, Number(form.days.value) || 0));
        await setSetting('defaultLoanDays', days);
        return toast(t.settings.loanDaysSaved);
      }

      if (form.matches('[data-wipe]')) {
        if (form.word.value.trim().toUpperCase() !== t.settings.wipeWord) return;
        if (!(await confirmDialog(t.settings.wipeQ, { confirmLabel: t.settings.wipeConfirm, danger: true }))) return;
        await wipeAll();
        toast(t.settings.wipeDone);
        return rerender();
      }
    });

    // Existing labs and locations save when a field is left (change), no extra button.
    root.addEventListener('change', (e) => {
      const form = e.target.closest('[data-lab], [data-loc]');
      if (form) form.requestSubmit();
    });

    view.querySelector('[data-wipe]').addEventListener('input', (e) => {
      const form = e.currentTarget;
      form.querySelector('button').disabled = form.word.value.trim().toUpperCase() !== t.settings.wipeWord;
    });

    root.addEventListener('click', async (e) => {
      const labId = e.target.closest('[data-del-lab]')?.dataset.delLab;
      const locId = e.target.closest('[data-del-loc]')?.dataset.delLoc;
      if (labId) {
        if (!(await confirmDialog(t.settings.labDeleteQ, { confirmLabel: t.common.delete, danger: true }))) return;
        toast((await deleteLabIfEmpty(labId)) ? t.settings.labDeleted : t.settings.labInUse);
        rerender();
      }
      if (locId) {
        if (await deleteLocationIfEmpty(locId)) {
          toast(t.settings.locationDeleted);
          rerender();
        } else {
          toast(t.settings.locationInUse, { danger: true });
        }
      }
    });
  },
};
