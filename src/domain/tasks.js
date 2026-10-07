// Tasks (F7): a teacher assigns a saved practice to a group for a date. From the task the
// student knows what to ask for in the request. Pure functions.

// "4° a", "4A", "4º A" → "4A", so the student finds their task however the group was typed.
export function groupKey(group) {
  return String(group ?? '').toUpperCase().replace(/[\s°º.\-]/g, '');
}

export function taskProblems({ practiceId, group, date }) {
  if (!practiceId) return 'practice';
  if (!groupKey(group)) return 'group';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return 'date';
  return null;
}

// Local calendar date as YYYY-MM-DD (task dates have no time of day).
export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 'today' | 'upcoming' | 'past'
export function taskWhen(task, today = localDate()) {
  if (task.date === today) return 'today';
  return task.date > today ? 'upcoming' : 'past';
}

// Tasks still worth showing: not archived and not older than `keepDays` (a student may ask
// for material a day late). Today first, then the closest upcoming, then the recent past.
export function visibleTasks(tasks, { group = null, today = localDate(), keepDays = 7 } = {}) {
  const cutoff = new Date(`${today}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - keepDays);
  const oldest = localDate(cutoff);
  const rank = { today: 0, upcoming: 1, past: 2 };
  return tasks
    .filter((t) => !t.archived && t.date >= oldest && (group === null || groupKey(t.group) === groupKey(group)))
    .sort((a, b) => {
      const wa = taskWhen(a, today);
      const wb = taskWhen(b, today);
      if (wa !== wb) return rank[wa] - rank[wb];
      return wa === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
}
