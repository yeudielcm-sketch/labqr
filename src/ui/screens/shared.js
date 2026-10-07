// Tasks and requests passed between phones by QR (F7). Everything comes inside the QR, so
// #/t/<data> works on a student's phone with no data, and #/r/<data> on the lab's phone.
import { getSetting, loadCatalog, setSetting } from '../../db/catalog.js';
import { importSharedRequest } from '../../db/requests.js';
import { requestProblems } from '../../domain/requests.js';
import { decodeShare, encodeShare, readRequestShare, readTaskShare, requestToShare } from '../../domain/share.js';
import { formatQty, formatQtyInput, parseQty } from '../../domain/quantity.js';
import { qrSvg, shareUrl } from '../../qr/generate.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { toast } from '../components/feedback.js';
import { formatDay } from '../components/format.js';
import { allowed } from '../session.js';
import { lineThumb } from '../components/illustrations.js';

const badQr = (view) => {
  view.innerHTML = `<section class="screen"><div class="empty"><p>${t.share.badQr}</p><a class="btn btn--primary" href="#/">${t.roles.goHome}</a></div></section>`;
};

const taskHead = (task) => `
  <header class="label task-head">
    <span class="task-head__day code">${esc(formatDay(task.date))}</span>
    <h2 class="task-head__name">${esc(task.practice)}</h2>
    <p class="meta">${esc(task.group)}${task.teacher ? ` · ${esc(task.teacher)}` : ''}</p>
    ${task.notes ? `<p class="task-head__notes">${esc(task.notes)}</p>` : ''}
  </header>`;

const sharedLines = (lines) => `
  <ul class="lines">${lines.map((l) => `
    <li class="line line--thumb label label--material">${lineThumb({ name: l.name, unit: l.unit, kind: l.unit === 'pz' ? 'material' : 'reagent' })}
      <div class="line__head"><span class="line__name">${esc(l.name)}</span><span class="code line__code">${esc(l.code)}</span></div>
      <div class="line__body"><span></span><span class="qty-fixed code">${formatQty(l.qty)} ${esc(l.unit)}</span></div>
    </li>`).join('')}</ul>`;

// The big QR block, shown on a screen to be read by another phone. The same link can also be
// sent by WhatsApp when the two people are not together.
export function shareQrBlock(url, help) {
  return `
    <figure class="share-qr">
      <div class="share-qr__code">${qrSvg(url, 'L')}</div>
      <figcaption class="meta">${help}</figcaption>
      <button type="button" class="btn btn--sm" data-share-url="${esc(url)}">${t.share.sendLink}</button>
    </figure>`;
}

export function bindShareButtons(view) {
  view.addEventListener('click', async (e) => {
    const url = e.target.closest('[data-share-url]')?.dataset.shareUrl;
    if (!url) return;
    try {
      if (navigator.share) return await navigator.share({ title: t.appName, url });
      await navigator.clipboard.writeText(url);
      toast(t.share.copied);
    } catch (err) {
      if (err?.name !== 'AbortError') toast(t.share.copyFailed, { danger: true });
    }
  });
}

export const sharedTask = {
  title: t.share.taskTitle,
  tab: null,
  back: '/',
  async render(view, { data }) {
    const task = readTaskShare(decodeShare(data));
    if (!task) return badQr(view);
    view.innerHTML = `
      <section class="screen stack">
        ${taskHead(task)}
        ${allowed('request') ? `<button type="button" class="btn btn--primary btn--block btn--big" data-ask>${t.share.makeRequest}</button>` : ''}
        <section class="block"><h3>${t.tasks.material}</h3>${sharedLines(task.lines)}</section>
      </section>`;
    view.querySelector('[data-ask]')?.addEventListener('click', () => requestForm(view, task));
  },
};

// The student fills in who they are and adjusts quantities; the result is a QR, not a row.
async function requestForm(view, task) {
  const [name, studentId, group] = await Promise.all([getSetting('studentName', ''), getSetting('studentId', ''), getSetting('studentGroup', '')]);
  const lines = task.lines.map((l) => ({ ...l }));
  view.innerHTML = `
    <form class="screen stack" novalidate>
      ${taskHead(task)}
      <label class="field-group"><span>${t.requests.name}</span>
        <input class="field" name="sname" maxlength="60" autocomplete="name" value="${esc(name)}" placeholder="${t.requests.namePh}" /></label>
      <div class="row-2">
        <label class="field-group"><span>${t.requests.studentId}</span>
          <input class="field code-input" name="sid" maxlength="20" inputmode="numeric" value="${esc(studentId)}" /></label>
        <label class="field-group"><span>${t.requests.group}</span>
          <input class="field" name="sgroup" maxlength="20" value="${esc(group || task.group)}" /></label>
      </div>
      <section class="block">
        <h3>${t.requests.material}</h3>
        <p class="meta">${t.requests.materialHelp}</p>
        <ul class="lines">${lines.map((l, i) => `
          <li class="line line--thumb label label--material">${lineThumb({ name: l.name, unit: l.unit, kind: l.unit === 'pz' ? 'material' : 'reagent' })}
            <div class="line__head"><span class="line__name">${esc(l.name)}</span><span class="code line__code">${esc(l.code)}</span></div>
            <div class="line__body"><span></span>
              <div class="qty-unit"><input class="field code-input" inputmode="decimal" data-i="${i}" value="${formatQtyInput(l.qty)}" aria-label="${t.moves.qty} ${esc(l.name)}" /><span>${esc(l.unit)}</span></div>
            </div>
          </li>`).join('')}</ul>
      </section>
      <p class="form-error" role="alert" data-error hidden></p>
      <button class="btn btn--primary btn--block btn--big" type="submit">${t.share.requestQr}</button>
    </form>`;

  const form = view.querySelector('form');
  form.addEventListener('change', (e) => {
    if (e.target.dataset.i !== undefined) lines[Number(e.target.dataset.i)].qty = parseQty(e.target.value) ?? 0;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = { name: form.sname.value.trim(), studentId: form.sid.value.trim(), group: form.sgroup.value.trim() };
    const kept = lines.filter((l) => l.qty !== 0);
    const problem = requestProblems({ ...fields, lines: kept });
    if (problem) {
      const err = view.querySelector('[data-error]');
      err.textContent = t.requests.errors[problem];
      err.hidden = false;
      return;
    }
    await Promise.all([setSetting('studentName', fields.name), setSetting('studentId', fields.studentId)]);
    const data = encodeShare(requestToShare({ id: crypto.randomUUID(), task, ...fields, lines: kept }));
    go(`/r/${data}`);
  });
}

export const sharedRequest = {
  title: t.share.requestTitle,
  tab: null,
  back: '/',
  async render(view, { data }) {
    const shared = readRequestShare(decodeShare(data));
    if (!shared) return badQr(view);

    // The lab staff imports it; anyone else sees the QR to show (and can come back to it).
    if (allowed('decideRequest')) {
      const cat = await loadCatalog();
      const res = await importSharedRequest(shared, cat.items);
      if (res.problem) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${res.problem === 'empty' ? t.share.nothingKnown : t.requests.errors[res.problem]}</p></div></section>`;
        return;
      }
      toast(res.missing.length ? t.share.missing(res.missing.join(', ')) : t.share.imported, { danger: res.missing.length > 0 });
      return go(`/solicitudes/${res.request.id}`);
    }

    view.innerHTML = `
      <section class="screen stack">
        <header class="label task-head">
          <h2 class="task-head__name">${esc(shared.practice)}</h2>
          <p class="meta">${esc([shared.name, shared.group, shared.studentId && `${t.requests.studentId} ${shared.studentId}`].filter(Boolean).join(' · '))}</p>
        </header>
        ${shareQrBlock(shareUrl('r', data), allowed('request') ? t.share.requestQrHelp : t.share.forLabOnly)}
        ${allowed('request') ? `<p class="meta">${t.share.requestQrSave}</p>` : ''}
      </section>`;
    bindShareButtons(view.firstElementChild);
  },
};
