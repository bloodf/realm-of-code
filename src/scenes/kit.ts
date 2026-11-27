// Building blocks shared by many scenes.
import Phaser from 'phaser';
import { anim, bubble, Card, text, type Clip } from '../ui/widgets';
import { richTexture } from '../ui/rich';
import { C } from '../ui/theme';
import { parchmentBg } from '../ui/widgets';
import { paintBand, skyColors } from '../pixel/scenes';
import { paintedTex, spriteTex } from '../engine/textures';

/** An animated character with a speech bubble to the right. Returns the total height. */
export function say(scene: Phaser.Scene, parent: Phaser.GameObjects.Container | null, x: number, y: number, w: number, frames: string[], md: string, who?: string, opts: { size?: number; fps?: number; textSize?: number } = {}) {
  const size = opts.size ?? (w < 500 ? 64 : 88);
  const b = bubble(scene, x + size + 8, y, w - size - 8, md, who, opts.textSize ?? (w < 500 ? 19 : 21));
  const h = Math.max(size, b.h);
  b.c.y = y + Math.max(0, h - b.h);
  const a = anim(scene, x, y + h - size, frames, opts.fps ?? 4, size);
  parent?.add([a, b.c]);
  return { h, a, b: b.c };
}

/** A selectable card with a title and a description. */
export function choiceCard(scene: Phaser.Scene, parent: Phaser.GameObjects.Container | null, x: number, y: number, w: number, titleText: string, desc: string, selected: boolean, onPick: () => void, opts: { id?: string; clip?: Clip; icon?: Phaser.GameObjects.GameObject; iconW?: number; extra?: string; color?: string } = {}) {
  const pad = 16;
  const iw = opts.iconW ?? 0;
  const t = text(scene, 0, 0, titleText, 22, C.ink, { fontStyle: 'bold', wordWrap: { width: w - pad * 2 - iw } });
  const d = desc ? richTexture(scene, desc, { width: w - pad * 2 - iw, size: 18, color: C.inkSoft }) : null;
  const ex = opts.extra ? richTexture(scene, opts.extra, { width: w - pad * 2 - iw, size: 16, color: C.muted }) : null;
  const h = Math.max(iw + 20, pad + t.height + (d ? 4 + d.h : 0) + (ex ? 2 + ex.h : 0) + pad);
  const card = new Card(scene, x, y, w, h, onPick, { id: opts.id, label: titleText, clip: opts.clip });
  if (selected) card.setState2('sel');
  t.setPosition(pad + iw, pad - 4);
  card.add(t);
  if (d) card.add(scene.add.image(pad + iw, pad + t.height, d.key).setOrigin(0, 0));
  if (ex) card.add(scene.add.image(pad + iw, pad + t.height + (d ? d.h + 2 : 0), ex.key).setOrigin(0, 0));
  if (opts.icon) { card.add(opts.icon); }
  parent?.add(card);
  return { card, h };
}

/** Full-screen parchment background with a bottom bar. Returns the bar's top y. */
export function screenFrame(scene: Phaser.Scene, footH = 96) {
  const W = scene.scale.width, H = scene.scale.height;
  parchmentBg(scene);
  if (footH > 0) {
    const f = parchmentBg(scene, 0, H - footH, W, footH);
    f.setTint(0xf0e0c0);
    scene.add.rectangle(0, H - footH, W, 6, 0x2b1a12).setOrigin(0, 0);
  }
  return H - footH;
}

/** A section's sky (stepped gradient softened towards parchment), drifting clouds and the landscape band. */
export function skyBackground(scene: Phaser.Scene, courseId: string, footH: number) {
  const W = scene.scale.width, H = scene.scale.height;
  const [top, bottom] = skyColors(courseId);
  const g = scene.add.graphics();
  const steps = 8;
  const mix = (a: string, b: string, k: number) => { const p = (h: string, j: number) => parseInt(h.slice(j, j + 2), 16); const r = (j: number) => Math.round(p(a, j) + (p(b, j) - p(a, j)) * k); return (r(1) << 16) | (r(3) << 8) | r(5); };
  for (let i = 0; i < steps; i++) {
    const k = i / (steps - 1);
    g.fillStyle(mix(mix2hex(top, bottom, k), '#f3e2b8', 0.45), 1).fillRect(0, Math.floor((H * i) / steps), W, Math.ceil(H / steps) + 1);
  }
  for (let i = 0; i < 2; i++) {
    const cl = scene.add.image(Math.random() * W, 60 + i * 140, spriteTex(scene, 'cloud')).setScale(8 - i * 2).setAlpha(0.7 - i * 0.15);
    scene.events.on('update', (_t: number, dt: number) => { cl.x += dt * (0.01 + i * 0.006); if (cl.x > W + 100) cl.x = -100; });
  }
  scene.add.tileSprite(0, H - footH - 216, W, 216, paintedTex(scene, paintBand(courseId))).setOrigin(0, 0).setTileScale(3).setAlpha(0.9);
}
function mix2hex(a: string, b: string, k: number) {
  const p = (h: string, j: number) => parseInt(h.slice(j, j + 2), 16);
  return '#' + [1, 3, 5].map((j) => Math.round(p(a, j) + (p(b, j) - p(a, j)) * k).toString(16).padStart(2, '0')).join('');
}
