// Pixel scenery painters: the world path (one map chunk per unit), landscape bands
// for lessons, and the title castle. Everything is drawn at "art pixel" size and
// scaled up by CSS with image-rendering: pixelated.
import { spritePixels } from '../grid/sprites';
import { ICONS } from './icons';

type RGB = [number, number, number];
export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export interface Biome {
  ground: [string, string, string];        // base, dark, light
  road: [string, string, string, string];  // base, dark, light, edge
  decos: [string, number][];               // sprite name, weight
  flowers?: string[];
  pool?: { deep: string; mid: string; light: string; shore: string; lava?: boolean };
  animated: string[];                      // ANIMS keys placed as DOM overlays
  sky: [string, string];
  hills: [string, string];
}

const DIRT: Biome['road'] = ['#d8b47c', '#bd9660', '#ead0a0', '#8a6a3e'];
const WATER = { deep: '#2f5fa8', mid: '#3f7fc9', light: '#9fd8f5', shore: '#d9c38a' };
const LAVA = { deep: '#a8321c', mid: '#e0601f', light: '#ffd23f', shore: '#3a2a24', lava: true };

export const BIOMES: Record<string, Biome> = {
  web: { ground: ['#6cb04a', '#5a9a3c', '#84c95c'], road: DIRT, decos: [['tree', 3], ['bush', 3], ['house', 1.2], ['rock', 1], ['sign', 0.4]], flowers: ['#fff4dc', '#f7f0a8', '#e06a6a'], pool: WATER, animated: ['torch', 'bird'], sky: ['#8fd0f0', '#d9f0ff'], hills: ['#4f9a3a', '#3d7f2e'] },
  html: { ground: ['#8fae5a', '#7a9a4a', '#a5c46c'], road: DIRT, decos: [['rock', 4], ['bush', 1.5], ['tree', 1], ['barrel', 1], ['house', 0.8], ['anvil', 0.6]], flowers: ['#f7f0a8'], animated: ['fire', 'torch'], sky: ['#a8d8f0', '#eaf6ff'], hills: ['#8a8596', '#6c6875'] },
  css: { ground: ['#7cc05a', '#69ad4a', '#95d670'], road: DIRT, decos: [['bush', 2], ['tent', 1.5], ['tree', 1.2], ['flag', 0.8]], flowers: ['#e06a6a', '#b58be0', '#f7f0a8', '#fff4dc', '#6ab0f0', '#f29ed0'], pool: WATER, animated: ['torch', 'bird'], sky: ['#f0c0e0', '#fff0f8'], hills: ['#8a56c9', '#6a3fa0'] },
  js: { ground: ['#4f8f3a', '#417b30', '#5fa346'], road: DIRT, decos: [['pine', 5], ['tree', 3], ['bush', 2], ['mushroom', 1], ['stump', 1]], flowers: ['#f7f0a8'], pool: WATER, animated: ['fire', 'goblin'], sky: ['#7fc0a0', '#d8f0d8'], hills: ['#2f6e43', '#1f4d33'] },
  tools: { ground: ['#9a8a62', '#867754', '#b09f76'], road: ['#c9a97a', '#a8895c', '#dcc29a', '#6e5433'], decos: [['anvil', 2], ['barrel', 3], ['rock', 2], ['house', 1], ['sign', 1]], animated: ['fire', 'torch'], sky: ['#c0a888', '#f0e4cc'], hills: ['#7a6a50', '#5e5038'] },
  api: { ground: ['#8d8a94', '#7a7782', '#a3a0aa'], road: ['#c9b48a', '#ad9870', '#dccaa0', '#5e5666'], decos: [['rock', 4], ['pine', 1.5], ['crystal', 0.5], ['sign', 0.5]], pool: WATER, animated: ['bird', 'bird'], sky: ['#9fb8d8', '#e4eef8'], hills: ['#6c6875', '#55515e'] },
  ts: { ground: ['#5a4e4a', '#4a403c', '#6c605a'], road: ['#8a6d55', '#6e5644', '#a08266', '#2e2420'], decos: [['rock', 3], ['anvil', 2], ['barrel', 1]], pool: LAVA, animated: ['fire', 'torch'], sky: ['#3a2a3a', '#8a4a3a'], hills: ['#3c302c', '#2a201c'] },
  tailwind: { ground: ['#a39a8c', '#8d8476', '#b8af9f'], road: ['#d8c8a8', '#bcab8a', '#ece0c4', '#6e6456'], decos: [['house', 2], ['tent', 2], ['barrel', 2], ['bush', 1]], flowers: ['#22a6b3', '#f7f0a8'], animated: ['torch', 'torch'], sky: ['#a0e0e8', '#e8fbff'], hills: ['#22a6b3', '#187a84'] },
  react: { ground: ['#6a68b8', '#5a57a3', '#7f7dd0'], road: ['#c9c0e8', '#a8a0d0', '#e4defa', '#3e3a70'], decos: [['crystal', 3], ['mushroom', 2], ['tree', 1], ['bush', 1]], flowers: ['#8fe3f2', '#fff4dc'], pool: WATER, animated: ['bird', 'torch'], sky: ['#3a3a80', '#8fc8f0'], hills: ['#4a4890', '#35336e'] },
  vue: { ground: ['#5cb36a', '#4c9f5b', '#73c982'], road: DIRT, decos: [['pine', 2], ['tree', 2], ['bush', 2], ['rock', 1]], flowers: ['#fff4dc', '#f7f0a8'], pool: WATER, animated: ['bird', 'fire'], sky: ['#a0e0c0', '#eafff4'], hills: ['#3a9a6a', '#2f7a52'] },
  svelte: { ground: ['#4a3a34', '#3c2e29', '#5c4a42'], road: ['#9a7a5a', '#7a5e44', '#b49272', '#2a1e1a'], decos: [['rock', 3], ['stump', 1.5], ['fire1', 0.6]], pool: LAVA, animated: ['fire', 'fire'], sky: ['#5a2a2a', '#e8783a'], hills: ['#3a2420', '#2a1814'] },
  node: { ground: ['#7aa84e', '#6a9640', '#8ebe60'], road: DIRT, decos: [['house', 3], ['barrel', 3], ['sign', 1], ['bush', 1], ['tree', 1]], flowers: ['#f7f0a8'], animated: ['torch', 'fire'], sky: ['#f0c890', '#fff0d8'], hills: ['#5c8a3a', '#46702c'] },
  sql: { ground: ['#c9b48a', '#b39f76', '#dccaa0'], road: ['#a8916a', '#8c7754', '#bea882', '#5e4e34'], decos: [['barrel', 1.5], ['sign', 1], ['house', 1.5], ['rock', 2]], animated: ['torch', 'torch'], sky: ['#e8c890', '#fff4dc'], hills: ['#a8813a', '#86652a'] },
  python: { ground: ['#5a7a9a', '#4a6a88', '#6c8cac'], road: ['#d8c890', '#c4b47a', '#e8d8a0', '#8a7a4a'], decos: [['house', 1.5], ['tree', 1.5], ['sign', 1], ['rock', 1]], flowers: ['#ffd43b', '#f7f0a8'], pool: WATER, animated: ['torch', 'bird'], sky: ['#a8c8e8', '#e8f4ff'], hills: ['#3776ab', '#2a5a88'] },
  php: { ground: ['#8a86b4', '#77739f', '#9d99c6'], road: DIRT, decos: [['house', 2], ['barrel', 1.5], ['sign', 1], ['tree', 1]], flowers: ['#e8e0f0', '#b58be0'], animated: ['torch', 'fire'], sky: ['#c8c0e8', '#f0ecff'], hills: ['#5a5690', '#48447a'] },
  nosql: { ground: ['#6a9a5a', '#5a884c', '#7cac6a'], road: DIRT, decos: [['rock', 3], ['barrel', 2], ['tree', 1.5], ['bush', 1.5]], flowers: ['#fff4dc', '#a8e08a'], pool: WATER, animated: ['torch', 'bird'], sky: ['#a8d8c0', '#e8fff4'], hills: ['#3d7f2e', '#2f6a24'] },
  algo: { ground: ['#9a6a6a', '#885a5a', '#ac7c7c'], road: ['#b8a8a0', '#a89890', '#c8b8b0', '#6a5a50'], decos: [['rock', 3], ['flag', 1.5], ['house', 1], ['anvil', 0.6]], flowers: ['#f7f0a8', '#e06a6a'], animated: ['fire', 'torch'], sky: ['#e8b0a8', '#fff0ec'], hills: ['#8a3a3a', '#6a2a2a'] },
  testing: { ground: ['#d9c08a', '#c4aa73', '#ead3a0'], road: ['#b89a68', '#9a7e50', '#ccb284', '#6e5634'], decos: [['dummy', 3], ['tent', 2], ['rock', 1], ['barrel', 1]], animated: ['fire', 'torch'], sky: ['#f0d8a0', '#fff8e4'], hills: ['#b8862f', '#926a22'] },
  quality: { ground: ['#e8eef6', '#cfdaea', '#ffffff'], road: ['#b9c9e0', '#9fb2cf', '#d6e2f2', '#6c7f99'], decos: [['snowPine', 4], ['rock', 2]], animated: ['torch', 'bird'], sky: ['#a8c0e0', '#f4f8ff'], hills: ['#dfe7f0', '#b9c9e0'] },
  career: { ground: ['#6fb34f', '#5c9e40', '#88c966'], road: ['#e0c896', '#c4aa74', '#f2e0b6', '#8a6a3e'], decos: [['bush', 3], ['tree', 2], ['house', 1], ['tent', 1], ['flag', 1]], flowers: ['#f7f0a8', '#e06a6a', '#b58be0'], pool: WATER, animated: ['torch', 'bird'], sky: ['#b08ad8', '#f4eaff'], hills: ['#6a3f9a', '#4f2e75'] },
};

export const biomeFor = (courseId: string) => BIOMES[courseId] ?? BIOMES.web;

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const hashStr = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);

/** The canvas behind every painted image URL (so the game engine can use it as a texture). */
export const CANVAS_OF = new Map<string, HTMLCanvasElement>();

/** Sky colours (top, bottom) of a section. */
export function skyColors(courseId: string): [string, string] { return biomeFor(courseId).sky; }

export class Pixels {
  data: Uint8ClampedArray;
  constructor(public w: number, public h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  set(x: number, y: number, c: RGB, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a < 255) {
      const k = a / 255;
      this.data[i] = this.data[i] * (1 - k) + c[0] * k; this.data[i + 1] = this.data[i + 1] * (1 - k) + c[1] * k; this.data[i + 2] = this.data[i + 2] * (1 - k) + c[2] * k;
      this.data[i + 3] = 255;
      return;
    }
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = 255;
  }
  sprite(name: string, x: number, y: number, flip = false) {
    const px = spritePixels(name);
    for (let sy = 0; sy < 16; sy++) for (let sx = 0; sx < 16; sx++) {
      const i = (sy * 16 + sx) * 4;
      if (px[i + 3] === 0) continue;
      this.set(x + (flip ? 15 - sx : sx), y + sy, [px[i], px[i + 1], px[i + 2]]);
    }
  }
  toCanvas() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d')!.putImageData(new ImageData(this.data as Uint8ClampedArray<ArrayBuffer>, this.w, this.h), 0, 0);
    return c;
  }
  toUrl() {
    const c = this.toCanvas();
    const url = c.toDataURL();
    CANVAS_OF.set(url, c);
    return url;
  }
}

function paintGround(p: Pixels, b: Biome, r: () => number, x0 = 0, y0 = 0, x1 = p.w, y1 = p.h) {
  const [base, dark, light] = b.ground.map(hex);
  // patchy value noise on an 8px grid, plus speckles
  const gw = Math.ceil(p.w / 8) + 2, gh = Math.ceil(p.h / 8) + 2;
  const grid = Array.from({ length: gw * gh }, () => r());
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const gx = Math.floor(x / 8), gy = Math.floor(y / 8);
    const n = grid[gy * gw + gx];
    const v = r();
    let c = base;
    if (n < 0.25 && v < 0.5) c = dark;
    else if (v < 0.08) c = dark;
    else if (v > 0.95) c = light;
    else if (n > 0.8 && v > 0.7) c = light;
    p.set(x, y, c);
  }
  if (b.flowers) {
    for (let i = 0; i < ((x1 - x0) * (y1 - y0)) / 140; i++) {
      const fx = x0 + Math.floor(r() * (x1 - x0)), fy = y0 + Math.floor(r() * (y1 - y0 - 1));
      const col = hex(b.flowers[Math.floor(r() * b.flowers.length)]);
      p.set(fx, fy, col);
      if (r() > 0.5) { p.set(fx + 1, fy, col); p.set(fx, fy + 1, hex(b.ground[1])); }
    }
  }
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

export interface ChunkLayout { width: number; height: number; nodes: { x: number; y: number }[] }

export const NODE_STEP = 40;
export const CHUNK_TOP = 36;
export const CHUNK_BOTTOM = 30;
export const CHUNK_W = 208;
const OFFS = [0, 18, 28, 18, 0, -18, -28, -18];

export function layoutUnit(count: number, startIndex: number): ChunkLayout {
  const nodes = Array.from({ length: count }, (_, i) => ({ x: CHUNK_W / 2 + OFFS[(startIndex + i) % OFFS.length], y: CHUNK_TOP + i * NODE_STEP }));
  return { width: CHUNK_W, height: CHUNK_TOP + (count - 1) * NODE_STEP + CHUNK_BOTTOM, nodes };
}

export interface Prop { anim: string; x: number; y: number; flip?: boolean }

const chunkCache = new Map<string, { url: string; props: Prop[] }>();

/** Paints one unit of the world path. Returns an image URL and animated props to overlay. */
export function paintUnit(key: string, layout: ChunkLayout, b: Biome): { url: string; props: Prop[] } {
  const cached = chunkCache.get(key);
  if (cached) return cached;
  const { width: w, height: h, nodes } = layout;
  const p = new Pixels(w, h);
  const r = rng(hashStr(key));
  paintGround(p, b, r);

  const pts = [{ x: w / 2, y: -6 }, ...nodes, { x: w / 2, y: h + 6 }];
  const roadDist = (x: number, y: number) => {
    let d = Infinity;
    for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y));
    return d;
  };

  // a pond (or lava pool) on one side
  let pool: { cx: number; cy: number; rx: number; ry: number } | null = null;
  if (b.pool && r() < 0.6 && h > 120) {
    const side = r() < 0.5 ? -1 : 1;
    pool = { cx: w / 2 + side * (60 + r() * 20), cy: 40 + r() * (h - 80), rx: 22 + r() * 10, ry: 14 + r() * 8 };
    if (roadDist(pool.cx, pool.cy) < pool.rx + 14) pool = null;
  }
  if (pool && b.pool) {
    const P = b.pool;
    const [deep, mid, light, shore] = [P.deep, P.mid, P.light, P.shore].map(hex);
    for (let y = Math.floor(pool.cy - pool.ry - 3); y < pool.cy + pool.ry + 3; y++) for (let x = Math.floor(pool.cx - pool.rx - 3); x < pool.cx + pool.rx + 3; x++) {
      const e = ((x - pool.cx) / pool.rx) ** 2 + ((y - pool.cy) / pool.ry) ** 2;
      const wob = Math.sin(x * 0.7) * 0.06 + Math.cos(y * 0.9) * 0.06;
      if (e < 1 + wob) {
        const inner = e < 0.55 + wob;
        let c = inner ? deep : mid;
        if ((y + Math.floor(x / 6)) % 5 === 0 && (x + y) % 7 < 3) c = light;
        p.set(x, y, c);
      } else if (e < 1.35 + wob) p.set(x, y, shore);
    }
  }

  // the road and round clearings at each lesson stop
  const [rb, rd, rl, re] = b.road.map(hex);
  const R = 6.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let d = roadDist(x, y);
    for (const n of nodes) d = Math.min(d, Math.hypot(x - n.x, (y - n.y - 2) * 1.25) - 7);
    if (d < R) {
      const v = r();
      p.set(x, y, v < 0.12 ? rd : v > 0.93 ? rl : rb);
    } else if (d < R + 1.3) p.set(x, y, re);
  }
  // pebbles along the road edges
  for (let i = 0; i < h / 3; i++) {
    const x = Math.floor(r() * w), y = Math.floor(r() * h);
    const d = roadDist(x, y);
    if (d > R + 1.5 && d < R + 4) p.set(x, y, re);
  }

  // scenery, kept away from the road, the nodes and the pool
  const picks: { name: string; x: number; y: number; flip: boolean }[] = [];
  const total = b.decos.reduce((a, [, wgt]) => a + wgt, 0);
  for (let gy = -6; gy < h; gy += 13) for (let gx = 0; gx < w; gx += 15) {
    const x = gx + r() * 10, y = gy + r() * 9;
    if (roadDist(x + 8, y + 14) < R + 13) continue;
    if (nodes.some((n) => Math.hypot(x + 8 - n.x, y + 12 - n.y) < 26)) continue;
    if (pool && ((x + 8 - pool.cx) / (pool.rx + 8)) ** 2 + ((y + 14 - pool.cy) / (pool.ry + 8)) ** 2 < 1) continue;
    if (r() < 0.62) continue;
    let t = r() * total;
    let name = b.decos[0][0];
    for (const [n, wgt] of b.decos) { t -= wgt; if (t <= 0) { name = n; break; } }
    picks.push({ name, x: Math.round(x), y: Math.round(y), flip: r() < 0.5 });
  }
  picks.sort((a, b2) => a.y - b2.y);
  const shadow = hex(b.ground[1]);
  for (const d of picks) {
    for (let sx = 3; sx < 13; sx++) p.set(d.x + sx, d.y + 15, shadow);
    p.sprite(d.name, d.x, d.y, d.flip);
  }

  // animated props near the road (rendered as DOM overlays so they can move)
  const props: Prop[] = [];
  let tries = 0;
  while (props.length < Math.min(2, b.animated.length) && tries++ < 80) {
    const x = 12 + r() * (w - 40), y = 10 + r() * (h - 30);
    const d = roadDist(x + 8, y + 14);
    if (d < R + 5 || d > R + 22) continue;
    if (nodes.some((n) => Math.hypot(x + 8 - n.x, y + 10 - n.y) < 24)) continue;
    if (picks.some((q) => Math.abs(q.x - x) < 12 && Math.abs(q.y - y) < 12)) continue;
    props.push({ anim: b.animated[props.length], x: Math.round(x), y: Math.round(y), flip: r() < 0.5 });
  }

  const out = { url: p.toUrl(), props };
  chunkCache.set(key, out);
  return out;
}

const bandCache = new Map<string, string>();

/** A wide landscape strip (hills, trees, ground) used behind lessons. 320x72 art px, tiles horizontally. */
export function paintBand(courseId: string): string {
  const hit = bandCache.get(courseId);
  if (hit) return hit;
  const b = biomeFor(courseId);
  const w = 320, h = 72;
  const p = new Pixels(w, h);
  const r = rng(hashStr('band' + courseId));
  const [h1, h2] = b.hills.map(hex);
  // far hills (transparent above)
  for (let x = 0; x < w; x++) {
    const t = (x / w) * Math.PI * 2;
    const far = Math.round(26 + Math.sin(t * 2) * 7 + Math.sin(t * 5 + 1) * 3);
    const near = Math.round(40 + Math.sin(t * 3 + 2) * 5 + Math.sin(t * 7) * 2);
    for (let y = far; y < h; y++) p.set(x, y, h2);
    for (let y = near; y < h; y++) p.set(x, y, h1);
  }
  paintGround(p, b, r, 0, 54);
  for (let x = 0; x < w; x++) p.set(x, 54, hex(b.ground[1]));
  // a few sprites on the near hills
  for (let i = 0; i < 9; i++) {
    const [name] = b.decos[Math.floor(r() * Math.min(3, b.decos.length))];
    p.sprite(name, Math.floor((i / 9) * w + r() * 20), 38 + Math.floor(r() * 4), r() < 0.5);
  }
  const url = p.toUrl();
  bandCache.set(courseId, url);
  return url;
}

let titleUrl: string | null = null;

/** The title screen: night sky, moon, mountains and a big castle (320x180 art px). */
export function paintTitleScene(): string {
  if (titleUrl) return titleUrl;
  const w = 320, h = 180;
  const p = new Pixels(w, h);
  const r = rng(42);
  const sky = ['#1b1838', '#241f4a', '#2f2658', '#3d2d66', '#553572', '#743d74', '#964a6e', '#b8616a'];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.set(x, y, hex(sky[Math.min(sky.length - 1, Math.floor((y / 120) * sky.length))]));
  for (let i = 0; i < 90; i++) { const x = Math.floor(r() * w), y = Math.floor(r() * 90); p.set(x, y, hex(r() < 0.3 ? '#fff4dc' : '#b8b0e0')); }
  // moon
  for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) if (x * x + y * y <= 140) p.set(250 + x, 38 + y, hex(x * x + y * y > 110 ? '#e8d9a4' : (x + 4) ** 2 + (y + 2) ** 2 < 12 ? '#e8d9a4' : '#fbefc4'));
  // mountains
  for (let x = 0; x < w; x++) {
    const m = Math.round(104 - Math.abs(Math.sin(x * 0.018)) * 36 - Math.sin(x * 0.05) * 6);
    for (let y = m; y < h; y++) p.set(x, y, hex(y < m + 3 && x % 9 < 5 ? '#5a4a7a' : '#3d3060'));
  }
  for (let x = 0; x < w; x++) {
    const m = Math.round(128 + Math.sin(x * 0.03 + 1) * 8);
    for (let y = m; y < h; y++) p.set(x, y, hex('#2a2046'));
  }
  // castle silhouette with lit windows
  const dark = hex('#160f24'), mid = hex('#1f1632'), win = hex('#ffcf6b');
  const rect = (x: number, y: number, ww: number, hh: number, c: RGB) => { for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + ww; xx++) p.set(xx, yy, c); };
  rect(118, 96, 84, 60, mid);
  rect(106, 76, 22, 80, dark); rect(192, 76, 22, 80, dark); rect(148, 60, 24, 40, dark);
  for (const x0 of [106, 192]) for (let i = 0; i < 4; i++) rect(x0 + i * 6, 72, 4, 5, dark);
  for (let i = 0; i < 7; i++) rect(118 + i * 12, 92, 7, 5, mid);
  for (const [cx, top] of [[117, 60], [203, 60], [160, 40]]) for (let y = 0; y < 18; y++) rect(cx - Math.floor(y / 1.6) - 1, top + y, Math.floor(y / 1.6) * 2 + 2, 1, dark);
  rect(152, 126, 16, 30, hex('#3a2416'));
  for (let y = 120; y < 126; y++) rect(152 + (126 - y > 3 ? 2 : 0), y, 16 - (126 - y > 3 ? 4 : 0), 1, hex('#3a2416'));
  for (const [x, y] of [[112, 90], [198, 90], [112, 110], [198, 112], [157, 72], [130, 110], [186, 108], [144, 104], [174, 104]]) rect(x, y, 3, 5, win);
  // foreground ground
  for (let x = 0; x < w; x++) {
    const g = Math.round(156 + Math.sin(x * 0.04) * 3);
    for (let y = g; y < h; y++) p.set(x, y, hex(y === g ? '#3f5a2e' : (x * 7 + y * 3) % 11 === 0 ? '#243a1c' : '#2c4622'));
  }
  titleUrl = p.toUrl();
  return titleUrl;
}

/** A framed panel image in any colour, for unit banners. */
export function shade(hexColor: string, amt: number) {
  const [r0, g0, b0] = hex(hexColor);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + amt))));
  return '#' + [c(r0), c(g0), c(b0)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- path stop (node) buttons ----------


const nodeCache = new Map<string, string>();

/** A chunky 3D pixel stone with an icon: 28x26 art px (32x30 for projects). */
export function paintNode(color: string, icon: string, big = false, iconColor = '#ffffff', shape: 'disc' | 'shield' = 'disc'): string {
  const key = color + icon + big + iconColor + shape;
  const hit = nodeCache.get(key);
  if (hit) return hit;
  const shield = shape === 'shield';
  const w = big || shield ? 32 : 28, h = shield ? 34 : big ? 30 : 26;
  const p = new Pixels(w, h);
  const cx = w / 2 - 0.5, rx = big || shield ? 14.5 : 12.5, ry = shield ? 13 : big ? 11 : 9.5, top = ry + 1, thick = 4;
  const fill = hex(color), light = hex(shade(color, 0.3)), dark = hex(shade(color, -0.35)), out = hex('#2b1a12');
  const inside = shield
    ? (x: number, y: number, cy: number) => {
      const yy = y - (cy - ry);                       // 0 .. 2*ry
      const dx = Math.abs(x - cx);
      if (yy < 0 || yy > ry * 2) return false;
      if (yy < 1.5) return dx <= rx - 2;
      if (yy <= ry * 1.2) return dx <= rx;
      return dx <= rx * (ry * 2 - yy) / (ry * 0.8);
    }
    : (x: number, y: number, cy: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inTop = inside(x, y, top);
    let inSide = false;
    for (let t = 0; t <= thick; t++) if (inside(x, y, top + t)) inSide = true;
    if (!inTop && !inSide) continue;
    // outline: a pixel is border if any 4-neighbour is outside the whole shape
    const shape = (xx: number, yy: number) => { for (let t = 0; t <= thick; t++) if (inside(xx, yy, top + t)) return true; return false; };
    if (!shape(x - 1, y) || !shape(x + 1, y) || !shape(x, y - 1) || !shape(x, y + 1)) { p.set(x, y, out); continue; }
    if (inTop) {
      const hl = shield ? !inside(x, y - 2, top) : ((x - cx) / rx) ** 2 + ((y - top + 2.5) / ry) ** 2 > 1 && y < top;
      p.set(x, y, hl ? light : fill);
    } else p.set(x, y, dark);
  }
  // rim line between top face and side
  for (let x = 0; x < w; x++) for (let y = 1; y < h; y++) if (inside(x, y - 1, top) && !inside(x, y, top) && p.data[(y * w + x) * 4 + 3]) {
    const i = (y * w + x) * 4;
    if (p.data[i] !== out[0] || p.data[i + 1] !== out[1]) p.set(x, y, hex(shade(color, -0.15)));
  }
  // icon (12x12) centred on the top face
  const rows = ICONS[icon] ?? ICONS.star;
  const ic = hex(iconColor), ish = hex(shade(color, -0.45));
  const ox = Math.round(cx - 5.5), oy = Math.round(top - (shield ? 8 : 6));
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') { p.set(ox + x + 1, oy + y + 1, ish); } }));
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') p.set(ox + x, oy + y, ic); }));
  const url = p.toUrl();
  nodeCache.set(key, url);
  return url;
}

/** A stepped (banded) pixel sky for a section, softened towards parchment so text stays readable. */
export function skyCss(courseId: string) {
  const b = biomeFor(courseId);
  const [a, c] = b.sky.map(hex);
  const parch = hex('#f3e4bf');
  const mix = (x: RGB, y: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(x[i] * (1 - t) + y[i] * t)) as RGB;
  const bands = 7;
  const stops: string[] = [];
  for (let i = 0; i < bands; i++) {
    const base = mix(a, c, i / (bands - 1));
    const col = mix(base, parch, 0.55 + (i / bands) * 0.25);
    stops.push(`rgb(${col.join(',')}) ${(i / bands) * 100}% ${((i + 1) / bands) * 100}%`);
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}
