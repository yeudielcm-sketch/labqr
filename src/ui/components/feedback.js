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
      <form method="dialog">
        <p>${esc(message)}</p>
        <div class="dialog__actions">
          <button class="btn" value="cancel">${t.common.cancel}</button>
          <button class="btn btn--primary${danger ? ' btn--danger' : ''}" value="ok">${esc(confirmLabel)}</button>
        </div>
      </form>`;
    document.body.append(dlg);
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue === 'ok');
      dlg.remove();
    });
    dlg.showModal();
  });
}
