// QR generation (SPEC §6): client-side SVG. The QR holds an absolute URL to the item card,
// so the phone's normal camera opens it without the app.
import { renderSVG } from 'uqr';

export function itemUrl(code, origin = location.origin, base = import.meta.env.BASE_URL) {
  return new URL(`${base}#/i/${encodeURIComponent(code)}`, origin).href;
}

// Black on white and ECC level M: most reliable for printed labels and old phone cameras.
export function qrSvg(text) {
  return renderSVG(text, { ecc: 'M', border: 2, blackColor: '#000', whiteColor: '#fff' });
}
