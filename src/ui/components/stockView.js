// How an item's quantity is shown (DESIGN.md): a graduated cylinder, or for equipment
// (single piece) a two-state indicator.
import { t } from '../strings.js';
import { esc } from './html.js';
import { cylinderSvg } from './cylinder.js';
import { formatQty } from '../../domain/quantity.js';
import { isExpired, isExpiringSoon, isLowStock } from '../../domain/stock.js';

export function statusFlags(item, stock) {
  const flags = [];
  if (isExpired(item)) flags.push({ text: t.stock.expired, level: 'hazard' });
  else if (isExpiringSoon(item)) flags.push({ text: t.stock.expiring, level: 'amber' });
  if (item.kind !== 'equipment' && isLowStock(item, stock)) flags.push({ text: t.stock.low, level: 'hazard' });
  return flags;
}

export function flagsHtml(flags) {
  return flags
    .map((f) => `<span class="flag flag--${f.level}">${f.level === 'hazard' ? '<span class="hazard" aria-hidden="true"></span>' : '<span class="amber-dot" aria-hidden="true"></span>'}${f.text}</span>`)
    .join('');
}

// Equipment: "En su lugar" / "Prestado a …" / "Dado de baja".
export function equipmentState(stock, borrowerName) {
  if (stock.onHand > 0) return { key: 'in', text: t.stock.inPlace };
  if (stock.lentOut > 0) return { key: 'out', text: borrowerName ? t.stock.lentTo(borrowerName) : t.stock.lentUnknown };
  return { key: 'gone', text: t.stock.lost };
}

export function equipmentBadge(stock, borrowerName) {
  const s = equipmentState(stock, borrowerName);
  return `<span class="equip equip--${s.key}"><span class="equip__dot" aria-hidden="true"></span>${esc(s.text)}</span>`;
}

// Big view for the item card.
export function stockPanel(item, stock, borrowerName) {
  if (item.kind === 'equipment') {
    return `<div class="stock-panel stock-panel--equipment">${equipmentBadge(stock, borrowerName)}</div>`;
  }
  const unit = item.unit;
  const low = isLowStock(item, stock);
  return `
    <div class="stock-panel">
      ${cylinderSvg({ onHand: stock.onHand, lentOut: stock.lentOut, minStock: item.minStock, unit: item.kind === 'reagent' ? unit : '', size: 1, title: `${formatQty(stock.onHand)} ${unit} en laboratorio` })}
      <dl class="stock-figures">
        <div class="${low ? 'is-low' : ''}"><dt>${t.stock.inLab}</dt><dd><span class="big-num">${formatQty(stock.onHand)}</span> ${unit}</dd></div>
        <div><dt>${t.stock.lent}</dt><dd><span class="mid-num">${formatQty(stock.lentOut)}</span> ${unit}</dd></div>
        <div><dt>${t.stock.total}</dt><dd><span class="mid-num">${formatQty(stock.total)}</span> ${unit}</dd></div>
        ${item.minStock > 0 ? `<div class="stock-min"><dt>${t.stock.min}</dt><dd>${formatQty(item.minStock)} ${unit}</dd></div>` : ''}
      </dl>
    </div>`;
}

// Compact view for list rows.
export function stockMini(item, stock) {
  if (item.kind === 'equipment') return equipmentBadge(stock);
  return `
    <span class="stock-mini">
      ${cylinderSvg({ onHand: stock.onHand, lentOut: stock.lentOut, minStock: item.minStock, size: 0.28 })}
      <span><span class="code">${formatQty(stock.onHand)}</span> ${item.unit}${stock.lentOut > 0 ? ` <span class="meta">· ${formatQty(stock.lentOut)} ${t.stock.lent}</span>` : ''}</span>
    </span>`;
}
