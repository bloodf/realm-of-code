// Turns our code-made pixel art into Phaser textures: the 16x16 sprites (with the
// player's tunic colours) and procedural ground tiles (soil, grass, path, pond).
import type Phaser from 'phaser';
import { spritePixels, TUNICS } from '../grid/sprites';
import { hex, rng, CANVAS_OF } from '../pixel/scenes';

function canvasOf(w: number, h: number, data: Uint8ClampedArray) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  return c;
}

/** Registers a sprite texture (once) and returns its key. */
export function spriteTex(scene: Phaser.Scene, name: string, tunic?: string): string {
  const key = tunic ? `${name}~${tunic}` : name;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvasOf(16, 16, spritePixels(name, tunic ? TUNICS[tunic] : undefined)));
  return key;
}

type Rgb = [number, number, number];
const mix = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

function paint(w: number, h: number, fn: (x: number, y: number, r: () => number) => Rgb | null, seed: number) {
  const r = rng(seed);
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = fn(x, y, r);
    if (!c) continue;
    const i = (y * w + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return d;
}

export type TileKind = 'soil' | 'soilWet' | 'grass' | 'path' | 'pond' | 'pond2' | 'grassDark' | 'stone';

const TILE_PAINTERS: Record<TileKind, (x: number, y: number, r: () => number) => Rgb> = {
  soil: (x, y, r) => {
    const furrow = y % 4 === 3, top = y % 4 === 0;
    const v = r();
    if (furrow) return hex(v < 0.2 ? '#4a2c18' : '#5e3a24');
    if (top) return hex(v < 0.3 ? '#b07a44' : '#a06a3a');
    return hex(v < 0.08 ? '#6b4226' : v > 0.93 ? '#b88050' : '#8a5a34');
  },
  soilWet: (x, y, r) => {
    const furrow = y % 4 === 3, top = y % 4 === 0;
    const v = r();
    if (furrow) return hex('#2e1c10');
    if (top) return hex(v < 0.25 ? '#6a7890' : '#5a3a24');
    return hex(v < 0.1 ? '#3a2414' : v > 0.95 ? '#7a8aa8' : '#4a2e1a');
  },
  grass: (x, y, r) => { const v = r(); return hex(v < 0.1 ? '#5a9a3c' : v > 0.94 ? '#84c95c' : v > 0.985 ? '#fff4dc' : '#6cb04a'); },
  grassDark: (x, y, r) => { const v = r(); return hex(v < 0.12 ? '#4a8a32' : v > 0.95 ? '#6cb04a' : '#5a9a3c'); },
  path: (x, y, r) => { const v = r(); return hex(v < 0.08 ? '#bd9660' : v > 0.92 ? '#ead0a0' : v > 0.985 ? '#8a6a3e' : '#d8b47c'); },
  stone: (x, y, r) => { const v = r(); const edge = x % 8 === 0 || y % 8 === (x < 8 ? 0 : 4); return hex(edge ? '#6c6875' : v < 0.1 ? '#8d8a94' : '#aeaab6'); },
  pond: (x, y, r) => { const wave = (x + y * 2) % 11 === 0 && y % 4 === 1; const v = r(); return wave ? hex('#9fd8f5') : mix(hex('#3f7fc9'), hex('#2f5fa8'), v < 0.3 ? 0.6 : 0) as Rgb; },
  pond2: (x, y, r) => { const wave = (x + 5 + y * 2) % 11 === 0 && y % 4 === 3; const v = r(); return wave ? hex('#9fd8f5') : mix(hex('#3f7fc9'), hex('#2f5fa8'), v < 0.3 ? 0.6 : 0) as Rgb; },
};

/** A 16x16 ground tile; `variant` picks one of a few random-looking versions. */
export function tileTex(scene: Phaser.Scene, kind: TileKind, variant = 0): string {
  const key = `tile:${kind}:${variant}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvasOf(16, 16, paint(16, 16, TILE_PAINTERS[kind], 1000 + variant * 97 + kind.length * 13)));
  return key;
}

/** A single-colour pixel (for particles). */
export function dotTex(scene: Phaser.Scene, color: string, size = 2): string {
  const key = `dot:${color}:${size}`;
  if (!scene.textures.exists(key)) {
    const [r, g, b] = hex(color);
    const d = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < size * size; i++) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; }
    scene.textures.addCanvas(key, canvasOf(size, size, d));
  }
  return key;
}

/** Any painted canvas (buildings, signs...). */
export function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, data: Uint8ClampedArray): string {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvasOf(w, h, data));
  return key;
}

/** A painted image (see pixel/scenes.ts) as a texture. */
const urlKeys = new Map<string, string>();
let urlSeq = 0;
export function paintedTex(scene: Phaser.Scene, url: string): string {
  let key = urlKeys.get(url);
  if (!key) { key = `painted:${++urlSeq}`; urlKeys.set(url, key); }
  if (!scene.textures.exists(key)) {
    const cv = CANVAS_OF.get(url);
    if (cv) scene.textures.addCanvas(key, cv);
  }
  return key;
}
