import { t } from '../strings.js';

/* global __APP_VERSION__, __BUILD_TIME__ */
export function versionText() {
  const built = new Date(__BUILD_TIME__).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return t.version(__APP_VERSION__, built);
}

export const versionFooter = () => `<p class="meta footer-version">${versionText()}</p>`;
