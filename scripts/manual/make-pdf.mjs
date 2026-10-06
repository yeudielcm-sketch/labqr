// Prints docs/concurso/manual/MANUAL-USUARIO.html to docs/concurso/MANUAL-USUARIO.pdf (letter).
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';

const ROOT = 'C:/Users/yeudi/OneDrive/Imágenes/Desktop/LabCbtis/docs/concurso/';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.goto(pathToFileURL(`${ROOT}manual/MANUAL-USUARIO.html`).href, { waitUntil: 'networkidle0' });
await page.evaluateHandle('document.fonts.ready');
const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')));
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`));
await page.pdf({
  path: `${ROOT}MANUAL-USUARIO.pdf`,
  format: 'Letter',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font-size:8pt;color:#4A525C;padding:0 0.65in;display:flex;justify-content:space-between;font-family:sans-serif"><span>C-Lab · Manual de usuario</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
console.log({ broken, fonts });
await browser.close();
