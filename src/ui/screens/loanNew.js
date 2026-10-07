// Nuevo vale — the critical path (CLAUDE.md UX): one screen, no chained modals,
// continuous scanning, and "Confirmar préstamo" is a single tap.
import { getSetting, loadCatalog } from '../../db/catalog.js';
import { confirmLoan, createBorrower, listBorrowers } from '../../db/movements.js';
import { getPractice, listPractices } from '../../db/practices.js';
import { borrowerForRequest, getRequest } from '../../db/requests.js';
import { canDecide } from '../../domain/requests.js';
import { allowed } from '../session.js';
import { linesFromPractice, mergeLines } from '../../domain/practices.js';
import { filterItems } from '../../domain/catalog.js';
import { extractCode } from '../../domain/codes.js';
import { borrowerProblems, deliverySeconds, dueDate } from '../../domain/loans.js';
import { formatQty, formatQtyInput, parseQty } from '../../domain/quantity.js';
import { EMPTY_STOCK } from '../../domain/stock.js';
import { beep, cameraSupported, confirmRead, startScanner } from '../../qr/scan.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { animateCylinders, cylinderSvg } from '../components/cylinder.js';
import { formatDateTime } from '../components/format.js';
import { borrowerLabel } from './loans.js';
import { equipmentBadge } from '../components/stockView.js';

const STEP = 100; // one piece / one unit, in hundredths

// The draft survives leaving the screen (e.g. to check an item) until it is confirmed or discarded.
let draft = null;
let stopCamera = null;

const newDraft = () => ({ createdAt: new Date().toISOString(), borrowerId: '', practice: '', practiceId: '', appliedPractices: [], lines: [] });

export const loanNew = {
  title: t.newLoan.title,
  tab: '/vales',
  back: '/vales',
  leave() {
    stopCamera?.();
    stopCamera = null;
  },
  async render(view, _params = {}, query = {}) {
    draft ??= newDraft();
    const [cat, borrowers, loanDays, practices] = await Promise.all([loadCatalog(), listBorrowers(), getSetting('defaultLoanDays', 0), listPractices()]);
    const itemsById = Object.fromEntries(cat.items.map((i) => [i.id, i]));

    // A draft linked to a request that was decided meanwhile goes back to being a plain loan,
    // so it can never approve that request with someone else's loan.
    if (draft.requestId && !canDecide(await getRequest(draft.requestId))) {
      draft.requestId = null;
      draft.requestName = '';
    }

    // Attending a student's request (F7): the loan starts filled with what they asked for.
    // Only the lab staff decides requests, also when the address is typed by hand.
    if (query.solicitud && allowed('decideRequest') && draft.requestId !== query.solicitud) {
      const request = await getRequest(query.solicitud);
      if (!canDecide(request)) {
        toast(t.requests.alreadyDecided, { danger: true });
        return go(request ? `/solicitudes/${request.id}` : '/solicitudes');
      }
      // Never drop a loan in progress without asking.
      if (draft.lines.length && !(await confirmDialog(t.newLoan.replaceDraftQ, { confirmLabel: t.requests.attend }))) {
        return go(`/solicitudes/${request.id}`);
      }
      const student = await borrowerForRequest(request);
      if (!borrowers.some((b) => b.id === student.id)) borrowers.push(student);
      draft = {
        ...newDraft(),
        requestId: request.id,
        requestName: request.name,
        borrowerId: student?.id ?? '',
        practice: request.practice ?? '',
        practiceId: request.practiceId ?? '',
        appliedPractices: request.practiceId ? [request.practiceId] : [],
        lines: request.lines.map((l) => ({ ...l })),
      };
    }
    const onHand = (id) => (cat.stocks[id] ?? EMPTY_STOCK).onHand;
    // The draft may point to data that no longer exists ("Borrar todo" or a restored backup).
    const before = draft.lines.length;
    draft.lines = draft.lines.filter((l) => itemsById[l.itemId] && !itemsById[l.itemId].archived);
    if (draft.lines.length < before) toast(t.newLoan.linesGone(before - draft.lines.length), { danger: true });
    if (!borrowers.some((b) => b.id === draft.borrowerId)) draft.borrowerId = '';
    if (draft.practiceId && !practices.some((p) => p.id === draft.practiceId)) draft.practiceId = '';
    const due = dueDate(new Date(), loanDays); // shown as a hint; recalculated when confirming

    view.innerHTML = `
      <section class="screen stack loan-new">
        ${draft.requestId ? `<p class="notice">${t.newLoan.fromRequest(esc(draft.requestName))}</p>` : ''}
        <section class="block block--first">
          <h3>${t.newLoan.borrower}</h3>
          <select class="field" name="borrower" aria-label="${t.newLoan.borrowerPick}" ${draft.requestId ? 'disabled' : ''}>
            <option value="">${t.newLoan.borrowerPick}</option>
            ${borrowers.map((b) => `<option value="${b.id}" ${b.id === draft.borrowerId ? 'selected' : ''}>${esc(borrowerLabel(b))}</option>`).join('')}
          </select>
          <details class="new-borrower">
            <summary class="link-btn">+ ${t.newLoan.borrowerNew}</summary>
            <form class="stack" data-borrower-form novalidate>
              <input class="field" name="bname" placeholder="${t.newLoan.borrowerNamePh}" aria-label="${t.newLoan.borrowerName}" required maxlength="60" />
              <div class="row-2">
                <select class="field" name="btype" aria-label="${t.newLoan.borrowerType}">
                  ${Object.entries(t.newLoan.borrowerTypes).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                </select>
                <input class="field" name="bgroup" placeholder="${t.newLoan.borrowerGroupPh}" aria-label="${t.newLoan.borrowerGroup}" maxlength="20" />
              </div>
              <input class="field" name="bsid" placeholder="${t.newLoan.borrowerId}" aria-label="${t.newLoan.borrowerId}" maxlength="20" inputmode="numeric" />
              <p class="form-error" data-borrower-error hidden></p>
              <button class="btn" type="submit">${t.newLoan.borrowerAdd}</button>
            </form>
          </details>
          ${practices.length ? `
          <select class="field" name="practiceId" aria-label="${t.newLoan.practicePick}">
            <option value="">${t.newLoan.practicePick}</option>
            ${practices.map((p) => `<option value="${esc(p.id)}" ${p.id === draft.practiceId ? 'selected' : ''}>${esc(p.name)}${p.teacher ? ` · ${esc(p.teacher)}` : ''}</option>`).join('')}
          </select>` : ''}
          <input class="field" name="practice" value="${esc(draft.practice)}" placeholder="${t.newLoan.practicePh}" aria-label="${t.newLoan.practice}" maxlength="80" />
        </section>

        <section class="block">
          <h3>${t.newLoan.items}</h3>
          <button type="button" class="btn btn--block" data-scan-toggle ${cameraSupported() ? '' : 'hidden'}>${t.newLoan.scan}</button>
          <div class="scanner scanner--inline" data-scanner hidden>
            <div class="scanner__frame scanner__frame--short" data-frame>
              <video class="scanner__video" data-video></video>
              <div class="scanner__target" aria-hidden="true"></div>
            </div>
            <p class="scanner__status" role="status" data-status></p>
          </div>
          <input class="field search" type="search" name="q" placeholder="${t.newLoan.search}" autocomplete="off" />
          <ul class="results" data-results></ul>
          <ul class="lines" data-lines></ul>
        </section>

        <p class="meta">${t.newLoan.due}: ${formatDateTime(due)}</p>
        <p class="form-error" role="alert" data-error hidden></p>

        <div class="confirm-bar">
          <button type="button" class="link-btn link-btn--danger" data-discard>${t.newLoan.discard}</button>
          <button type="button" class="btn btn--primary btn--big" data-confirm>${t.newLoan.confirm}</button>
        </div>
      </section>`;

    const $ = (s) => view.querySelector(s);
    const status = $('[data-status]');
    const frame = $('[data-frame]');
    const error = $('[data-error]');
    const showError = (msg) => { error.textContent = msg; error.hidden = !msg; };

    const lineOf = (itemId) => draft.lines.find((l) => l.itemId === itemId);

    const drawLines = () => {
      $('[data-lines]').innerHTML = draft.lines.length
        ? draft.lines.map((l) => {
          const item = itemsById[l.itemId];
          const over = l.qty > onHand(l.itemId);
          const bad = !(l.qty > 0) || over;
          const qtyControl = item.kind === 'equipment'
            ? `<span class="qty-fixed code">1 pz</span>`
            : item.kind === 'material'
              ? `<div class="stepper">
                   <button type="button" class="stepper__btn" data-dec="${l.itemId}" aria-label="Menos">−</button>
                   <input class="field stepper__input code-input" inputmode="numeric" data-qty="${l.itemId}" value="${formatQtyInput(l.qty)}" aria-label="${t.moves.qty}" />
                   <button type="button" class="stepper__btn" data-inc="${l.itemId}" aria-label="Más">+</button>
                 </div>`
              : `<div class="qty-unit"><input class="field code-input" inputmode="decimal" data-qty="${l.itemId}" value="${formatQtyInput(l.qty)}" aria-label="${t.moves.qty}" /><span>${item.unit}</span></div>`;
          return `
            <li class="line label label--${item.kind}${bad ? ' line--bad' : ''}">
              <div class="line__head">
                <span class="line__name">${esc(item.name)}</span>
                <span class="code line__code">${esc(item.code)}</span>
              </div>
              <div class="line__body">
                <span class="meta${over ? ' text-hazard' : ''}">${t.newLoan.available(`${formatQty(onHand(l.itemId))} ${item.unit}`)}</span>
                ${qtyControl}
                <button type="button" class="icon-btn icon-btn--sm" data-remove="${l.itemId}" aria-label="${t.newLoan.remove} ${esc(item.name)}">×</button>
              </div>
            </li>`;
        }).join('')
        : `<li class="meta lines__empty">${t.newLoan.noItems}</li>`;
    };

    // Adds one step of an item. Returns a message for the scanner status.
    const addItem = (item) => {
      const line = lineOf(item.id);
      if (item.kind === 'equipment' && line) return { ok: false, msg: t.newLoan.equipmentOnce(item.name) };
      const current = line?.qty ?? 0;
      if (current + STEP > onHand(item.id)) return { ok: false, msg: t.newLoan.noneLeft(item.name) };
      if (line) line.qty += STEP;
      else draft.lines.push({ itemId: item.id, qty: STEP });
      drawLines();
      showError('');
      const q = lineOf(item.id).qty;
      return { ok: true, msg: line ? t.newLoan.plusOne(item.name, `${formatQty(q)} ${item.unit}`) : t.newLoan.added(item.name) };
    };

    // Search results: tap to add.
    const drawResults = (q) => {
      const found = q.trim() ? filterItems(cat.items, cat.stocks, { q }).slice(0, 6) : [];
      $('[data-results]').innerHTML = found
        .map((i) => `<li><button type="button" class="result label--${i.kind}" data-add="${i.id}"><span class="code">${esc(i.code)}</span><span>${esc(i.name)}</span><span class="meta">${formatQty(onHand(i.id))} ${i.unit}</span></button></li>`)
        .join('');
    };

    $('[name="q"]').addEventListener('input', (e) => drawResults(e.target.value));
    $('[data-results]').addEventListener('click', (e) => {
      const id = e.target.closest('[data-add]')?.dataset.add;
      if (!id) return;
      const r = addItem(itemsById[id]);
      toast(r.msg, { danger: !r.ok });
      $('[name="q"]').value = '';
      drawResults('');
    });

    $('[data-lines]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.remove) draft.lines = draft.lines.filter((l) => l.itemId !== b.dataset.remove);
      if (b.dataset.inc) { const l = lineOf(b.dataset.inc); l.qty += STEP; }
      if (b.dataset.dec) { const l = lineOf(b.dataset.dec); l.qty = Math.max(STEP, l.qty - STEP); }
      drawLines();
    });
    $('[data-lines]').addEventListener('change', (e) => {
      const id = e.target.dataset.qty;
      if (!id) return;
      const q = parseQty(e.target.value);
      lineOf(id).qty = q ?? 0;
      drawLines();
    });

    $('[name="borrower"]').addEventListener('change', (e) => { draft.borrowerId = e.target.value; showError(''); });
    $('[name="practice"]').addEventListener('input', (e) => { draft.practice = e.target.value; });

    $('[data-borrower-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const button = f.querySelector('[type="submit"]');
      if (button.disabled) return;
      const fields = { name: f.bname.value.trim(), type: f.btype.value, group: f.bgroup.value.trim(), studentId: f.bsid.value.trim() };
      const problem = borrowerProblems(fields);
      const err = f.querySelector('[data-borrower-error]');
      if (problem) {
        err.textContent = problem === 'studentId' ? t.newLoan.errStudentId : t.newLoan.errBorrowerName;
        err.hidden = false;
        return;
      }
      button.disabled = true;
      const b = await createBorrower(fields);
      draft.borrowerId = b.id;
      this.leave();
      this.render(view);
    });

    // Student → control number is required (F6): the field says so as soon as "Alumno" is chosen.
    const borrowerForm = $('[data-borrower-form]');
    borrowerForm.btype.addEventListener('change', (e) => {
      const student = e.target.value === 'student';
      borrowerForm.bsid.placeholder = student ? t.newLoan.borrowerIdRequired : t.newLoan.borrowerId;
      borrowerForm.bsid.required = student;
    });

    // A saved practice fills the loan with its material (F6). Lines already in the draft stay.
    const applyPractice = (practice) => {
      draft.appliedPractices ??= [];
      if (draft.appliedPractices.includes(practice.id)) {
        draft.practiceId = practice.id;
        return toast(t.newLoan.practiceAlready);
      }
      draft.appliedPractices.push(practice.id);
      const r = linesFromPractice(practice, itemsById, Object.fromEntries(cat.items.map((i) => [i.id, onHand(i.id)])));
      draft.lines = mergeLines(draft.lines, r.lines, itemsById);
      draft.practiceId = practice.id;
      draft.practice = practice.name;
      $('[name="practice"]').value = practice.name;
      drawLines();
      if (r.short.length) showError(t.newLoan.practiceShort(r.short.map((x) => itemsById[x.itemId].name).join(', ')));
      else showError('');
      toast(r.missing.length ? t.newLoan.practiceMissing(r.missing.length) : t.newLoan.practiceFilled(r.lines.length), { danger: r.missing.length > 0 });
    };
    $('[name="practiceId"]')?.addEventListener('change', async (e) => {
      if (!e.target.value) {
        draft.practiceId = '';
        return;
      }
      const practice = await getPractice(e.target.value);
      if (practice) applyPractice(practice);
    });

    // Continuous scanning: each read adds one; the same code again adds one more.
    // `starting` ignores taps while the camera opens, so there is never a second stream.
    let starting = false;
    $('[data-scan-toggle]').addEventListener('click', async (e) => {
      const panel = $('[data-scanner]');
      if (starting) return;
      if (stopCamera) {
        this.leave();
        panel.hidden = true;
        e.target.textContent = t.newLoan.scan;
        return;
      }
      panel.hidden = false;
      e.target.textContent = t.newLoan.stopScan;
      status.textContent = t.scan.starting;
      starting = true;
      try {
        stopCamera = await startScanner($('[data-video]'), (text) => {
          const code = extractCode(text);
          const item = code && cat.items.find((i) => i.code === code && !i.archived);
          if (!item) {
            status.textContent = code ? t.newLoan.unknown(code) : t.scan.notCode;
            status.classList.add('scanner__status--bad');
            return;
          }
          const r = addItem(item);
          status.textContent = r.msg;
          status.classList.toggle('scanner__status--bad', !r.ok);
          if (r.ok) {
            frame.classList.remove('scanner__frame--hit');
            void frame.offsetWidth;
            frame.classList.add('scanner__frame--hit');
            confirmRead();
            beep();
          }
        });
        if (!view.contains(frame)) return this.leave();
        status.textContent = t.scan.aim;
      } catch (err) {
        status.textContent = err?.name === 'NotAllowedError' ? t.scan.denied : t.scan.failed;
        status.classList.add('scanner__status--bad');
        e.target.textContent = t.newLoan.scan;
      } finally {
        starting = false;
      }
    });

    $('[data-discard]').addEventListener('click', async () => {
      if (draft.lines.length && !(await confirmDialog(t.newLoan.discardQ, { confirmLabel: t.newLoan.discard, danger: true }))) return;
      const requestId = draft.requestId;
      draft = null;
      go(requestId ? `/solicitudes/${requestId}` : '/vales');
    });

    $('[data-confirm]').addEventListener('click', async (e) => {
      if (!draft.borrowerId) return showError(t.newLoan.errBorrower);
      if (!draft.lines.length) return showError(t.newLoan.errEmpty);
      if (draft.lines.some((l) => !(l.qty > 0))) return showError(t.newLoan.errQty);
      e.target.disabled = true;
      const labId = itemsById[draft.lines[0].itemId].labId;
      const before = Object.fromEntries(draft.lines.map((l) => [l.itemId, cat.stocks[l.itemId] ?? EMPTY_STOCK]));
      const res = await confirmLoan({ borrowerId: draft.borrowerId, labId, practice: draft.practice.trim(), practiceId: draft.practiceId || null, requestId: draft.requestId ?? null, createdAt: draft.createdAt, dueAt: dueDate(new Date(), loanDays), lines: draft.lines });
      if (!res.ok) {
        e.target.disabled = false;
        const reason = res.problems.map((p) => p.reason);
        return showError(reason.includes('request') ? t.requests.alreadyDecided : reason.includes('stock') ? t.newLoan.errStock : t.newLoan.errQty);
      }
      this.leave();
      const lent = draft.lines;
      draft = null;
      showConfirmation(view, res.loan, lent, itemsById, before);
    });

    drawLines();

    if (query.practica) {
      const practice = practices.find((p) => p.id === query.practica);
      if (practice) {
        $('[name="practiceId"]').value = practice.id;
        applyPractice(practice);
      }
    }
  },
};

// The single orchestrated moment (DESIGN.md): the lent items' cylinders go down.
function showConfirmation(view, loan, lines, itemsById, before) {
  view.innerHTML = `
    <section class="screen stack confirmed">
      <h2 class="confirmed__title">${t.newLoan.confirmed}</h2>
      <p class="meta">${t.newLoan.seconds(deliverySeconds(loan))}</p>
      <ul class="confirmed__list">
        ${lines.map((l) => {
          const item = itemsById[l.itemId];
          const s = before[l.itemId];
          return `
            <li class="confirmed__item">
              ${item.kind === 'equipment'
                ? equipmentBadge({ onHand: 0, lentOut: 100 })
                : cylinderSvg({ onHand: s.onHand - l.qty, lentOut: s.lentOut + l.qty, minStock: item.minStock, size: 0.45, fromOnHand: s.onHand, title: item.name })}
              <span class="code">${esc(item.code)}</span>
              <span class="confirmed__name">${esc(item.name)}</span>
              <span class="meta">−${formatQty(l.qty)} ${item.unit}</span>
            </li>`;
        }).join('')}
      </ul>
      <div class="row-2">
        <a class="btn" href="#/vales/${loan.id}">${t.newLoan.viewLoan}</a>
        <button type="button" class="btn btn--primary" data-another>${t.newLoan.another}</button>
      </div>
    </section>`;
  view.querySelector('[data-another]').addEventListener('click', () => loanNew.render(view));
  animateCylinders(view);
  toast(t.newLoan.confirmed);
}
