import { esc } from './html.js';

// The graduated cylinder (DESIGN.md "la probeta"): the one bold visual of the app.
// Pure function → SVG string. Quantities are integers in hundredths (SPEC §4).
//   onHand: in the lab, lentOut: borrowed (drawn as dashed empty space),
//   minStock: horizontal mark; below it the liquid turns red.
//   fromOnHand: optional starting level; animateCylinders() then lowers it to onHand
//   (the single orchestrated moment when a loan is confirmed).

const W = 64;
const H = 160;
const TUBE_X = 14;
const TUBE_W = 36;
const TOP = 14;
const BOTTOM = 140;
const INNER = BOTTOM - TOP;

export function cylinderSvg({ onHand = 0, lentOut = 0, minStock = 0, unit = '', size = 1, title = '', fromOnHand = null } = {}) {
  const total = Math.max(onHand + lentOut, minStock, fromOnHand ?? 0, 1);
  const level = Math.max(onHand, 0) / total;
  const start = fromOnHand === null ? level : Math.max(fromOnHand, 0) / total;
  const lentH = Math.round((Math.max(lentOut, 0) / total) * INNER);
  const levelY = BOTTOM - Math.round(level * INNER);
  const low = minStock > 0 && onHand < minStock;
  const minY = BOTTOM - Math.round((minStock / total) * INNER);

  const ticks = [];
  for (let i = 1; i < 10; i++) {
    const y = BOTTOM - (INNER * i) / 10;
    const long = i % 5 === 0;
    ticks.push(`<line x1="${TUBE_X + TUBE_W - (long ? 14 : 8)}" y1="${y}" x2="${TUBE_X + TUBE_W}" y2="${y}" />`);
  }

  const unitText = unit && unit !== 'pz'
    ? `<text x="${TUBE_X + 4}" y="${TOP + 14}" class="cyl-unit">${unit}</text>`
    : '';

  return `<svg class="cylinder${low ? ' cylinder--low' : ''}" viewBox="0 0 ${W} ${H}" width="${W * size}" height="${H * size}" role="img" aria-label="${esc(title)}">
  ${title ? `<title>${esc(title)}</title>` : ''}
  <rect class="cyl-liquid" x="${TUBE_X}" y="${TOP}" width="${TUBE_W}" height="${INNER}" style="transform: scaleY(${start.toFixed(4)})"${fromOnHand === null ? '' : ` data-to="${level.toFixed(4)}"`} />
  ${lentH > 0 ? `<rect class="cyl-lent" x="${TUBE_X + 2}" y="${levelY - lentH}" width="${TUBE_W - 4}" height="${lentH}" />` : ''}
  <g class="cyl-ticks">${ticks.join('')}</g>
  ${minStock > 0 ? `<line class="cyl-min" x1="${TUBE_X - 6}" y1="${minY}" x2="${TUBE_X + TUBE_W + 6}" y2="${minY}" />` : ''}
  <path class="cyl-glass" d="M${TUBE_X - 4} ${TOP} h4 M${TUBE_X} ${TOP} V${BOTTOM} H${TUBE_X + TUBE_W} V${TOP} M${TUBE_X + TUBE_W} ${TOP} h4" />
  <path class="cyl-foot" d="M${TUBE_X - 8} ${BOTTOM + 8} H${TUBE_X + TUBE_W + 8} L${TUBE_X + TUBE_W} ${BOTTOM} H${TUBE_X} Z" />
  ${unitText}
</svg>`;
}

// Lowers every cylinder rendered with `fromOnHand` to its final level (CSS transition, ~400 ms).
export function animateCylinders(root) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const rect of root.querySelectorAll('.cyl-liquid[data-to]')) {
      rect.style.transform = `scaleY(${rect.dataset.to})`;
    }
  }));
}
