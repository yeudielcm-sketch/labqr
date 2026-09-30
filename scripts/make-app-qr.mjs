// Writes the QR that opens the published app: docs/concurso/qr/labqr-app.svg
import { writeFileSync } from 'node:fs';
import { renderSVG } from 'uqr';

const url = process.argv[2] || 'https://yeudielcm-sketch.github.io/labqr/';
const svg = renderSVG(url, { ecc: 'M', border: 4, pixelSize: 12, blackColor: '#1B3A8C', whiteColor: '#FFFFFF' });
writeFileSync(new URL('../docs/concurso/qr/labqr-app.svg', import.meta.url), svg);
console.log('QR for', url);
