// Respaldo (SPEC §5.7, F4): full JSON backup and restore, CSV exports, initial inventory import.
import { db } from '../../db/schema.js';
import { getSetting, loadCatalog, setSetting } from '../../db/catalog.js';
import { loadLoans } from '../../db/movements.js';
import { importInventoryRows, readAllTables, replaceAllTables, requestPersistence } from '../../db/backupStore.js';
import { backupFileName, backupSummary, buildBackup, validateBackup } from '../../io/backup.js';
import { inventoryCSV, loansCSV, movementsCSV, parseInventoryCSV, templateCSV } from '../../io/csv.js';
import { t } from '../strings.js';
import { esc } from '../components/html.js';
import { confirmDialog, toast } from '../components/feedback.js';
import { formatDateTime } from '../components/format.js';
import { canShareFiles, downloadText, readFileText, shareText } from '../components/download.js';

const JSON_MIME = 'application/json';
const CSV_MIME = 'text/csv;charset=utf-8';
const stamp = () => new Date().toISOString().slice(0, 10);
const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]));

export const backup = {
  title: t.backup.title,
  tab: null,
  back: '/menu',
  async render(view) {
    const last = await getSetting('lastBackupAt', null);
    const persisted = await requestPersistence();
    const share = canShareFiles();

    view.innerHTML = `
      <section class="screen stack backup-screen">
        <p class="notice">${t.backup.why}</p>
        <p class="meta">${persisted === null ? '' : persisted ? t.backup.persistOk : t.backup.persistNo}</p>

        <section class="block">
          <h3>${t.backup.full}</h3>
          <p><strong>${last ? t.backup.last(formatDateTime(last)) : t.backup.never}</strong></p>
          <button type="button" class="btn btn--primary btn--block btn--big" data-export>${t.backup.download}</button>
          ${share ? `<button type="button" class="btn btn--block" data-share>${t.backup.share}</button><p class="meta">${t.backup.shareHelp}</p>` : ''}
          <label class="btn btn--block file-btn">${t.backup.restore}<input type="file" accept=".json,application/json" data-restore hidden /></label>
          <p class="meta">${t.backup.restoreHelp}</p>
        </section>

        <section class="block">
          <h3>${t.backup.csv}</h3>
          <p class="meta">${t.backup.csvHelp}</p>
          <div class="button-grid">
            <button type="button" class="btn" data-csv="inventory">${t.backup.csvInventory}</button>
            <button type="button" class="btn" data-csv="movements">${t.backup.csvMovements}</button>
            <button type="button" class="btn" data-csv="loans">${t.backup.csvLoans}</button>
          </div>
        </section>

        <section class="block">
          <h3>${t.backup.importTitle}</h3>
          <p class="meta">${t.backup.importHelp}</p>
          <div class="row-2">
            <button type="button" class="btn" data-template>${t.backup.template}</button>
            <label class="btn file-btn">${t.backup.chooseCsv}<input type="file" accept=".csv,text/csv" data-import hidden /></label>
          </div>
          <div data-preview></div>
        </section>
      </section>`;

    const $ = (s) => view.querySelector(s);

    // lastBackupAt is written before reading the tables, so the file itself carries it and a
    // restore gives back exactly the same data.
    const makeBackup = async () => {
      const previous = await getSetting('lastBackupAt', null);
      await setSetting('lastBackupAt', new Date().toISOString());
      const data = buildBackup(await readAllTables());
      return { name: backupFileName(), text: JSON.stringify(data), previous };
    };
    const undoMark = (previous) => (previous ? setSetting('lastBackupAt', previous) : db.settings.delete('lastBackupAt'));

    $('[data-export]').addEventListener('click', async () => {
      const { name, text } = await makeBackup();
      downloadText(name, text, JSON_MIME);
      toast(t.backup.downloaded);
      this.render(view);
    });

    $('[data-share]')?.addEventListener('click', async () => {
      const { name, text, previous } = await makeBackup();
      if (!(await shareText(name, text, JSON_MIME))) await undoMark(previous);
      this.render(view);
    });

    $('[data-restore]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      let data = null;
      try {
        data = JSON.parse(await readFileText(file));
      } catch {
        return toast(t.backup.errors.notJson, { danger: true });
      }
      const problem = validateBackup(data);
      if (problem) return toast(t.backup.errors[problem], { danger: true });
      const s = backupSummary(data);
      const ok = await confirmDialog(t.backup.restoreQ({ ...s, when: formatDateTime(s.exportedAt) }), { confirmLabel: t.backup.restore, danger: true });
      if (!ok) return;
      await replaceAllTables(data.tables);
      toast(t.backup.restored);
      this.render(view);
    });

    view.querySelector('.button-grid').addEventListener('click', async (e) => {
      const kind = e.target.closest('[data-csv]')?.dataset.csv;
      if (!kind) return;
      const cat = await loadCatalog();
      if (kind === 'inventory') {
        downloadText(`labqr-inventario-${stamp()}.csv`, inventoryCSV(cat.items, cat.stocks, byId(cat.labs), byId(cat.locations)), CSV_MIME);
      } else if (kind === 'movements') {
        const [movements, borrowers, loans] = await Promise.all([db.movements.toArray(), db.borrowers.toArray(), db.loans.toArray()]);
        downloadText(`labqr-movimientos-${stamp()}.csv`, movementsCSV(movements, byId(cat.items), byId(borrowers), byId(loans)), CSV_MIME);
      } else {
        downloadText(`labqr-vales-${stamp()}.csv`, loansCSV(await loadLoans()), CSV_MIME);
      }
    });

    $('[data-template]').addEventListener('click', () => downloadText('labqr-plantilla-inventario.csv', templateCSV(), CSV_MIME));

    $('[data-import]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const { rows, errors } = parseInventoryCSV(await readFileText(file));
      $('[data-preview]').innerHTML = `
        <div class="import-preview">
          <p><strong>${t.backup.preview(rows.length, errors.length)}</strong></p>
          ${errors.length ? `<ul class="import-errors">${errors.slice(0, 20).map((er) => `<li>${esc(t.backup.lineError(er.line, er.message))}</li>`).join('')}</ul>` : ''}
          ${rows.length ? `<button type="button" class="btn btn--primary btn--block" data-do-import>${t.backup.importBtn(rows.length)}</button>` : ''}
        </div>`;
      $('[data-do-import]')?.addEventListener('click', async (ev) => {
        ev.target.disabled = true;
        const n = await importInventoryRows(rows);
        toast(t.backup.imported(n));
        $('[data-preview]').innerHTML = '';
      });
    });
  },
};
