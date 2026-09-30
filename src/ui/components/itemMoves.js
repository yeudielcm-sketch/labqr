// Quick actions on the item card: Recepción, Merma, Ajuste por conteo. Each one writes a
// new movement; nothing is edited in place.
import { adjustToCount, receive, registerLoss } from '../../db/movements.js';
import { formatQty, parseQty } from '../../domain/quantity.js';
import { t } from '../strings.js';
import { toast } from './feedback.js';

export function itemMovesHtml(item, stock) {
  const u = item.unit;
  const isEquipment = item.kind === 'equipment';
  const tabs = isEquipment ? ['LOSS'] : ['RECEIVE', 'LOSS', 'ADJUST'];
  const label = { RECEIVE: t.moves.receive, LOSS: t.moves.loss, ADJUST: t.moves.adjust };
  return `
    <section class="block item-moves">
      <h3>${t.moves.title}</h3>
      ${isEquipment ? `<p class="meta">${t.moves.equipmentNote}</p>` : ''}
      <div class="segmented" role="tablist">
        ${tabs.map((k) => `<button type="button" class="segmented__btn" role="tab" data-move="${k}" aria-selected="false">${label[k]}</button>`).join('')}
      </div>
      <form class="stack move-form" data-form="RECEIVE" hidden>
        <label class="field-group"><span>${t.moves.qty} (${u})</span><input class="field code-input" name="qty" inputmode="decimal" autocomplete="off" /></label>
        <label class="field-group"><span>${t.moves.note}</span><input class="field" name="note" placeholder="${t.moves.notePh}" maxlength="120" /></label>
        <button class="btn btn--primary" type="submit">${t.moves.save}</button>
      </form>
      <form class="stack move-form" data-form="LOSS" hidden>
        ${isEquipment ? '' : `<label class="field-group"><span>${t.moves.qty} (${u})</span><input class="field code-input" name="qty" inputmode="decimal" autocomplete="off" /></label>`}
        <label class="field-group"><span>${t.moves.reason}</span>
          <select class="field" name="reason">${t.moves.reasons.map((r) => `<option>${r}</option>`).join('')}</select>
        </label>
        <label class="field-group"><span>${t.moves.note}</span><input class="field" name="note" maxlength="120" /></label>
        <button class="btn btn--danger" type="submit">${t.moves.save}</button>
      </form>
      <form class="stack move-form" data-form="ADJUST" hidden>
        <label class="field-group"><span>${t.moves.counted} (${u})</span><input class="field code-input" name="counted" inputmode="decimal" autocomplete="off" />
          <span class="meta">${t.moves.countedHelp(`${formatQty(stock.onHand)} ${u}`)}</span></label>
        <label class="field-group"><span>${t.moves.noteReq}</span><input class="field" name="note" maxlength="120" required /></label>
        <button class="btn btn--primary" type="submit">${t.moves.save}</button>
      </form>
    </section>`;
}

export function bindItemMoves(root, item, onDone) {
  const block = root.querySelector('.item-moves');
  if (!block) return;
  block.querySelector('.segmented').addEventListener('click', (e) => {
    const b = e.target.closest('[data-move]');
    if (!b) return;
    const open = b.getAttribute('aria-selected') !== 'true';
    for (const x of block.querySelectorAll('[data-move]')) x.setAttribute('aria-selected', String(open && x === b));
    for (const f of block.querySelectorAll('[data-form]')) f.hidden = !(open && f.dataset.form === b.dataset.move);
    if (open) block.querySelector(`[data-form="${b.dataset.move}"] input`)?.focus();
  });

  // One submit at a time: a double tap must not write two movements.
  let busy = false;
  block.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    const button = e.target.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await submitMove(e.target);
    } finally {
      busy = false;
      button.disabled = false;
    }
  });

  async function submitMove(f) {
    const type = f.dataset.form;
    const note = f.note.value.trim();

    if (type === 'ADJUST') {
      const counted = parseQty(f.counted.value);
      if (counted === null) return toast(t.moves.errCount, { danger: true });
      if (!note) return toast(t.moves.errNote, { danger: true });
      const diff = await adjustToCount(item.id, counted, note);
      toast(diff === 0 ? t.moves.noChange : t.moves.savedAdjust(`${diff > 0 ? '+' : '−'}${formatQty(Math.abs(diff))} ${item.unit}`));
      return onDone();
    }

    const qty = item.kind === 'equipment' ? 100 : parseQty(f.qty.value);
    if (!(qty > 0)) return toast(t.moves.errQty, { danger: true });
    if (type === 'RECEIVE') {
      await receive(item.id, qty, note);
      toast(t.moves.savedReceive);
    } else {
      if (!(await registerLoss(item.id, qty, f.reason.value, note))) return toast(t.moves.errLoss, { danger: true });
      toast(t.moves.savedLoss);
    }
    onDone();
  }
}
