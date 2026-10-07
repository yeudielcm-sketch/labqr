// Read-only material list (F7): a task's practice or a request. Shows what is asked and
// what the lab has now, so a short line is visible before anyone walks to the window.
import { formatQty } from '../../domain/quantity.js';
import { EMPTY_STOCK } from '../../domain/stock.js';
import { t } from '../strings.js';
import { esc } from './html.js';

export function materialList(lines, itemsById, stocks) {
  const rows = lines.filter((l) => itemsById[l.itemId]);
  const gone = lines.length - rows.length;
  const goneNote = gone ? `<p class="meta text-hazard">${t.requests.linesGone(gone)}</p>` : '';
  if (!rows.length) return `${goneNote}<p class="meta">${t.requests.errors.empty}</p>`;
  return `${goneNote}<ul class="lines">${rows.map((l) => {
    const item = itemsById[l.itemId];
    const onHand = (stocks[item.id] ?? EMPTY_STOCK).onHand;
    const short = l.qty > onHand;
    return `
      <li class="line label label--${item.kind}${short ? ' line--bad' : ''}">
        <div class="line__head"><span class="line__name">${esc(item.name)}</span><span class="code line__code">${esc(item.code)}</span></div>
        <div class="line__body">
          <span class="meta${short ? ' text-hazard' : ''}">${t.newLoan.available(`${formatQty(onHand)} ${item.unit}`)}</span>
          <span class="qty-fixed code">${formatQty(l.qty)} ${item.unit}</span>
        </div>
      </li>`;
  }).join('')}</ul>`;
}
