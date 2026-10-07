// QR generation (SPEC §6): client-side SVG. The QR holds an absolute URL to the item card,
// so the phone's normal camera opens it without the app.
import { renderSVG } from 'uqr';

export function itemUrl(code, origin = location.origin, base = import.meta.env.BASE_URL) {
  return new URL(`${base}#/i/${encodeURIComponent(code)}`, origin).href;
}

// A task or request shared phone to phone (F7): #/t/<data> or #/r/<data>.
export function shareUrl(kind, data, origin = location.origin, base = import.meta.env.BASE_URL) {
  return new URL(`${base}#/${kind}/${data}`, origin).href;
}

// Black on white and ECC level M: most reliable for printed labels and old phone cameras.
// Shared tasks/requests use L: they are read from a bright screen and carry more data.
export function qrSvg(text, ecc = 'M') {
  return renderSVG(text, { ecc, border: 2, blackColor: '#000', whiteColor: '#fff' });
}
