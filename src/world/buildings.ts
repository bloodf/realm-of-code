// Pixel-art buildings for the village, painted in code (like all our art).
// Each painter draws with a few primitives; an outline is added automatically.
import { hex } from '../pixel/scenes';

type Rgb = [number, number, number];

class Canvas {
  data: Uint8ClampedArray;
  constructor(public w: number, public h: number) { this.data = new Uint8ClampedArray(w * h * 4); }
  px(x: number, y: number, c: string | Rgb) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b] = typeof c === 'string' ? hex(c) : c;
    const i = (y * this.w + x) * 4;
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
  }
  on(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.data[(y * this.w + x) * 4 + 3] > 0; }
  rect(x: number, y: number, w: number, h: number, c: string) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c); }
  hline(x: number, y: number, w: number, c: string) { this.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: string) { this.rect(x, y, 1, h, c); }
  /** Gable roof: a triangle from (x, y+h) to (x+w, y+h) with its top at the middle. */
  gable(x: number, y: number, w: number, h: number, c: string, dark: string, rows?: string) {
    for (let yy = 0; yy < h; yy++) {
      const half = Math.round(((yy + 1) / h) * (w / 2));
      const cx = x + w / 2;
      for (let xx = Math.round(cx - half); xx < Math.round(cx + half); xx++) {
        const shade = xx > cx + half * 0.35 ? dark : c;
        this.px(xx, y + yy, rows && yy % 3 === 2 ? rows : shade);
      }
    }
  }
  /** Cone roof for towers. */
  cone(x: number, y: number, w: number, h: number, c: string, dark: string) {
    for (let yy = 0; yy < h; yy++) {
      const half = ((yy + 1) / h) * (w / 2);
      const cx = x + w / 2;
      for (let xx = Math.round(cx - half); xx < Math.round(cx + half); xx++) this.px(xx, y + yy, xx > cx ? dark : c);
    }
  }
  bricks(x: number, y: number, w: number, h: number, base: string, line: string, light?: string) {
    this.rect(x, y, w, h, base);
    for (let yy = y; yy < y + h; yy++) {
      if ((yy - y) % 4 === 3) { this.hline(x, yy, w, line); continue; }
      const off = Math.floor((yy - y) / 4) % 2 ? 3 : 0;
      for (let xx = x; xx < x + w; xx++) if ((xx - x + off) % 7 === 0) this.px(xx, yy, line);
      if (light && (yy - y) % 4 === 0) for (let xx = x; xx < x + w; xx += 5) this.px(xx + 1, yy, light);
    }
  }
  planks(x: number, y: number, w: number, h: number, base: string, line: string, vertical = true) {
    this.rect(x, y, w, h, base);
    if (vertical) for (let xx = x + 3; xx < x + w; xx += 4) this.vline(xx, y, h, line);
    else for (let yy = y + 3; yy < y + h; yy += 4) this.hline(x, yy, w, line);
  }
  window(x: number, y: number, w = 5, h = 6, lit = '#ffcf6b') {
    this.rect(x - 1, y - 1, w + 2, h + 2, '#3a2416');
    this.rect(x, y, w, h, lit);
    this.vline(x + Math.floor(w / 2), y, h, '#3a2416');
    this.hline(x, y + Math.floor(h / 2), w, '#3a2416');
    this.px(x, y, '#fff4dc');
  }
  door(x: number, y: number, w: number, h: number, arch = true, wood = '#6b4226') {
    this.rect(x, y, w, h, wood);
    for (let xx = x + 2; xx < x + w; xx += 3) this.vline(xx, y, h, '#4a2c18');
    if (arch) { this.px(x, y, '#3a2416'); this.px(x + w - 1, y, '#3a2416'); }
    this.hline(x, y + 3, w, '#2b1a12'); this.hline(x, y + h - 4, w, '#2b1a12');
    this.px(x + w - 3, y + Math.floor(h / 2), '#f2c14e');
  }
  shadeRight(x: number, y: number, w: number, h: number, amt = 0.18) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (!this.on(xx, yy)) continue;
      const i = (yy * this.w + xx) * 4;
      this.data[i] *= 1 - amt; this.data[i + 1] *= 1 - amt; this.data[i + 2] *= 1 - amt;
    }
  }
  flag(x: number, y: number, c: string) {
    this.vline(x, y, 8, '#3a2416');
    this.rect(x + 1, y, 4, 3, c); this.rect(x + 1, y + 3, 3, 1, c);
  }
  /** Adds a dark outline around everything drawn. */
  outline(c = '#2b1a12') {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.on(x, y)) continue;
      if (this.on(x - 1, y) || this.on(x + 1, y) || this.on(x, y - 1) || this.on(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.px(x, y, c);
  }
}

export interface BuildingArt { w: number; h: number; data: Uint8ClampedArray; door: [number, number] }

function castle(): BuildingArt {
  const c = new Canvas(92, 84);
  // keep
  c.bricks(22, 30, 48, 52, '#aeaab6', '#8d8a94', '#c9c6d2');
  for (let x = 22; x < 70; x += 6) c.rect(x, 25, 4, 5, '#aeaab6');
  // towers
  for (const x of [5, 69]) {
    c.bricks(x, 20, 18, 62, '#b8b4c0', '#8d8a94', '#d4d0dc');
    c.cone(x - 2, 1, 22, 20, '#4a78d8', '#2a4a9a');
    c.flag(x + 9, 0, '#d2473c');
    c.window(x + 6, 34); c.window(x + 6, 54);
  }
  c.cone(34, 6, 24, 20, '#4a78d8', '#2a4a9a');
  c.flag(46, 2, '#e7a72c');
  // gate
  c.rect(38, 54, 16, 28, '#3a2416');
  c.door(39, 56, 14, 26, true, '#7a4a2a');
  for (let x = 39; x < 53; x++) c.px(x, 55, '#8d8a94');
  // banners
  for (const x of [27, 60]) { c.rect(x, 36, 5, 14, '#8a56c9'); c.rect(x + 1, 50, 3, 2, '#8a56c9'); c.px(x + 2, 42, '#f2c14e'); c.px(x + 2, 43, '#f2c14e'); }
  c.window(43, 36, 6, 7);
  c.shadeRight(69, 20, 18, 62, 0.12);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [46, 84] };
}

function barn(): BuildingArt {
  const c = new Canvas(76, 64);
  c.planks(8, 26, 60, 36, '#c0462a', '#a8321c');
  c.gable(2, 2, 72, 26, '#7d2a1a', '#5e1f14', '#6b2417');
  for (let x = 2; x < 74; x++) c.px(x, 27, '#f0e0c0');
  // big door with a white X
  c.rect(26, 38, 24, 24, '#8a2e1c');
  for (let i = 0; i < 24; i++) { c.px(26 + i, 38 + i, '#f0e0c0'); c.px(49 - i, 38 + i, '#f0e0c0'); }
  c.hline(26, 38, 24, '#f0e0c0'); c.vline(26, 38, 24, '#f0e0c0'); c.vline(49, 38, 24, '#f0e0c0');
  // hay loft
  c.rect(32, 12, 12, 10, '#3a2416'); c.rect(33, 16, 10, 6, '#dcae55'); c.hline(33, 16, 10, '#f2d070');
  c.window(12, 34); c.window(58, 34);
  c.shadeRight(52, 26, 16, 36, 0.12);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [38, 64] };
}

function tavern(): BuildingArt {
  const c = new Canvas(76, 70);
  c.rect(8, 30, 60, 38, '#f0e0b8');
  for (let x = 8; x < 68; x += 12) c.vline(x, 30, 38, '#6b4226');
  c.hline(8, 30, 60, '#6b4226'); c.hline(8, 48, 60, '#6b4226');
  for (let i = 0; i < 10; i++) { c.px(8 + i, 48 - i * 1.8, '#6b4226'); c.px(20 + i, 30 + i * 1.8, '#6b4226'); }
  c.rect(54, 0, 7, 16, '#8d8a94'); c.rect(53, 0, 9, 2, '#6c6875');
  c.gable(2, 6, 72, 26, '#9a6339', '#6b4226', '#7a4a2a');
  c.door(32, 50, 12, 18, true);
  c.window(14, 52); c.window(56, 52); c.window(18, 36); c.window(52, 36);
  // hanging sign with a mug
  c.hline(2, 34, 8, '#3a2416'); c.vline(3, 34, 4, '#3a2416'); c.vline(8, 34, 4, '#3a2416');
  c.rect(1, 38, 10, 9, '#7a4a2a'); c.rect(3, 40, 5, 5, '#f2c14e'); c.rect(3, 40, 5, 1, '#fff4dc'); c.px(8, 42, '#f2c14e');
  c.shadeRight(56, 30, 12, 38, 0.1);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [38, 70] };
}

function guild(): BuildingArt {
  const c = new Canvas(80, 68);
  c.bricks(6, 28, 68, 38, '#9a958a', '#6e6a62', '#b8b2a6');
  c.gable(0, 2, 80, 28, '#7a4ab0', '#5a3288', '#6a3fa0');
  for (const x of [10, 22, 54, 66]) { c.rect(x, 30, 4, 36, '#d8d2c4'); c.vline(x + 3, 30, 36, '#b8b2a6'); }
  c.rect(30, 40, 20, 26, '#3a2416'); c.door(31, 42, 9, 24, false, '#7a4a2a'); c.door(40, 42, 9, 24, false, '#7a4a2a');
  for (const x of [16, 60]) { c.rect(x, 34, 4, 16, '#e7a72c'); c.px(x + 1, 50, '#e7a72c'); c.px(x + 2, 50, '#e7a72c'); c.px(x + 1, 40, '#fff4dc'); }
  c.rect(34, 14, 12, 10, '#f2c14e'); c.rect(36, 16, 8, 6, '#a86e16'); c.px(39, 18, '#fff4dc'); c.px(40, 18, '#fff4dc');
  c.shadeRight(58, 28, 16, 38, 0.12);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [40, 68] };
}

function trophyHall(): BuildingArt {
  const c = new Canvas(68, 66);
  c.rect(6, 30, 56, 34, '#e8e4f0');
  for (let x = 8; x < 62; x += 9) { c.rect(x, 30, 4, 34, '#f8f6fc'); c.vline(x + 3, 30, 34, '#c9c4d6'); }
  c.rect(4, 26, 60, 5, '#d4cfe0'); c.rect(4, 62, 60, 4, '#c9c4d6');
  // golden dome
  for (let y = 0; y < 22; y++) {
    const half = Math.sqrt(Math.max(0, 22 * 22 - (22 - y) ** 2)) * 1.1;
    for (let x = Math.round(34 - half); x < Math.round(34 + half); x++) c.px(x, 4 + y, x > 34 + half * 0.3 ? '#a86e16' : y < 6 && x < 30 ? '#ffe07e' : '#e7a72c');
  }
  c.vline(34, 0, 5, '#a86e16'); c.rect(33, 0, 3, 2, '#f2c14e');
  c.rect(26, 42, 16, 22, '#3a2416'); c.door(27, 44, 14, 20, true, '#8a5a34');
  // trophy emblem
  c.rect(30, 31, 8, 5, '#f2c14e'); c.rect(32, 36, 4, 3, '#e7a72c'); c.rect(31, 39, 6, 2, '#a86e16');
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [34, 66] };
}

function libraryTower(): BuildingArt {
  const c = new Canvas(44, 88);
  c.bricks(8, 26, 28, 60, '#8fa3c0', '#6a7d99', '#b0c2dc');
  c.cone(4, 0, 36, 28, '#2f9aa6', '#1f6f7a');
  c.flag(22, 0, '#e7a72c');
  for (const y of [34, 50]) c.window(19, y, 6, 8, '#ffd479');
  c.rect(15, 66, 14, 20, '#3a2416'); c.door(16, 68, 12, 18, true);
  // a book sign
  c.rect(28, 62, 8, 6, '#d2473c'); c.vline(32, 62, 6, '#fff4dc');
  c.shadeRight(28, 26, 8, 60, 0.15);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [22, 88] };
}

function cottage(): BuildingArt {
  const c = new Canvas(54, 50);
  c.planks(6, 22, 42, 26, '#c48a52', '#9a6339', false);
  c.rect(36, 2, 6, 14, '#8d8a94');
  c.gable(0, 4, 54, 20, '#4f9a3a', '#2f6e2c', '#3d7f2e');
  c.door(22, 30, 10, 18, true);
  c.window(10, 30); c.window(39, 30);
  c.rect(9, 37, 8, 2, '#8a5a34'); c.px(10, 36, '#e06a6a'); c.px(12, 36, '#f7f0a8'); c.px(14, 36, '#e06a6a');
  c.shadeRight(38, 22, 10, 26, 0.1);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [27, 50] };
}

function board(): BuildingArt {
  const c = new Canvas(34, 30);
  c.rect(4, 8, 2, 22, '#6b4226'); c.rect(28, 8, 2, 22, '#6b4226');
  c.planks(2, 4, 30, 16, '#9a6339', '#7a4a2a', false);
  c.rect(1, 2, 32, 3, '#6b4226');
  c.rect(5, 7, 7, 8, '#fff4dc'); c.rect(14, 6, 6, 7, '#f7f0a8'); c.rect(22, 8, 7, 9, '#fff4dc');
  for (const [x, y] of [[8, 7], [17, 6], [25, 8]]) c.px(x, y, '#d2473c');
  c.hline(6, 10, 5, '#b8a78a'); c.hline(6, 12, 4, '#b8a78a'); c.hline(23, 11, 5, '#b8a78a'); c.hline(23, 13, 5, '#b8a78a');
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [17, 30] };
}

function petHouse(): BuildingArt {
  // a round thatched hut with a paw sign and a little fence
  const c = new Canvas(70, 60);
  for (let y = 0; y < 30; y++) {
    const half = 10 + y * 0.9;
    for (let x = Math.round(35 - half); x < Math.round(35 + half); x++) c.px(x, 4 + y, y % 4 === 3 ? '#c89a3a' : x > 35 + half * 0.4 ? '#b8862a' : '#e8c060');
  }
  c.rect(12, 32, 46, 26, '#f0dcc0');
  for (let x = 12; x < 58; x += 8) c.vline(x, 32, 26, '#c8a478');
  c.rect(12, 32, 46, 2, '#8a5a34');
  c.door(29, 40, 12, 18, true, '#8a5a34');
  c.window(17, 40, 6, 6, '#ffd479'); c.window(47, 40, 6, 6, '#ffd479');
  // paw sign
  c.rect(26, 20, 18, 11, '#7a4a2a'); c.rect(31, 25, 8, 5, '#f2a6b8');
  for (const [x, y] of [[30, 22], [33, 21], [36, 21], [39, 22]]) c.rect(x, y, 2, 2, '#f2a6b8');
  for (let x = 0; x < 70; x += 5) { c.vline(x, 50, 8, '#9a6339'); }
  c.hline(0, 52, 70, '#7a4a2a'); c.hline(0, 55, 70, '#7a4a2a');
  c.rect(29, 50, 12, 8, '#f0dcc0'); c.door(29, 40, 12, 18, true, '#8a5a34');
  c.shadeRight(45, 32, 13, 26, 0.1);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [35, 60] };
}

function homestead(): BuildingArt {
  // a farmhouse with a windmill and a silo
  const c = new Canvas(92, 76);
  // windmill tower
  c.planks(6, 24, 18, 50, '#d8c8a8', '#b8a888');
  c.cone(3, 8, 24, 18, '#8a4a2a', '#6b3418');
  // sails
  for (let i = -16; i <= 16; i++) { c.px(15 + i, 16 + i, '#f0e8d8'); c.px(15 + i, 16 - i, '#f0e8d8'); c.px(15 + i, 17 + i, '#a89878'); c.px(15 + i, 17 - i, '#a89878'); }
  c.rect(13, 14, 5, 5, '#6b4226');
  // house
  c.planks(30, 34, 46, 40, '#c8743a', '#a85a2a', false);
  c.gable(24, 10, 58, 26, '#3d7f9a', '#2a5f78', '#336f88');
  c.door(46, 52, 12, 22, true, '#6b4226');
  c.window(35, 44); c.window(66, 44);
  c.rect(63, 6, 6, 12, '#8d8a94');
  // silo
  c.rect(78, 30, 13, 44, '#b8b4c0'); c.cone(77, 20, 15, 11, '#d2473c', '#9a2e24');
  for (let y = 34; y < 74; y += 6) c.hline(78, y, 13, '#8d8a94');
  // pumpkins by the door
  c.rect(40, 68, 4, 4, '#e8833a'); c.rect(60, 68, 4, 4, '#e8833a'); c.px(41, 67, '#3d8f3a'); c.px(61, 67, '#3d8f3a');
  c.shadeRight(66, 34, 10, 40, 0.1);
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [52, 76] };
}

function monsterGate(): BuildingArt {
  // a huge stone arch with a swirling purple portal and torches
  const c = new Canvas(80, 74);
  c.bricks(4, 14, 18, 60, '#6c6875', '#4a4654', '#8d8a94');
  c.bricks(58, 14, 18, 60, '#6c6875', '#4a4654', '#8d8a94');
  c.bricks(4, 4, 72, 14, '#7a7684', '#4a4654', '#9a96a4');
  for (let x = 4; x < 76; x += 8) c.rect(x, 0, 5, 5, '#7a7684');
  // portal
  for (let y = 18; y < 74; y++) for (let x = 22; x < 58; x++) {
    const dx = x - 40, dy = y - 48, r = Math.sqrt(dx * dx + dy * dy * 0.6), a = Math.atan2(dy, dx);
    const swirl = Math.sin(r * 0.45 - a * 3);
    c.px(x, y, swirl > 0.5 ? '#b58be0' : swirl > -0.2 ? '#6a3fa0' : '#2e1a48');
  }
  // skull keystone
  c.rect(35, 6, 10, 9, '#ece6d8'); c.rect(37, 9, 2, 2, '#2b1a12'); c.rect(41, 9, 2, 2, '#2b1a12'); c.rect(38, 13, 4, 2, '#c8c0b0');
  // torches
  for (const x of [10, 66]) { c.rect(x, 30, 4, 8, '#6b4226'); c.rect(x, 25, 4, 5, '#ffb347'); c.rect(x + 1, 22, 2, 3, '#ffd23f'); }
  c.outline();
  return { w: c.w, h: c.h, data: c.data, door: [40, 74] };
}

export const BUILDING_ART: Record<string, () => BuildingArt> = { castle, barn, tavern, guild, trophyHall, libraryTower, cottage, board, petHouse, homestead, monsterGate };
