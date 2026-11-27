// A list of questions that open to show their answer (FAQ and "I'm stuck" tips).
import Phaser from 'phaser';
import { Button, Card, text, type Clip } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { C, N } from '../../ui/theme';
import { FAQ, FAQ_CATS, type Faq } from './content';

export interface AccItem { id: string; q: string; a: string; action?: { label: string; run: () => void; disabled?: string } }

/** Draws the list into `c` at (x, y). Returns the height used. */
export function accordion(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, items: AccItem[], open: string | null, toggle: (id: string) => void, clip: Clip, idPrefix: string, size = 19) {
  const y0 = y;
  for (const it of items) {
    const isOpen = open === it.id;
    const pad = 14;
    const q = text(scene, pad + 30, pad - 2, it.q, size, C.ink, { fontStyle: 'bold', wordWrap: { width: w - pad * 2 - 30 } });
    let h = pad + q.height + pad - 4;
    let ans: { key: string; h: number } | null = null;
    if (isOpen) { ans = richTexture(scene, it.a, { width: w - pad * 2 - 30, size: size - 2, color: C.inkSoft }); h += ans.h + 8; if (it.action) h += 54; }
    const card = new Card(scene, x, y, w, h, () => toggle(it.id), { id: `${idPrefix}.${it.id}`, label: it.q, clip, frame: isOpen ? 'sel' : undefined });
    const tri = scene.add.graphics();
    tri.fillStyle(N(isOpen ? C.goldDark : C.inkSoft));
    if (isOpen) tri.fillTriangle(pad, pad + 4, pad + 18, pad + 4, pad + 9, pad + 14);
    else tri.fillTriangle(pad + 3, pad, pad + 3, pad + 18, pad + 13, pad + 9);
    card.add(tri);
    card.add(q);
    if (ans) {
      const ay = pad + q.height + 4;
      card.add(scene.add.image(pad + 30, ay, ans.key).setOrigin(0, 0));
      if (it.action) {
        const a = it.action;
        const b = new Button(scene, pad + 30, ay + ans.h + 10, a.disabled ? `${a.label} (${a.disabled})` : a.label, a.run, { variant: 'blue', h: 42, size: 16, id: `${idPrefix}.${it.id}.do`, clip, disabled: !!a.disabled });
        card.add(b);
      }
    }
    c.add(card);
    y += h + 10;
  }
  return y - y0;
}

/** FAQ entries matching a search text and/or a category. */
export function faqSearch(query: string, cat: string | null): Faq[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  return FAQ.filter((f) => (!cat || f.cat === cat) && (!words.length || words.every((w) => (f.q + ' ' + f.a).toLowerCase().includes(w))));
}

/** Category chips. Returns the height used. */
export function faqCats(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, cat: string | null, set: (id: string | null) => void, clip: Clip) {
  let cx = x, cy = y;
  const chips = [{ id: '', label: 'All', icon: 'star' }, ...FAQ_CATS];
  for (const ch of chips) {
    const on = (cat ?? '') === ch.id;
    const b = new Button(scene, 0, 0, ch.label, () => set(ch.id || null), { variant: on ? 'gold' : 'paper', icon: ch.icon, h: 40, size: 15, id: 'faq.cat.' + (ch.id || 'all'), clip });
    if (cx + b.bw > x + w) { cx = x; cy += 48; }
    b.setPosition(cx, cy);
    c.add(b);
    cx += b.bw + 8;
  }
  return cy + 48 - y;
}
