// Pixel-art UI kit: 9-slice frames (panels, buttons, bubbles) and tiled background
// patterns, generated as crisp SVG images and exposed as CSS variables.

type RGB = string;

export interface FrameColors { outline: RGB; light: RGB; fill: RGB; dark: RGB }

export const PAL = {
  outline: '#2b1a12',
  parchment: { outline: '#2b1a12', light: '#fff6dc', fill: '#f3e2b8', dark: '#c9a56a' },
  paper: { outline: '#2b1a12', light: '#ffffff', fill: '#fdf6e3', dark: '#d9c79c' },
  wood: { outline: '#1c110a', light: '#9a6a40', fill: '#6b4328', dark: '#432a18' },
  stone: { outline: '#2b1a12', light: '#e6ddc9', fill: '#bfb39c', dark: '#8a7f6a' },
  slate: { outline: '#120c08', light: '#4a3a2c', fill: '#2a1f18', dark: '#17100b' },
  green: { outline: '#1e3a12', light: '#9ee06a', fill: '#5aa83c', dark: '#3a7426' },
  blue: { outline: '#142d4d', light: '#8fcbf7', fill: '#3f8fd6', dark: '#285c94' },
  red: { outline: '#4a1410', light: '#f59184', fill: '#d2473c', dark: '#8e2a23' },
  gold: { outline: '#4a2e06', light: '#ffe07e', fill: '#e7a72c', dark: '#a86e16' },
  purple: { outline: '#2e1650', light: '#c6a2f5', fill: '#8a56c9', dark: '#5c3590' },
  sel: { outline: '#1f4c78', light: '#f1f8ff', fill: '#d6ebfb', dark: '#8cc2ea' },
  right: { outline: '#1e4a12', light: '#f0fbe8', fill: '#d8f1c8', dark: '#86c96e' },
  wrong: { outline: '#5a1812', light: '#fff2f0', fill: '#fbd7d2', dark: '#e0958c' },
};

/** Draws a pixel grid into an SVG string (one <rect> per horizontal run). */
function svgFromGrid(grid: (RGB | null)[][]): string {
  const h = grid.length, w = grid[0].length;
  let rects = '';
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const c = grid[y][x];
      if (!c) { x++; continue; }
      let x2 = x + 1;
      while (x2 < w && grid[y][x2] === c) x2++;
      rects += `<rect x="${x}" y="${y}" width="${x2 - x}" height="1" fill="${c}"/>`;
      x = x2;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** A 12x12 panel: 1px outline with stepped corners, 1px highlight top/left, 1px shade bottom/right. */
export function panelFrame(c: FrameColors, thickBottom = 0): string {
  const w = 12, h = 12 + thickBottom;
  const g: (RGB | null)[][] = Array.from({ length: h }, () => Array(w).fill(c.fill));
  const isCorner = (x: number, y: number) => (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
  const isStep = (x: number, y: number) => (x === 1 || x === w - 2) && (y === 1 || y === h - 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (isCorner(x, y)) g[y][x] = null;
    else if (x === 0 || x === w - 1 || y === 0 || y === h - 1 || isStep(x, y)) g[y][x] = c.outline;
    else if (thickBottom && y >= h - 1 - thickBottom) g[y][x] = c.dark;
    else if (y === 1 || x === 1) g[y][x] = c.light;
    else if (y === h - 2 || x === w - 2) g[y][x] = c.dark;
  }
  return url(svgFromGrid(g));
}

/** Speech bubble with a tail on the left (the tail is drawn by CSS). */
export function bubbleFrame(c: FrameColors) {
  return panelFrame(c);
}

/** Tiled background patterns (returned as CSS url). */
function pattern(w: number, h: number, paint: (x: number, y: number) => RGB | null) {
  const g: (RGB | null)[][] = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => paint(x, y)));
  return url(svgFromGrid(g));
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function installPixelUI() {
  const root = document.documentElement.style;
  const set = (k: string, v: string) => root.setProperty(k, v);
  set('--f-panel', panelFrame(PAL.parchment));
  set('--f-paper', panelFrame(PAL.paper));
  set('--f-wood', panelFrame(PAL.wood));
  set('--f-stone', panelFrame(PAL.stone));
  set('--f-slate', panelFrame(PAL.slate));
  set('--f-sel', panelFrame(PAL.sel));
  set('--f-right', panelFrame(PAL.right));
  set('--f-wrong', panelFrame(PAL.wrong));
  set('--f-bubble', panelFrame(PAL.paper));
  for (const k of ['green', 'blue', 'red', 'gold', 'purple', 'stone', 'wood', 'paper'] as const) {
    set(`--b-${k}`, panelFrame(PAL[k], 2));
  }
  set('--b-opt', panelFrame(PAL.paper, 1));
  set('--b-opt-sel', panelFrame(PAL.sel, 1));
  set('--b-opt-right', panelFrame(PAL.right, 1));
  set('--b-opt-wrong', panelFrame(PAL.wrong, 1));
  set('--b-tile', panelFrame({ outline: '#3b2415', light: '#fff8e6', fill: '#f5e6c4', dark: '#b89460' }, 1));

  // Parchment floor: warm paper with tiny fibres
  const r1 = rng(7);
  set('--bg-parchment', pattern(32, 32, () => { const v = r1(); return v < 0.06 ? '#ead7ab' : v > 0.97 ? '#fbf0d4' : '#f3e4bf'; }));
  // Wooden planks for the sidebar
  const r2 = rng(11);
  set('--bg-wood', pattern(32, 32, (x, y) => {
    if (y % 8 === 7) return '#2e1c10';
    if ((x + (Math.floor(y / 8) % 2) * 16) % 32 === 0) return '#3a2414';
    const v = r2();
    return v < 0.15 ? '#5c3a22' : v > 0.92 ? '#7a4e2e' : '#684228';
  }));
  // Dark stone for code / terminal areas
  const r3 = rng(5);
  set('--bg-stone', pattern(16, 16, () => { const v = r3(); return v < 0.1 ? '#241a14' : '#2a1f18'; }));
}

function shadeHex(h: string, amt: number) {
  const c = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * (1 + amt))));
  return '#' + [c(1), c(3), c(5)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const colorCache = new Map<string, string>();

/** A pixel frame in any colour (e.g. a section's colour). */
export function colorFrame(color: string, thickBottom = 0): string {
  const key = color + thickBottom;
  let v = colorCache.get(key);
  if (!v) {
    v = panelFrame({ outline: '#2b1a12', light: shadeHex(color, 0.35), fill: color, dark: shadeHex(color, -0.3) }, thickBottom);
    colorCache.set(key, v);
  }
  return v;
}
