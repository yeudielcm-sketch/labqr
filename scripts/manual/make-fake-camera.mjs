// Builds a Y4M video (what Chrome accepts as a fake camera) showing a LabQR label on a bench:
// grey table, white label, cobalt stripe, and the real QR of QUI-0007.
import { writeFileSync } from 'node:fs';
import { encode } from 'file:///C:/Users/yeudi/OneDrive/Imágenes/Desktop/LabCbtis/node_modules/uqr/dist/index.mjs';

const W = 480;
const H = 640;
const Y = new Uint8Array(W * H).fill(150); // bench
const U = new Uint8Array((W / 2) * (H / 2)).fill(128);
const V = new Uint8Array((W / 2) * (H / 2)).fill(128);

const rect = (x0, y0, w, h, y, u = 128, v = 128) => {
  for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) {
    Y[yy * W + xx] = y;
    if (yy % 2 === 0 && xx % 2 === 0) { U[(yy / 2) * (W / 2) + xx / 2] = u; V[(yy / 2) * (W / 2) + xx / 2] = v; }
  }
};

// Label (white paper), slightly off-center like a real hand-held shot.
rect(70, 170, 340, 300, 245);
rect(70, 170, 14, 300, 62, 170, 110); // cobalt kind stripe (equipment-style)
const { data } = encode('https://yeudielcm-sketch.github.io/labqr/#/i/QUI-0007', { ecc: 'M', border: 1 });
const n = data.length;
const px = Math.floor(230 / n);
const ox = 125;
const oy = 205;
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (data[r][c]) rect(ox + c * px, oy + r * px, px, px, 16);

const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`);
const frame = Buffer.concat([Buffer.from('FRAME\n'), Buffer.from(Y), Buffer.from(U), Buffer.from(V)]);
writeFileSync('fake-camera.y4m', Buffer.concat([header, frame, frame, frame]));
console.log('fake camera ready', n, 'modules');
