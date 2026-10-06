// Toast (every action answers) and a native <dialog> confirm for destructive actions.
import { t } from '../strings.js';
import { esc } from './html.js';

let toastEl;
let toastTimer;

export function toast(message, { danger = false } = {}) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.toggle('toast--danger', danger);
  toastEl.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 2600);
}

export function confirmDialog(message, options = {}) {
  return openDialog(message, options).then((r) => r.ok);
}

// Same confirmation plus an optional text field (e.g. what happened when something broke).
// Resolves { ok, note }.
export function confirmWithNote(message, { noteLabel, notePlaceholder = '', ...options } = {}) {
  return openDialog(message, { ...options, noteLabel, notePlaceholder }).then((r) => ({ ok: r.ok, note: r.note }));
}

function openDialog(message, { confirmLabel = t.common.confirm, danger = false, noteLabel = null, notePlaceholder = '' } = {}) {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'dialog';
    dlg.innerHTML = `
      <p>${esc(message)}</p>
      ${noteLabel ? `<label class="field-group dialog__note"><span>${esc(noteLabel)}</span><textarea class="field" rows="2" maxlength="200" placeholder="${esc(notePlaceholder)}"></textarea></label>` : ''}
      <div class="dialog__actions">
        <button type="button" class="btn" value="cancel">${t.common.cancel}</button>
        <button type="button" class="btn btn--primary${danger ? ' btn--danger' : ''}" value="ok">${esc(confirmLabel)}</button>
      </div>`;
    // Resolve straight from the tap and remove the element at once, so no closed dialog
    // is ever left in the page waiting for a 'close' event.
    const finish = (ok) => {
      const note = dlg.querySelector('textarea')?.value.trim() ?? '';
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve({ ok, note });
    };
    dlg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) finish(b.value === 'ok');
    });
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(false);
    });
    document.body.append(dlg);
    dlg.showModal();
  });
}
