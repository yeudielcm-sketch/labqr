import { getSetting, loadCatalog, setSetting } from '../../db/catalog.js';
import { backupIsDue } from '../../io/backup.js';
import { loadLoans } from '../../db/movements.js';
import { listPractices } from '../../db/practices.js';
import { listRequests, listTasks } from '../../db/requests.js';
import { EMPTY_STOCK, isExpired, isExpiringSoon, isLowStock } from '../../domain/stock.js';
import { requestCountsByTask } from '../../domain/requests.js';
import { groupKey, visibleTasks } from '../../domain/tasks.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { icons } from '../components/icons.js';
import { cylinderSvg } from '../components/cylinder.js';
import { versionFooter } from '../components/version.js';
import { currentRole } from '../session.js';
import { taskRow } from './tasks.js';
import { requestFlag } from './requests.js';

// "Entraste como … · Cambiar": the role is always visible and one tap away (F7).
function roleLine() {
  const role = currentRole();
  return `<p class="role-line"><span class="role-line__icon">${icons[role]}</span><span>${t.roles.chosen(t.roles.short[role])}</span><a href="#/entrar">${t.roles.change}</a></p>`;
}

export const home = {
  title: t.home.title,
  tab: '/',
  async render(view, params, query) {
    if (currentRole() === 'teacher') return teacherHome(view);
    if (currentRole() === 'student') return studentHome(view);
    return labHome(view, query);
  },
};

async function labHome(view, query) {
  const [cat, loanRows, lastBackupAt, requests] = await Promise.all([loadCatalog(), loadLoans(), getSetting('lastBackupAt', null), listRequests()]);
  if (cat.items.length === 0) {
    view.innerHTML = `
      <section class="screen">
        ${roleLine()}
        <div class="empty">
          ${cylinderSvg({ onHand: 0, title: 'Probeta vacía' })}
          <p>${t.home.empty}</p>
          <a class="btn btn--primary" href="#/ajustes">${t.home.loadDemo}</a>
          <a class="btn" href="#/articulos/nuevo">${t.home.addItem}</a>
        </div>
        ${versionFooter()}
      </section>`;
    return;
  }

  const labId = query.lab ?? '';
  const items = cat.items.filter((i) => !i.archived && (!labId || i.labId === labId));
  const stockOf = (i) => cat.stocks[i.id] ?? EMPTY_STOCK;
  const low = items.filter((i) => isLowStock(i, stockOf(i)));
  const expiring = items.filter((i) => isExpiringSoon(i));
  const expired = items.filter((i) => isExpired(i));
  const lent = items.filter((i) => stockOf(i).lentOut > 0);
  const labQ = labId ? `&lab=${labId}` : '';
  const loansHere = loanRows.filter((r) => !labId || r.loan.labId === labId);
  const openLoans = loansHere.filter((r) => r.status === 'open' || r.status === 'overdue');
  const overdue = loansHere.filter((r) => r.status === 'overdue');
  const pendingRequests = requests.filter((r) => r.status === 'pending' && (!labId || r.labId === labId));

  // Overall level: share of pieces in the lab vs. total (just the headline cylinder).
  const onHand = items.reduce((s, i) => s + (i.unit === 'pz' ? stockOf(i).onHand : 0), 0);
  const lentOut = items.reduce((s, i) => s + (i.unit === 'pz' ? stockOf(i).lentOut : 0), 0);

  view.innerHTML = `
    <section class="screen stack home">
      ${roleLine()}
      ${backupIsDue(lastBackupAt, cat.items.length > 0) ? `
      <div class="backup-reminder" role="status">
        <span class="amber-dot" aria-hidden="true"></span>
        <span>${lastBackupAt ? t.backup.reminder : t.backup.reminderNever}</span>
        <a class="btn btn--sm" href="#/respaldo">${t.backup.reminderBtn}</a>
      </div>` : ''}
      <select class="field lab-select" aria-label="${t.items.filterLab}">
        <option value="">${t.home.allLabs}</option>
        ${cat.labs.map((l) => `<option value="${l.id}" ${l.id === labId ? 'selected' : ''}>Laboratorio ${esc(l.name)}</option>`).join('')}
      </select>

      <div class="home-hero">
        ${cylinderSvg({ onHand, lentOut, size: 0.8, title: 'Piezas en laboratorio' })}
        <div>
          <p class="big-num">${items.length}</p>
          <p>${t.home.itemsWord(items.length)}</p>
          <p class="meta">${lent.length ? t.home.lent(lent.length) : t.home.allGood}</p>
        </div>
      </div>

      <nav class="status-cards">
        ${pendingRequests.length ? card('#/solicitudes', t.requests.pendingCount(pendingRequests.length), pendingRequests.length, 'open') : ''}
        ${card('#/vales', t.home.openLoans(openLoans.length), openLoans.length, 'open')}
        ${overdue.length ? card('#/vales?estado=vencidos', t.home.overdueLoans(overdue.length), overdue.length, 'hazard') : ''}
        ${card(`#/articulos?bajo=1${labQ}`, t.home.low(low.length), low.length, 'hazard')}
        ${card(`#/articulos?caduca=1${labQ}`, t.home.expiring(expiring.length), expiring.length, 'amber')}
        ${expired.length ? card(`#/articulos?caduca=1${labQ}`, t.home.expired(expired.length), expired.length, 'hazard') : ''}
      </nav>

      <a class="btn btn--primary btn--block btn--big" href="#/vales/nuevo">+ ${t.home.newLoan}</a>

      ${versionFooter()}
    </section>`;

  view.querySelector('.lab-select').addEventListener('change', (e) => {
    location.hash = e.target.value ? `/?lab=${e.target.value}` : '/';
  });
}

// Químico: what is coming up for their groups and how the requests are going.
async function teacherHome(view) {
  const [tasks, practices, requests] = await Promise.all([listTasks(), listPractices({ includeArchived: true }), listRequests()]);
  const practiceById = Object.fromEntries(practices.map((p) => [p.id, p]));
  const counts = requestCountsByTask(requests);
  const upcoming = visibleTasks(tasks, { keepDays: 1 }).slice(0, 5);
  view.innerHTML = `
    <section class="screen stack home">
      ${roleLine()}
      <a class="btn btn--primary btn--block btn--big" href="#/tareas/nueva">+ ${t.tasks.add}</a>
      <section class="block block--first">
        <h3>${t.tasks.upcoming}</h3>
        ${upcoming.length
          ? `<div class="list list--flat">${upcoming.map((task) => taskRow(task, practiceById[task.practiceId], counts[task.id] ?? { pending: 0, approved: 0, rejected: 0 })).join('')}</div>`
          : `<p class="meta">${t.tasks.empty}</p>`}
      </section>
      <div class="row-2">
        <a class="btn" href="#/tareas">${t.menu.tasks}</a>
        <a class="btn" href="#/practicas">${t.menu.practices}</a>
      </div>
      ${versionFooter()}
    </section>`;
}

// Alumno: the tasks of their group and their own requests.
async function studentHome(view) {
  const [group, studentId, tasks, practices, requests] = await Promise.all([
    getSetting('studentGroup', ''), getSetting('studentId', ''), listTasks(), listPractices({ includeArchived: true }), listRequests(),
  ]);
  const practiceById = Object.fromEntries(practices.map((p) => [p.id, p]));
  const mine = studentId ? requests.filter((r) => r.studentId === studentId).slice(0, 3) : [];
  const groupForm = `
    <form class="stack group-form" data-group novalidate>
      <label class="field-group"><span>${t.tasks.yourGroup}</span>
        <input class="field" name="group" maxlength="20" value="${esc(group)}" placeholder="${t.tasks.groupPh}" /></label>
      <p class="meta">${t.tasks.yourGroupHelp}</p>
      <button class="btn btn--primary" type="submit">${t.common.save}</button>
    </form>`;

  if (!groupKey(group)) {
    view.innerHTML = `<section class="screen stack home">${roleLine()}${groupForm}${versionFooter()}</section>`;
  } else {
    const mineTasks = visibleTasks(tasks, { group, keepDays: 2 });
    view.innerHTML = `
      <section class="screen stack home">
        ${roleLine()}
        <section class="block block--first">
          <div class="list-head"><h3>${t.tasks.yourTasks(esc(group))}</h3><button type="button" class="link-btn" data-change-group>${t.tasks.changeGroup}</button></div>
          ${mineTasks.length
            ? `<div class="list list--flat">${mineTasks.map((task) => taskRow(task, practiceById[task.practiceId])).join('')}</div>`
            : `<p class="meta">${t.tasks.noTasksForGroup(esc(group))}</p>`}
        </section>
        ${mine.length ? `
        <section class="block">
          <h3>${t.requests.title}</h3>
          <div class="list list--flat">${mine.map((r) => `
            <a class="label request-row request-row--${r.status}" href="#/solicitudes/${esc(r.id)}">
              <span class="request-row__practice">${esc(r.practice || '—')}</span>
              <span class="request-row__state">${requestFlag(r.status)}</span>
            </a>`).join('')}</div>
        </section>` : ''}
        ${versionFooter()}
      </section>`;
    view.querySelector('[data-change-group]').addEventListener('click', () => {
      view.querySelector('.home').innerHTML = `${roleLine()}${groupForm}`;
      bindGroupForm(view);
    });
  }
  bindGroupForm(view);
}

function bindGroupForm(view) {
  view.querySelector('[data-group]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const group = e.target.group.value.trim();
    if (!groupKey(group)) return;
    await setSetting('studentGroup', group);
    studentHome(view);
  });
}

function card(href, text, n, level) {
  const marker = { hazard: '<span class="hazard" aria-hidden="true"></span>', amber: '<span class="amber-dot" aria-hidden="true"></span>', open: '<span class="open-dot" aria-hidden="true"></span>' }[level];
  return `<a class="status-card${n ? ` status-card--${level}` : ' status-card--calm'}" href="${href}">${n ? marker : ''}<span>${text}</span><span aria-hidden="true">›</span></a>`;
}
