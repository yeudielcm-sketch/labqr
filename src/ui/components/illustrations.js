// Item illustrations (F8): original line drawings of lab material, in the same language as
// the cylinder (DESIGN.md): graphite outline, "glass" liquid, amber for reagent bottles.
// An item with a real photo shows the photo; otherwise the drawing that matches its name,
// or a generic one for its kind. New drawings are added here as the authors make them.
import { isPhoto } from './photo.js';

const svg = (body) => `<svg viewBox="0 0 48 48" class="ill" aria-hidden="true" focusable="false">${body}</svg>`;

// Reagent label: a tiny lab label with the amber stripe, as on the real bottles.
const label = (x, y, w, h) => `<rect class="ill-paper" x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/><rect class="ill-amber" x="${x}" y="${y}" width="3" height="${h}"/><path class="ill-thin" d="M${x + 6} ${y + h / 2 - 2}h${w - 10}M${x + 6} ${y + h / 2 + 2}h${w - 14}"/>`;

const DRAWINGS = {
  beaker: svg(`<path class="ill-liquid" d="M15 24h18v14a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2z"/>
    <path class="ill-line" d="M11 8h4M15 8v30a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8"/>
    <path class="ill-thin" d="M33 16h-5M33 22h-3M33 28h-5M33 34h-3"/>`),
  flask: svg(`<path class="ill-liquid" d="M15.4 30h17.2l4 7.8a1.4 1.4 0 0 1-1.3 2.2H12.7a1.4 1.4 0 0 1-1.3-2.2z"/>
    <path class="ill-line" d="M19 6h10M21 6v13l-10 19a1.6 1.6 0 0 0 1.4 2.4h23.2A1.6 1.6 0 0 0 37 38L27 19V6"/>
    <path class="ill-thin" d="M20 30h4M18 34h4"/>`),
  cylinder: svg(`<rect class="ill-liquid" x="19.5" y="20" width="9" height="19"/>
    <path class="ill-line" d="M17 5h2M19 5v34h10V5h2M13 44h22l-6-5H19z"/>
    <path class="ill-thin" d="M29 10h-4M29 15h-3M29 20h-4M29 25h-3M29 30h-4M29 35h-3"/>`),
  pipette: svg(`<g transform="rotate(25 24 24)"><rect class="ill-liquid" x="22.6" y="22" width="2.8" height="14"/>
    <path class="ill-line" d="M22 3v33l2 9 2-9V3z"/>
    <path class="ill-thin" d="M26 10h-2M26 15h-2M26 20h-2M26 25h-2M26 30h-2"/></g>`),
  burette: svg(`<rect class="ill-liquid" x="21.5" y="12" width="5" height="22"/>
    <path class="ill-line" d="M21 3v31h6V3M17 34h14v3H17zM23 37h2l-1 7z"/>
    <path class="ill-thin" d="M27 8h-3M27 13h-2M27 18h-3M27 23h-2M27 28h-3"/>`),
  testTube: svg(`<g transform="rotate(-18 24 24)"><path class="ill-liquid" d="M19.5 25h9v9a4.5 4.5 0 0 1-9 0z"/>
    <path class="ill-line" d="M17 5h14M19 5v29a5 5 0 0 0 10 0V5"/></g>`),
  tongs: svg(`<path class="ill-thin ill-bold" d="M13 44l10-18c1.5-3 1-9-3-17M35 44L25 26c-1.5-3-1-9 3-17"/>
    <path class="ill-thin ill-bold" d="M20 9c-2-2-1-5 2-5M28 9c2-2 1-5-2-5"/>
    <circle class="ill-metal" cx="24" cy="27" r="2.4"/>`),
  burner: svg(`<path class="ill-amber-fill" d="M24 3c4 4 4 9 0 10-4-1-4-6 0-10z"/>
    <path class="ill-line" d="M21 14h6v24h-6zM18 28h12v4H18zM11 38h26v4H11z"/>`),
  funnel: svg(`<path class="ill-liquid" d="M13 13h22l-8 9h-6z"/>
    <path class="ill-line" d="M7 8h34L27 24v18h-6V24z"/>`),
  mortar: svg(`<rect class="ill-metal" x="27" y="2" width="6" height="22" rx="3" transform="rotate(28 30 13)"/>
    <path class="ill-line" d="M7 23h34c0 10-7 16-17 16S7 33 7 23zM18 39h12v4H18z"/>`),
  balance: svg(`<ellipse class="ill-metal" cx="24" cy="21" rx="14" ry="3"/>
    <path class="ill-line" d="M22 24h4v10h-4zM6 34h36v8H6z"/>
    <rect class="ill-liquid" x="9" y="36" width="11" height="4"/>
    <circle class="ill-line" cx="36" cy="38" r="1.6"/>`),
  hotplate: svg(`<path class="ill-amber-fill" d="M17 13c2 2 2 4 0 5M24 11c2 2 2 5 0 7M31 13c2 2 2 4 0 5"/>
    <ellipse class="ill-metal" cx="24" cy="25" rx="16" ry="3.5"/>
    <path class="ill-line" d="M7 27h34v13H7z"/>
    <circle class="ill-line" cx="15" cy="34" r="2.4"/><circle class="ill-line" cx="33" cy="34" r="2.4"/>`),
  phMeter: svg(`<rect class="ill-line" x="6" y="9" width="19" height="31" rx="3"/>
    <rect class="ill-liquid" x="9" y="13" width="13" height="9"/>
    <path class="ill-thin" d="M10 28h4M17 28h4M10 33h4M17 33h4"/>
    <path class="ill-line" d="M25 16c6 0 11 1 11 7v5"/><rect class="ill-metal" x="33" y="28" width="6" height="15" rx="3"/>`),
  microscope: svg(`<path class="ill-line" d="M9 42h28v-4H9zM29 38V22c0-6-3-10-8-12"/>
    <path class="ill-metal" d="M13 4l7-2 8 20-7 2z"/>
    <path class="ill-line" d="M13 4l7-2 8 20-7 2zM12 29h20v3H12z"/>
    <rect class="ill-liquid" x="18" y="27" width="8" height="2"/>`),
  stereo: svg(`<path class="ill-line" d="M9 42h30v-4H9zM31 38V18"/>
    <path class="ill-metal" d="M12 4h6v14h-6zM20 4h6v14h-6z"/>
    <path class="ill-line" d="M12 4h6v14h-6zM20 4h6v14h-6zM11 18h17v6H11zM10 30h24v3H10z"/>`),
  slide: svg(`<rect class="ill-liquid ill-soft" x="5" y="17" width="38" height="14" rx="1"/>
    <path class="ill-line" d="M5 17h38v14H5z"/>
    <rect class="ill-paper" x="7" y="19" width="8" height="10"/>
    <circle class="ill-amber-fill" cx="29" cy="24" r="3.5"/><path class="ill-thin" d="M23 19h12v10H23z"/>`),
  petri: svg(`<ellipse class="ill-liquid ill-soft" cx="24" cy="29" rx="18" ry="7"/>
    <path class="ill-line" d="M6 25v4c0 4 8 7 18 7s18-3 18-7v-4"/><ellipse class="ill-line" cx="24" cy="25" rx="18" ry="7"/>
    <circle class="ill-amber-fill" cx="18" cy="26" r="1.6"/><circle class="ill-amber-fill" cx="27" cy="24" r="2"/><circle class="ill-amber-fill" cx="30" cy="28" r="1.2"/>`),
  dissection: svg(`<circle class="ill-line" cx="12" cy="36" r="4"/><circle class="ill-line" cx="22" cy="40" r="4"/>
    <path class="ill-line" d="M15 33L36 8M19 37L38 12"/>
    <path class="ill-metal" d="M30 30l10 10-2 2-10-10z"/>`),
  bottle: svg(`<path class="ill-amber-glass" d="M14 18l5-5h10l5 5v22a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z"/>
    <path class="ill-line" d="M19 7h10v6l5 5v22a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V18l5-5z"/>
    <rect class="ill-cap" x="18" y="3" width="12" height="5" rx="1"/>${label(16, 24, 16, 11)}`),
  jar: svg(`<rect class="ill-amber-glass" x="10" y="14" width="28" height="28" rx="3"/>
    <rect class="ill-line" x="10" y="14" width="28" height="28" rx="3"/>
    <rect class="ill-cap" x="9" y="8" width="30" height="6" rx="1"/>${label(14, 22, 20, 13)}`),
  washBottle: svg(`<path class="ill-liquid ill-soft" d="M14 22h20v16a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z"/>
    <path class="ill-line" d="M14 16h20v22a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4zM19 16v-4h10v4M24 12V6l12-3"/>`),
  device: svg(`<rect class="ill-line" x="7" y="12" width="34" height="26" rx="2"/>
    <rect class="ill-liquid" x="11" y="16" width="16" height="10"/>
    <circle class="ill-line" cx="34" cy="21" r="3"/><path class="ill-thin" d="M11 32h26"/>`),
};

// Name → drawing. Order matters: the first match wins ("microscopio estereoscópico" before "microscopio").
const RULES = [
  [/estereosc/, 'stereo'],
  [/microscop/, 'microscope'],
  [/portaobjeto|cubreobjeto/, 'slide'],
  [/petri/, 'petri'],
  [/disecc|bistur|tijera/, 'dissection'],
  [/vaso/, 'beaker'],
  [/matraz|erlenmeyer|kitasato/, 'flask'],
  [/probeta/, 'cylinder'],
  [/pipeta/, 'pipette'],
  [/bureta/, 'burette'],
  [/tubo de ensayo|tubo/, 'testTube'],
  [/pinza/, 'tongs'],
  [/mechero|bunsen/, 'burner'],
  [/embudo/, 'funnel'],
  [/mortero/, 'mortar'],
  [/balanza|bascula/, 'balance'],
  [/parrilla|plancha|agitador/, 'hotplate'],
  [/potenciometr|medidor de ph|phmetro/, 'phMeter'],
  [/agua destilada|piseta/, 'washBottle'],
];

const plain = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function illustrationKey({ name, kind, unit } = {}) {
  const n = plain(name);
  for (const [re, key] of RULES) if (re.test(n)) return key;
  if (kind === 'reagent') return unit === 'g' || unit === 'kg' ? 'jar' : 'bottle';
  if (kind === 'equipment') return 'device';
  return 'beaker';
}

export function illustrationSvg(item) {
  return DRAWINGS[illustrationKey(item)];
}

// Photo if the item has one, otherwise its drawing. `size`: 'sm' (lines), 'md' (lists), 'lg' (card).
export function itemVisual(item, size = 'sm') {
  return isPhoto(item?.photo)
    ? `<span class="thumb thumb--${size} thumb--photo"><img src="${item.photo}" alt="" loading="lazy" /></span>`
    : `<span class="thumb thumb--${size}">${illustrationSvg(item ?? {})}</span>`;
}

// For list lines (`.line`): the visual sits at the left, inside the label.
export function lineThumb(item) {
  return `<span class="line__thumb" aria-hidden="true">${itemVisual(item, 'sm')}</span>`;
}

export const ILLUSTRATION_KEYS = Object.keys(DRAWINGS);
