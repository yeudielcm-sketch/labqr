// New item (#/articulos/nuevo) and edit (#/i/<code>/editar).
import { db } from '../../db/schema.js';
import { createItem, getItemByCode, hasMovements, updateItem } from '../../db/catalog.js';
import { KINDS } from '../../domain/catalog.js';
import { formatQty, formatQtyInput, parseQty, UNITS } from '../../domain/quantity.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { toast } from '../components/feedback.js';

const DEFAULT_UNIT = { equipment: 'pz', material: 'pz', reagent: 'ml' };

function formScreen(mode) {
  return {
    title: mode === 'new' ? t.itemForm.newTitle : t.itemForm.editTitle,
    tab: '/articulos',
    back: '/articulos',
    async render(view, params, query) {
      const labs = (await db.labs.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const locations = (await db.locations.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
      if (!labs.length) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${t.itemForm.needLab}</p><a class="btn btn--primary" href="#/ajustes">${t.itemForm.goSettings}</a></div></section>`;
        return;
      }

      const existing = mode === 'edit' ? (await getItemByCode(params.code))?.item : null;
      if (mode === 'edit' && !existing) return go(`/i/${encodeURIComponent(params.code)}`);
      const unitLocked = existing ? await hasMovements(existing.id) : false;
      const it = existing ?? { kind: 'material', unit: 'pz', labId: query.lab || labs[0].id, locationId: query.ubic || '', minStock: 0 };

      view.innerHTML = `
        <form class="screen stack item-form" novalidate>
          <label class="field-group">
            <span>${t.itemForm.name}</span>
            <input class="field" name="itemName" required maxlength="80" value="${esc(it.name ?? '')}" placeholder="${t.itemForm.namePh}" />
          </label>

          <fieldset class="field-group" ${existing ? 'disabled' : ''}>
            <legend>${t.itemForm.kind}</legend>
            <div class="kind-picker">
              ${KINDS.map((k) => `
                <label class="kind-option label label--${k}">
                  <input type="radio" name="kind" value="${k}" ${it.kind === k ? 'checked' : ''} />
                  <strong>${t.kinds[k]}</strong>
                  <span class="meta">${t.kindHelp[k]}</span>
                </label>`).join('')}
            </div>
          </fieldset>

          <div class="row-2">
            <label class="field-group">
              <span>${t.itemForm.lab}</span>
              <select class="field" name="labId">
                ${labs.map((l) => `<option value="${l.id}" ${l.id === it.labId ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}
              </select>
            </label>
            <label class="field-group">
              <span>${t.itemForm.location}</span>
              <select class="field" name="locationId"></select>
            </label>
          </div>

          <div class="row-2" data-qty-row>
            <label class="field-group" data-unit>
              <span>${t.itemForm.unit}</span>
              <select class="field" name="unit" ${unitLocked ? 'disabled title="' + t.itemForm.unitLocked + '"' : ''}>
                ${UNITS.map((u) => `<option value="${u}" ${u === it.unit ? 'selected' : ''}>${t.units[u]}</option>`).join('')}
              </select>
            </label>
            ${existing ? '' : `
            <label class="field-group" data-initial>
              <span>${t.itemForm.initialQty}</span>
              <input class="field" name="initialQty" inputmode="decimal" autocomplete="off" placeholder="0" />
            </label>`}
          </div>
          ${existing ? '' : `<p class="meta" data-initial-help>${t.itemForm.initialQtyHelp}</p>`}

          <label class="field-group" data-min>
            <span>${t.itemForm.minStock}</span>
            <input class="field" name="minStock" inputmode="decimal" autocomplete="off" value="${it.minStock ? formatQtyInput(it.minStock) : ''}" placeholder="0" />
            <span class="meta">${t.itemForm.minStockHelp}</span>
          </label>

          <label class="field-group" data-expires>
            <span>${t.itemForm.expiresAt}</span>
            <input class="field" type="date" name="expiresAt" value="${esc(it.expiresAt ?? '')}" />
          </label>

          <label class="field-group" data-serial>
            <span>${t.itemForm.serial}</span>
            <input class="field code-input" name="serial" maxlength="40" value="${esc(it.serial ?? '')}" autocapitalize="characters" />
          </label>

          <label class="field-group">
            <span>${t.itemForm.notes}</span>
            <textarea class="field" name="notes" rows="2" maxlength="300">${esc(it.notes ?? '')}</textarea>
          </label>

          <p class="meta" data-code-note></p>
          <p class="form-error" role="alert" data-error hidden></p>

          <div class="form-actions">
            <a class="btn" href="${existing ? `#/i/${encodeURIComponent(existing.code)}` : '#/articulos'}">${t.common.cancel}</a>
            <button class="btn btn--primary" type="submit">${t.common.save}</button>
          </div>
        </form>`;

      const form = view.querySelector('form');
      const show = (sel, on) => { form.querySelector(sel).hidden = !on; };

      const fillLocations = () => {
        const labId = form.labId.value;
        const options = locations.filter((l) => l.labId === labId);
        const keep = options.some((l) => l.id === (form.locationId.value || it.locationId)) ? (form.locationId.value || it.locationId) : '';
        form.locationId.innerHTML = `<option value="">${t.common.none}</option>${options
          .map((l) => `<option value="${l.id}" ${l.id === keep ? 'selected' : ''}>${esc(l.name)}</option>`)
          .join('')}`;
        const lab = labs.find((l) => l.id === labId);
        form.querySelector('[data-code-note]').textContent = existing ? t.itemForm.codeNote(existing.code) : t.itemForm.codeNew(lab.prefix);
      };

      const kind = () => form.querySelector('[name="kind"]:checked').value;
      const applyKind = (changed) => {
        const k = kind();
        if (changed) form.unit.value = DEFAULT_UNIT[k];
        show('[data-unit]', k !== 'equipment');
        if (!existing) show('[data-initial]', k !== 'equipment');
        if (!existing) show('[data-initial-help]', k !== 'equipment');
        show('[data-min]', k !== 'equipment');
        show('[data-expires]', k === 'reagent');
        show('[data-serial]', k === 'equipment');
        if (k === 'equipment') form.unit.value = 'pz';
      };

      form.labId.addEventListener('change', fillLocations);
      form.addEventListener('change', (e) => { if (e.target.name === 'kind') applyKind(true); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = form.querySelector('[data-error]');
        const k = kind();
        const name = form.itemName.value.trim();
        const minStock = k === 'equipment' ? 0 : parseQty(form.minStock.value || '0');
        const initialQty = existing ? 0 : k === 'equipment' ? 100 : parseQty(form.initialQty.value || '0');
        if (!name) { err.textContent = t.itemForm.errName; err.hidden = false; form.itemName.focus(); return; }
        if (minStock === null || initialQty === null) { err.textContent = t.itemForm.errQty; err.hidden = false; return; }

        const fields = {
          name,
          kind: k,
          unit: k === 'equipment' ? 'pz' : form.unit.value,
          labId: form.labId.value,
          locationId: form.locationId.value || null,
          minStock,
          expiresAt: k === 'reagent' && form.expiresAt.value ? form.expiresAt.value : null,
          serial: k === 'equipment' ? form.serial.value.trim() || null : null,
          notes: form.notes.value.trim() || null,
        };

        if (existing) {
          await updateItem(existing.id, fields);
          toast(t.itemForm.saved);
          go(`/i/${encodeURIComponent(existing.code)}`);
        } else {
          const created = await createItem(fields, initialQty);
          toast(t.itemForm.created(created.code));
          go(`/i/${encodeURIComponent(created.code)}`);
        }
      });

      fillLocations();
      applyKind(false);
      if (!existing) form.itemName.focus();
    },
  };
}

export const newItem = formScreen('new');
export const editItem = formScreen('edit');
