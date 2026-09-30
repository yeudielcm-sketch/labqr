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

export function confirmDialog(message, { confirmLabel = t.common.confirm, danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'dialog';
    dlg.innerHTML = `
      <p>${esc(message)}</p>
      <div class="dialog__actions">
        <button type="button" class="btn" value="cancel">${t.common.cancel}</button>
        <button type="button" class="btn btn--primary${danger ? ' btn--danger' : ''}" value="ok">${esc(confirmLabel)}</button>
      </div>`;
    // Resolve straight from the tap and remove the element at once, so no closed dialog
    // is ever left in the page waiting for a 'close' event.
    const finish = (ok) => {
      if (dlg.open) dlg.close();
      dlg.remove();
      resolve(ok);
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
