// Draws the LabQR app icon (a graduated cylinder on cobalt) as PNGs with no dependencies.
// Run once: node scripts/make-icons.mjs  → public/icons/*.png
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const COBALT = [0x1b, 0x3a, 0x8c];
const GLASS = [0xbf, 0xe3, 0xea];
const WHITE = [0xff, 0xff, 0xff];

// Shapes in a 100×100 design space; later shapes paint over earlier ones.
function shapes(safe) {
  // `safe` shrinks the drawing into the maskable safe zone (inner 80%).
  const k = safe ? 0.72 : 0.86;
  const o = (100 - 100 * k) / 2;
  const R = (x, y, w, h, c) => ({ x: o + x * k, y: o + y * k, w: w * k, h: h * k, c });
  return [
    R(34, 8, 32, 5, WHITE), // lip
    R(37, 8, 5, 74, WHITE), // left wall
    R(58, 8, 5, 74, WHITE), // right wall
    R(42, 44, 16, 38, GLASS), // liquid
    R(42, 30, 9, 2.5, WHITE), // ticks
    R(42, 20, 6, 2.5, WHITE),
    R(42, 40, 6, 2.5, WHITE),
    R(24, 82, 52, 8, WHITE), // foot
  ];
}

function draw(size, { safe = false, bg = COBALT, radius = 0.18 } = {}) {
  const px = new Uint8Array(size * size * 4);
  const list = shapes(safe);
  const r = radius * size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-square background (full square for maskable).
      const cx = Math.max(r - x, 0, x - (size - 1 - r));
      const cy = Math.max(r - y, 0, y - (size - 1 - r));
      const inside = cx * cx + cy * cy <= r * r;
      if (!inside) continue;
      let c = bg;
      const u = ((x + 0.5) / size) * 100;
      const v = ((y + 0.5) / size) * 100;
      for (const s of list) if (u >= s.x && u < s.x + s.w && v >= s.y && v < s.y + s.h) c = s.c;
      px.set([...c, 255], i);
    }
  }
  return png(size, px);
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const out = new URL('../public/icons/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('icon-192.png', out), draw(192));
writeFileSync(new URL('icon-512.png', out), draw(512));
writeFileSync(new URL('icon-maskable-512.png', out), draw(512, { safe: true, radius: 0 }));
writeFileSync(new URL('apple-touch-icon.png', out), draw(180, { radius: 0 }));
console.log('icons written');
