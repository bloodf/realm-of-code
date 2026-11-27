// Pixel-art frames drawn with Phaser Graphics (works in WebGL and Canvas).
// The pattern matches our 12x12 CSS frames: 1px outline with stepped corners,
// a highlight on the top/left, a shade on the bottom/right, and an optional thick base.
import type Phaser from 'phaser';
import type { FrameColors } from '../pixel/ui';
import { N } from './theme';

export function drawFrame(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c: FrameColors, opts: { u?: number; base?: number; alpha?: number } = {}) {
  const u = opts.u ?? 3;
  const base = (opts.base ?? 0) * u;
  const a = opts.alpha ?? 1;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const rect = (xx: number, yy: number, ww: number, hh: number, col: string) => { if (ww > 0 && hh > 0) { g.fillStyle(N(col), a); g.fillRect(xx, yy, ww, hh); } };
  // body
  rect(x + u, y + u, w - 2 * u, h - 2 * u, c.fill);
  // outline (without the corner pixels)
  rect(x + u, y, w - 2 * u, u, c.outline);
  rect(x + u, y + h - u, w - 2 * u, u, c.outline);
  rect(x, y + u, u, h - 2 * u, c.outline);
  rect(x + w - u, y + u, u, h - 2 * u, c.outline);
  // stepped corners
  rect(x + u, y + u, u, u, c.outline); rect(x + w - 2 * u, y + u, u, u, c.outline);
  rect(x + u, y + h - 2 * u, u, u, c.outline); rect(x + w - 2 * u, y + h - 2 * u, u, u, c.outline);
  // highlight and shade
  rect(x + 2 * u, y + u, w - 4 * u, u, c.light);
  rect(x + u, y + 2 * u, u, h - 4 * u - base, c.light);
  rect(x + w - 2 * u, y + 2 * u, u, h - 4 * u, c.dark);
  rect(x + 2 * u, y + h - 2 * u - base, w - 4 * u, u + base, c.dark);
}

/** A speech-bubble tail pointing left, attached at (x, y) on the bubble's left edge. */
export function drawTail(g: Phaser.GameObjects.Graphics, x: number, y: number, fill: string, outline: string, u = 3) {
  const o = N(outline), f = N(fill);
  g.fillStyle(o); g.fillRect(x - 4 * u, y, 4 * u + u, u);
  g.fillStyle(o); g.fillRect(x - 4 * u, y + u, u, u); g.fillStyle(f); g.fillRect(x - 3 * u, y + u, 4 * u, u);
  g.fillStyle(o); g.fillRect(x - 3 * u, y + 2 * u, u, u); g.fillStyle(f); g.fillRect(x - 2 * u, y + 2 * u, 3 * u, u);
  g.fillStyle(o); g.fillRect(x - 2 * u, y + 3 * u, u, u); g.fillStyle(f); g.fillRect(x - u, y + 3 * u, 2 * u, u);
  g.fillStyle(o); g.fillRect(x - u, y + 4 * u, u, u);
}

/** Segmented pixel progress bar. */
export function drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, pct: number, color = '#e7a72c', dark = '#c08420') {
  g.fillStyle(N('#2b1a12')); g.fillRect(x, y, w, h);
  g.fillStyle(N('#6b4e36')); g.fillRect(x + 3, y + 3, w - 6, h - 6);
  const fw = Math.round((w - 6) * Math.max(0, Math.min(1, pct)));
  if (fw > 0) {
    g.fillStyle(N(color)); g.fillRect(x + 3, y + 3, fw, h - 6);
    g.fillStyle(N(dark));
    for (let sx = x + 3 + 9; sx < x + 3 + fw; sx += 12) g.fillRect(sx, y + 3, 3, h - 6);
    g.fillStyle(0xffffff, 0.3); g.fillRect(x + 3, y + 3, fw, 3);
  }
}
