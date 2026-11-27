// Look and feel of the game UI (everything is drawn by Phaser).
import type Phaser from 'phaser';
import { PAL, type FrameColors } from '../pixel/ui';

export const FONT = "'Jersey 15', monospace";
export const TITLE_FONT = "'Jacquard 12', 'Jersey 15', serif";
export const CODE_FONT = "'VT323', monospace";

export const C = {
  ink: '#2b1a12', inkSoft: '#6b4e36', muted: '#9a8060', paper: '#fdf6e3', parch: '#f3e2b8', parchDark: '#e9d6a8',
  gold: '#e7a72c', goldDark: '#a86e16', goldLight: '#ffd66b', green: '#5aa83c', greenDark: '#3a7426', red: '#d2473c', redDark: '#8e2a23',
  blue: '#3f8fd6', blueDark: '#285c94', purple: '#8a56c9', cream: '#fbeed2', wood: '#5c3a22', night: '#1c110a',
};

const hexNum = (h: string) => parseInt(h.slice(1, 7), 16);
export const N = (h: string) => hexNum(h);

export function shade(h: string, amt: number) {
  const c = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * (1 + amt))));
  return '#' + [c(1), c(3), c(5)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function colorFrame(color: string): FrameColors {
  return { outline: '#2b1a12', light: shade(color, 0.35), fill: color, dark: shade(color, -0.3) };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { outline: _outline, ...PAL_FRAMES } = PAL;
export const FRAMES: Record<string, FrameColors> = {
  ...PAL_FRAMES,
  panel: PAL.parchment,
  bubble: PAL.paper,
  tile: { outline: '#3b2415', light: '#fff8e6', fill: '#f5e6c4', dark: '#b89460' },
  ghost: PAL.paper,
};
export type FrameKind = keyof typeof FRAMES | FrameColors;
export const frameColors = (k: FrameKind): FrameColors => (typeof k === 'string' ? FRAMES[k] ?? PAL.parchment : k);

/** Base font size: a little smaller on phones. */
export function fs(scene: Phaser.Scene, size = 22) {
  return scene.scale.width < 600 ? Math.round(size * 0.9) : size;
}

export function textStyle(size = 22, color = C.ink, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, color, ...extra };
}

export const isNarrow = (scene: Phaser.Scene) => scene.scale.width < 760;
