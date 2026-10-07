// Tareas (F7): the teacher assigns a saved practice to a group for a date; the student sees it
// on Inicio and asks for its material from here.
import { loadCatalog } from '../../db/catalog.js';
import { listPractices } from '../../db/practices.js';
import { getTask, listRequests, listTasks, saveTask, setTaskArchived } from '../../db/requests.js';
import { localDate, taskWhen, visibleTasks } from '../../domain/tasks.js';
import { requestCountsByTask } from '../../domain/requests.js';
import { go } from '../router.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { formatDay } from '../components/format.js';
import { materialList } from '../components/materialList.js';
import { allowed } from '../session.js';

// One task as a row: day, practice, group and (for the teacher) how its requests are going.
export function taskRow(task, practice, counts = null) {
  const when = taskWhen(task);
  return `
    <a class="label task-row task-row--${when}" href="#/tareas/${esc(task.id)}">
      <span class="task-row__day code">${when === 'today' ? t.tasks.when.today : esc(formatDay(task.date))}</span>
      <span class="task-row__name">${esc(practice?.name ?? '—')}</span>
      <span class="meta">${esc(task.group)}${practice?.teacher ? ` · ${esc(practice.teacher)}` : ''}</span>
      ${counts ? `<span class="meta task-row__counts">${t.tasks.requests(counts)}</span>` : ''}
    </a>`;
}

export const taskList = {
  title: t.tasks.title,
  tab: '/tareas',
  async render(view) {
    const [tasks, practices, requests] = await Promise.all([listTasks(), listPractices({ includeArchived: true }), listRequests()]);
    const practiceById = Object.fromEntries(practices.map((p) => [p.id, p]));
    const counts = requestCountsByTask(requests);
    const shown = visibleTasks(tasks, { keepDays: 30 });
    view.innerHTML = `
      <section class="screen stack">
        <p class="meta">${t.tasks.intro}</p>
        <a class="btn btn--primary btn--block btn--big" href="#/tareas/nueva">+ ${t.tasks.add}</a>
        ${allowed('practices') ? `<a class="btn btn--block" href="#/practicas">${t.menu.practices}</a>` : ''}
        ${shown.length
          ? `<div class="list">${shown.map((task) => taskRow(task, practiceById[task.practiceId], counts[task.id] ?? { pending: 0, approved: 0, rejected: 0 })).join('')}</div>`
          : `<div class="empty"><p>${t.tasks.empty}</p></div>`}
      </section>`;
  },
};

export const taskDetail = {
  title: t.tasks.detailTitle,
  tab: '/tareas',
  back: '/',
  async render(view, { id }) {
    const [task, cat, practices, requests] = await Promise.all([getTask(id), loadCatalog(), listPractices({ includeArchived: true }), listRequests()]);
    if (!task) {
      view.innerHTML = `<section class="screen"><div class="empty"><p>${t.tasks.notFound}</p></div></section>`;
      return;
    }
    const practice = practices.find((p) => p.id === task.practiceId);
    const itemsById = Object.fromEntries(cat.items.filter((i) => !i.archived).map((i) => [i.id, i]));
    const counts = requestCountsByTask(requests)[task.id];
    const when = taskWhen(task);
    view.innerHTML = `
      <section class="screen stack task-detail">
        <header class="label task-head">
          <span class="task-head__day code">${when === 'today' ? t.tasks.when.today : esc(formatDay(task.date))}</span>
          <h2 class="task-head__name">${esc(practice?.name ?? '—')}</h2>
          <p class="meta">${esc(task.group)}${practice?.teacher ? ` · ${esc(practice.teacher)}` : ''}</p>
          ${task.notes ? `<p class="task-head__notes">${esc(task.notes)}</p>` : ''}
        </header>
        ${allowed('request') && !task.archived ? `<a class="btn btn--primary btn--block btn--big" href="#/solicitudes/nueva?tarea=${esc(task.id)}">${t.tasks.ask}</a>` : ''}
        <section class="block">
          <h3>${t.tasks.material}</h3>
          ${materialList(practice?.items ?? [], itemsById, cat.stocks)}
        </section>
        ${allowed('tasks') ? `
        <section class="block">
          <h3>${t.requests.title}</h3>
          <p class="meta">${counts ? t.tasks.requests(counts) : t.tasks.noRequests}</p>
          <div class="row-2">
            <a class="btn" href="#/tareas/${esc(task.id)}/editar">${t.common.edit}</a>
            <a class="btn" href="#/solicitudes">${t.requests.title}</a>
          </div>
          ${task.archived ? '' : `<button type="button" class="btn btn--block btn--danger-outline" data-archive>${t.tasks.archive}</button>`}
        </section>` : ''}
      </section>`;

    view.querySelector('[data-archive]')?.addEventListener('click', async () => {
      if (!(await confirmDialog(t.tasks.archiveQ, { confirmLabel: t.tasks.archive, danger: true }))) return;
      await setTaskArchived(task.id, true);
      toast(t.tasks.archived);
      go('/tareas');
    });
  },
};

function formScreen(mode) {
  return {
    title: mode === 'new' ? t.tasks.newTitle : t.tasks.editTitle,
    tab: '/tareas',
    back: '/tareas',
    async render(view, params, query) {
      const [practices, existing] = await Promise.all([listPractices(), mode === 'edit' ? getTask(params.id) : null]);
      if (mode === 'edit' && !existing) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${t.tasks.notFound}</p></div></section>`;
        return;
      }
      if (!practices.length) {
        view.innerHTML = `<section class="screen"><div class="empty"><p>${t.tasks.noPractices}</p><a class="btn btn--primary" href="#/practicas/nueva">${t.tasks.goPractices}</a></div></section>`;
        return;
      }
      const practiceId = existing?.practiceId ?? query.practica ?? '';
      view.innerHTML = `
        <form class="screen stack" novalidate>
          <label class="field-group"><span>${t.tasks.practice}</span>
            <select class="field" name="practiceId">
              <option value="">${t.tasks.practicePick}</option>
              ${practices.map((p) => `<option value="${esc(p.id)}" ${p.id === practiceId ? 'selected' : ''}>${esc(p.name)}${p.teacher ? ` · ${esc(p.teacher)}` : ''}</option>`).join('')}
            </select></label>
          <div class="row-2">
            <label class="field-group"><span>${t.tasks.group}</span>
              <input class="field" name="group" maxlength="20" value="${esc(existing?.group ?? '')}" placeholder="${t.tasks.groupPh}" /></label>
            <label class="field-group"><span>${t.tasks.date}</span>
              <input class="field" name="date" type="date" value="${esc(existing?.date ?? localDate())}" /></label>
          </div>
          <label class="field-group"><span>${t.tasks.notes}</span>
            <textarea class="field" name="notes" rows="2" maxlength="200" placeholder="${t.tasks.notesPh}">${esc(existing?.notes ?? '')}</textarea></label>
          <p class="form-error" role="alert" data-error hidden></p>
          <div class="form-actions">
            <a class="btn" href="#/tareas">${t.common.cancel}</a>
            <button class="btn btn--primary" type="submit">${t.common.save}</button>
          </div>
        </form>`;

      const form = view.querySelector('form');
      let saving = false;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (saving) return;
        saving = true;
        const res = await saveTask({ id: existing?.id, practiceId: form.practiceId.value, group: form.group.value, date: form.date.value, notes: form.notes.value });
        saving = false;
        if (res.problem) {
          const err = view.querySelector('[data-error]');
          err.textContent = t.tasks.errors[res.problem];
          err.hidden = false;
          return;
        }
        toast(t.tasks.saved);
        go(`/tareas/${res.task.id}`);
      });
    },
  };
}

export const taskNew = formScreen('new');
export const taskEdit = formScreen('edit');
