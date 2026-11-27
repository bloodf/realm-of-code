// Exports the game's code-made art and sound to real files:
//   public/assets/sprites/*.png  (16x16 and 4x scaled)
//   public/assets/sprites/sheet.png (all sprites, 4x)
//   public/assets/sfx/*.wav and public/assets/music/theme.wav
// Run: npm run export-assets
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SPRITES, spritePixels, tilePixels, type SpriteName, type TileName } from '../src/grid/sprites.ts';
import { SFX, music, RATE } from '../src/audio/synth.ts';
import { ICONS } from '../src/pixel/icons.ts';

const root = path.resolve(import.meta.dirname, '..');
const out = (...p: string[]) => path.join(root, 'public', 'assets', ...p);

function crc32(buf: Buffer) {
  let c: number, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function png(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function scale(src: Uint8ClampedArray, w: number, h: number, s: number) {
  const dst = new Uint8ClampedArray(w * s * h * s * 4);
  for (let y = 0; y < h * s; y++) for (let x = 0; x < w * s; x++) {
    const si = (Math.floor(y / s) * w + Math.floor(x / s)) * 4, di = (y * w * s + x) * 4;
    dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = src[si + 3];
  }
  return dst;
}

function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

fs.mkdirSync(out('sprites'), { recursive: true });
fs.mkdirSync(out('sfx'), { recursive: true });
fs.mkdirSync(out('music'), { recursive: true });

const names = Object.keys(SPRITES) as SpriteName[];
const tiles: TileName[] = ['grass', 'flowers', 'path', 'wall', 'water', 'water2', 'bridge', 'stone'];
const all: Uint8ClampedArray[] = [...names.map((n) => spritePixels(n)), ...tiles.map((t) => tilePixels(t))];
names.forEach((n, i) => {
  fs.writeFileSync(out('sprites', `${n.replace('@', '_')}.png`), png(16, 16, all[i]));
  fs.writeFileSync(out('sprites', `${n.replace('@', '_')}@4x.png`), png(64, 64, scale(all[i], 16, 16, 4)));
});
tiles.forEach((t, i) => fs.writeFileSync(out('sprites', `tile-${t}.png`), png(16, 16, all[names.length + i])));

// Sprite sheet: 8 per row, 4x scale, with a 2px gap on a dark background
const per = 8, cell = 16 * 4 + 4;
const rows = Math.ceil(all.length / per);
const W = per * cell, H = rows * cell;
const sheet = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < sheet.length; i += 4) { sheet[i] = 0x3a; sheet[i + 1] = 0x2a; sheet[i + 2] = 0x1f; sheet[i + 3] = 255; }
all.forEach((px, i) => {
  const big = scale(px, 16, 16, 4);
  const ox = (i % per) * cell + 2, oy = Math.floor(i / per) * cell + 2;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const si = (y * 64 + x) * 4;
    if (big[si + 3] === 0) continue;
    const di = ((oy + y) * W + ox + x) * 4;
    sheet[di] = big[si]; sheet[di + 1] = big[si + 1]; sheet[di + 2] = big[si + 2]; sheet[di + 3] = 255;
  }
});
fs.writeFileSync(out('sprites', 'sheet.png'), png(W, H, sheet));

// Icon sheet: 12x12 icons at 4x, 10 per row
{
  const names = Object.keys(ICONS);
  const per2 = 10, cell2 = 12 * 4 + 8;
  const W2 = per2 * cell2, H2 = Math.ceil(names.length / per2) * cell2;
  const img = new Uint8ClampedArray(W2 * H2 * 4);
  for (let i = 0; i < img.length; i += 4) { img[i] = 0xf3; img[i + 1] = 0xe4; img[i + 2] = 0xbf; img[i + 3] = 255; }
  names.forEach((n, i) => {
    const ox = (i % per2) * cell2 + 4, oy = Math.floor(i / per2) * cell2 + 4;
    ICONS[n].forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch !== '#') return;
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
        const di = ((oy + y * 4 + dy) * W2 + ox + x * 4 + dx) * 4;
        img[di] = 0x2b; img[di + 1] = 0x1a; img[di + 2] = 0x12;
      }
    }));
  });
  fs.writeFileSync(out('sprites', 'icons.png'), png(W2, H2, img));
  fs.writeFileSync(out('sprites', 'icons.txt'), names.join('\n'));
}

for (const [name, fn] of Object.entries(SFX)) fs.writeFileSync(out('sfx', `${name}.wav`), wav(fn()));
fs.writeFileSync(out('music', 'theme.wav'), wav(music()));

console.log(`Exported ${names.length} sprites, ${tiles.length} tiles, ${Object.keys(SFX).length} sound effects and 1 music track to public/assets/`);
