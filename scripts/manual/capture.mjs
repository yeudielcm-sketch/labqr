// Takes the user-manual screenshots from the built app (vite preview on :4174), phone-sized.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const OUT = 'C:/Users/yeudi/OneDrive/Imágenes/Desktop/LabCbtis/docs/concurso/capturas/';
const BASE = 'http://localhost:4174/labqr/';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-video-capture=${process.cwd().replaceAll('\\', '/')}/fake-camera.y4m`,
    '--lang=es-MX',
  ],
});
const page = await browser.newPage();
await page.emulateTimezone('America/Mexico_City');
const phone = () => page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await phone();

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const go = async (hash, ms = 900) => {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await wait(ms);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(150);
};
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log('✓', name);
};
const scrollTo = async (selector, offset = 0) => {
  await page.evaluate((s, o) => {
    const el = document.querySelector(s);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70 + o);
  }, selector, offset);
  await wait(300);
};

await page.goto(BASE, { waitUntil: 'networkidle0' });
await wait(800);

// 1. Empty start
await shot('01-inicio-vacio');
await go('/menu');
await shot('02-menu');
await go('/ajustes');
await shot('03-ajustes-demo');

// Load the demo through the real button
await page.click('[data-demo]');
await wait(4200); // let the toast fade
await page.evaluate(() => window.scrollTo(0, 0));
await shot('04-inicio-con-datos');

// 2. Catalog
await go('/articulos');
await shot('05-articulos');
await page.evaluate(() => {
  const q = document.querySelector('[name="q"]');
  q.value = 'alcohol';
  q.dispatchEvent(new Event('input'));
});
await wait(400);
await shot('06-articulos-busqueda');

await go('/i/QUI-0007');
await shot('07-ficha-probeta');
await scrollTo('.item-moves');
await shot('08-ficha-movimientos');
await scrollTo('.history');
await shot('09-ficha-historial');

await go('/i/BIO-0002');
await shot('10-ficha-equipo-prestado');

await go('/articulos/nuevo');
await page.click('input[name="kind"][value="reagent"]');
await wait(300);
await shot('11-nuevo-articulo');

// 3. Labels and scanner
await go('/etiquetas?codigos=QUI-0007,QUI-0016,BIO-0002,QUI-0001');
await shot('12-etiquetas');
await scrollTo('[data-sheets]', -20);
await shot('13-etiquetas-vista-previa');

// For the picture only: a detector that never fires, so the screen stays on the camera view.
await page.evaluate(() => {
  window.BarcodeDetector = class {
    static async getSupportedFormats() { return ['qr_code']; }
    async detect() { return []; }
  };
});
await go('/escanear', 3000);
await shot('14-escanear');

// 4. Loans
await go('/vales');
await shot('15-vales');

// Practices (F6)
await go('/practicas');
await shot('25-practicas');
await page.evaluate(() => [...document.querySelectorAll('.practice-row')].find((a) => a.textContent.includes('Titulación')).click());
await wait(1000);
await shot('26-practica-editar');

await go('/vales/nuevo');
// New student without control number → the app asks for it
await page.evaluate(() => {
  document.querySelector('.new-borrower').open = true;
  const f = document.querySelector('[data-borrower-form]');
  f.bname.value = 'Ana Torres';
  f.btype.value = 'student';
  f.btype.dispatchEvent(new Event('change'));
  f.bgroup.value = '5° B';
  f.requestSubmit();
});
await wait(400);
await scrollTo('.new-borrower', -10);
await shot('27-alumno-numero-de-control');
await page.evaluate(() => {
  const f = document.querySelector('[data-borrower-form]');
  f.bsid.value = '21308050123';
  f.requestSubmit();
});
await wait(1200);
// Fill the loan from a saved practice
await page.evaluate(() => {
  const sel = document.querySelector('[name="practiceId"]');
  sel.value = [...sel.options].find((o) => o.textContent.includes('Titulación')).value;
  sel.dispatchEvent(new Event('change'));
});
await wait(3200); // let the toast fade
await page.evaluate(() => window.scrollTo(0, 0));
await wait(200);
await shot('16-nuevo-vale');
await scrollTo('[data-lines]', -10);
await shot('17-nuevo-vale-articulos');
await page.click('[data-confirm]');
await wait(1600);
await page.evaluate(() => window.scrollTo(0, 0));
await wait(2700);
await shot('18-prestamo-confirmado');

await go('/vales');
const overdue = await page.$eval('.loan-row--overdue', (a) => a.getAttribute('href'));
await go(overdue.slice(1));
await shot('19-vale-vencido');
await scrollTo('.lines', -10);
await shot('20-vale-devolucion');

// Reagent comes back in one step (open demo loan: onion cells, methylene blue)
await go('/vales');
const open = await page.$$eval('.loan-row--open', (rows) => rows.find((a) => a.textContent.includes('cebolla')).getAttribute('href'));
await page.goto(`${BASE}${open}`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-returned]', { timeout: 10000 });
await page.evaluate(() => {
  const input = document.querySelector('[data-returned]');
  input.value = '5';
  input.closest('.line').scrollIntoView({ block: 'center' });
});
await wait(400);
await shot('28-reactivo-regreso');
// Broken item with a note (dialog only; cancelled afterwards)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('[data-act="LOSS"]')].find((b) => b.closest('.line').textContent.includes('Portaobjetos'));
  btn.click();
});
await wait(500);
await page.evaluate(() => {
  const d = document.querySelector('dialog[open]');
  d.querySelector('textarea').value = 'Se rompió al lavarlo';
});
await shot('29-roto-con-nota');
await page.evaluate(() => document.querySelector('dialog[open] button[value=cancel]').click());
await wait(300);

// 5. Backup
await go('/respaldo');
await shot('21-respaldo');
await scrollTo('.button-grid', -150);
await shot('22-respaldo-csv');

// 6. Close-up of a printed label
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 3 });
// Same-document hash changes can be skipped after a viewport change: set the hash and reload.
await page.evaluate(() => { location.hash = '/etiquetas?codigos=QUI-0007'; });
await page.reload({ waitUntil: 'networkidle0' });
const label = await page.waitForSelector('.qr-label', { timeout: 10000 });
await page.addStyleTag({ content: '.topbar, .tabbar, .print-bar { display: none !important; } .sheet { zoom: 1 !important; }' });
await label.scrollIntoView();
await wait(300);
await label.screenshot({ path: `${OUT}23-etiqueta-impresa.png` });
console.log('✓ 23-etiqueta-impresa');

// 7. Board on a TV-sized screen
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.5 });
await go('/tablero', 1800);
await shot('24-tablero');

await browser.close();
