// Escanear (outside a loan): reading a QR opens the item card. Manual entry if the camera fails.
import { db } from '../../db/schema.js';
import { extractCode } from '../../domain/codes.js';
import { cameraSupported, confirmRead, startScanner } from '../../qr/scan.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';

let stopCamera = null;

export const scan = {
  title: t.scan.title,
  tab: '/escanear',
  leave() {
    stopCamera?.();
    stopCamera = null;
  },
  async render(view) {
    view.innerHTML = `
      <section class="scanner">
        <div class="scanner__frame" data-frame>
          <video class="scanner__video" data-video aria-label="${t.scan.aim}"></video>
          <div class="scanner__target" aria-hidden="true"></div>
        </div>
        <p class="scanner__status" role="status" data-status>${t.scan.starting}</p>
        <form class="scanner__manual" data-manual>
          <input class="field code-input" name="code" placeholder="${t.scan.manualPh}" autocomplete="off" autocapitalize="characters" enterkeyhint="go" aria-label="${t.scan.manual}" />
          <button class="btn btn--primary" type="submit">${t.scan.open}</button>
        </form>
      </section>`;

    const status = view.querySelector('[data-status]');
    const frame = view.querySelector('[data-frame]');
    const say = (text, bad = false) => {
      status.textContent = text;
      status.classList.toggle('scanner__status--bad', bad);
    };

    const openCode = async (raw) => {
      const code = extractCode(raw);
      if (!code) return say(t.scan.notCode, true);
      const exists = await db.items.where('code').equals(code).count();
      if (!exists) return say(t.scan.notFound(esc(code)), true);
      go(`/i/${encodeURIComponent(code)}`);
    };

    view.querySelector('[data-manual]').addEventListener('submit', (e) => {
      e.preventDefault();
      const value = e.target.code.value.trim();
      if (!extractCode(value)) return say(t.scan.badInput, true);
      openCode(value);
    });

    if (!cameraSupported()) {
      frame.hidden = true;
      return say(t.scan.noCamera, true);
    }

    try {
      this.leave();
      stopCamera = await startScanner(view.querySelector('[data-video]'), async (text) => {
        frame.classList.remove('scanner__frame--hit');
        void frame.offsetWidth; // restart the pulse animation
        frame.classList.add('scanner__frame--hit');
        confirmRead();
        await openCode(text);
      });
      // The user may have left while the camera was starting.
      if (!view.contains(frame)) return this.leave();
      say(t.scan.aim);
    } catch (err) {
      frame.hidden = true;
      const msg = err?.name === 'NotAllowedError' ? t.scan.denied : err?.name === 'NotFoundError' ? t.scan.noCamera : t.scan.failed;
      say(msg, true);
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'btn';
      retry.textContent = t.scan.retry;
      retry.addEventListener('click', () => this.render(view));
      status.after(retry);
    }
  },
};
