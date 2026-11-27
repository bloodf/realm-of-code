// Widgets for building windows: headings, emblems, tags, toggles and value steppers.
import Phaser from 'phaser';
import { C, N, FONT } from '../ui/theme';
import { drawFrame } from '../ui/draw';
import { FRAMES } from '../ui/theme';
import { iconTex, text, UI, type Clip } from '../ui/widgets';
import { richTexture } from '../ui/rich';
import { play } from '../audio/sound';

export function h2(scene: Phaser.Scene, c: Phaser.GameObjects.Container, y: number, s: string, size = 28) {
  c.add(text(scene, 0, y, s, size, C.ink, { fontStyle: 'bold' }));
  return y + size + 10;
}

export function note(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, md: string, size = 18, color: string = C.inkSoft) {
  const t = richTexture(scene, md, { width: w, size, color });
  c.add(scene.add.image(x, y, t.key).setOrigin(0, 0));
  return t.h;
}

/** A coloured square with an icon. */
export function emblem(scene: Phaser.Scene, x: number, y: number, color: string, iconName: string, size = 52) {
  const g = scene.add.graphics();
  g.fillStyle(0x2b1a12).fillRect(x - 3, y - 3, size + 6, size + 6);
  g.fillStyle(N(color)).fillRect(x, y, size, size);
  g.fillStyle(0xffffff, 0.25).fillRect(x, y, size, 4).fillRect(x, y, 4, size);
  g.fillStyle(0x000000, 0.25).fillRect(x, y + size - 4, size, 4).fillRect(x + size - 4, y, 4, size);
  const ic = scene.add.image(x + size / 2, y + size / 2, iconTex(scene, iconName, '#ffffff', Math.max(2, Math.round(size / 24)))).setOrigin(0.5);
  return [g, ic] as Phaser.GameObjects.GameObject[];
}

/** A small coloured tag. Returns its width. */
export function pill(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, s: string, bg = '#e3cf9f', fg: string = C.inkSoft, size = 16) {
  const t = scene.add.text(x + 8, y + 3, s, { fontFamily: FONT, fontSize: `${size}px`, color: fg, fontStyle: 'bold' }).setOrigin(0, 0);
  const g = scene.add.graphics();
  g.fillStyle(0x2b1a12).fillRect(x, y, t.width + 16, size + 8);
  g.fillStyle(N(bg)).fillRect(x + 2, y + 2, t.width + 12, size + 4);
  c.add([g, t]);
  return t.width + 16;
}

/** A framed box at (x, y) (drawn into the container). */
export function box(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, kind: keyof typeof FRAMES = 'panel') {
  const g = scene.add.graphics();
  drawFrame(g, x, y, w, h, FRAMES[kind]);
  c.add(g);
  return g;
}

/** A pixel checkbox. */
export function checkbox(scene: Phaser.Scene, x: number, y: number, on: boolean, onChange: (v: boolean) => void, id?: string, clip?: Clip) {
  const ct = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (v: boolean) => {
    g.clear();
    g.fillStyle(0x2b1a12).fillRect(0, 0, 34, 34);
    g.fillStyle(v ? 0x5aa83c : 0xfdf6e3).fillRect(3, 3, 28, 28);
    if (v) { g.fillStyle(0xffffff); [[8, 16], [11, 19], [14, 22], [17, 19], [20, 16], [23, 13], [26, 10]].forEach(([a, b]) => g.fillRect(a, b, 4, 4)); }
  };
  let val = on;
  draw(val);
  const z = scene.add.zone(0, 0, 34, 34).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer) => {
    if (clip && !clip.contains(p.x, p.y)) return;
    val = !val; draw(val); play('click'); onChange(val);
  });
  ct.add([g, z]);
  if (id) UI.reg(scene, id, z, id, () => { val = !val; draw(val); onChange(val); }, clip);
  return ct;
}

/** "< value >" stepper for a list of choices. */
export function stepper(scene: Phaser.Scene, x: number, y: number, w: number, labels: string[], index: number, onChange: (i: number) => void, id?: string, clip?: Clip) {
  const ct = scene.add.container(x, y);
  const g = scene.add.graphics();
  drawFrame(g, 0, 0, w, 44, FRAMES.paper);
  const t = scene.add.text(w / 2, 22, labels[index], { fontFamily: FONT, fontSize: '22px', color: C.ink, fontStyle: 'bold' }).setOrigin(0.5);
  let i = index;
  const arrow = (dx: number, px: number, icon: string) => {
    const a = scene.add.image(px, 22, iconTex(scene, icon, C.ink, 2)).setOrigin(0.5);
    const z = scene.add.zone(px - 20, 0, 40, 44).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer) => {
      if (clip && !clip.contains(p.x, p.y)) return;
      i = (i + dx + labels.length) % labels.length; t.setText(labels[i]); play('click'); onChange(i);
    });
    ct.add([a, z]);
    if (id) UI.reg(scene, id + (dx > 0 ? '.next' : '.prev'), z, (dx > 0 ? 'Next ' : 'Previous ') + id, () => { i = (i + dx + labels.length) % labels.length; t.setText(labels[i]); onChange(i); }, clip);
  };
  ct.add([g, t]);
  arrow(-1, 22, 'back');
  arrow(1, w - 22, 'next');
  return ct;
}
