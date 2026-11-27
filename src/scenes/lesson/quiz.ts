// Quiz exercises drawn by Phaser: choice, fill-in-the-blank, order, tap-match, link X to Y,
// type the answer, find the bug, and teach cards. Each widget keeps its state in `ws`
// (so the screen can be rebuilt on resize) and can give a hint (used by the Lightbulb).
import { untranslated, tr } from '../../i18n';
import Phaser from 'phaser';
import type { Bug, Choice, Fill, Match, Order, Teach, TypeIn, CodeLang } from '../../course/types';
import { Card, text, domInput, UI, type Clip } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { tokenLines, TOKEN_COLORS } from '../../lib/tokens';
import { C, N, CODE_FONT, FONT } from '../../ui/theme';
import { drawFrame } from '../../ui/draw';
import { FRAMES } from '../../ui/theme';
import { play } from '../../audio/sound';

export interface Verdict { correct: boolean; solution?: string; mistakes?: number }
export type Status = 'answer' | 'right' | 'wrong';

export interface ExCtx {
  scene: Phaser.Scene;
  c: Phaser.GameObjects.Container;
  x: number; y: number; w: number;
  clip: Clip;
  ws: Record<string, unknown>;
  status: Status;
  changed: () => void;
  auto: (v: Verdict) => void;
  codeSize: number;
}
export interface ExWidget { h: number; ready(): boolean; check(): Verdict | Promise<Verdict>; hint: (() => boolean) | null; destroy?(): void; focus?(): void }

const shuffle = <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const mixed = <T,>(a: T[]) => { if (a.length < 2) return a.slice(); for (let k = 0; k < 10; k++) { const s = shuffle(a); if (s.some((x, i) => x !== a[i])) return s; } return a.slice().reverse(); };
const codeish = (o: string) => /[<>{}();=]/.test(o) && /^[<.#{(`"'\w$-]/.test(o);

/** Monospace character width for the code font. */
function charW(scene: Phaser.Scene, size: number) {
  const t = scene.add.text(0, 0, 'MMMMMMMMMM', { fontFamily: CODE_FONT, fontSize: `${size}px` });
  const w = t.width / 10;
  t.destroy();
  return w;
}

/** Draws code lines (highlighted) into a container at (x, y). Returns the height. */
function drawCode(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, code: string, lang: CodeLang, size: number) {
  const lh = Math.round(size * 1.1);
  tokenLines(code, lang).forEach((line, i) => {
    let xx = x;
    for (const t of line) {
      const tx = untranslated(() => scene.add.text(xx, y + i * lh, t.text, { fontFamily: CODE_FONT, fontSize: `${size}px`, color: TOKEN_COLORS[t.cls] ?? '#f3e9d2' }));
      c.add(tx);
      xx += tx.width;
    }
  });
  return code.split('\n').length * lh;
}

/** A dark code box. */
export function codeBox(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, code: string, lang: CodeLang = 'js', size = 24) {
  const t = richTexture(scene, '```\n' + code + '\n```', { width: w, size: Math.round(size / 1.15), lang });
  c.add(scene.add.image(x, y, t.key).setOrigin(0, 0));
  return t.h;
}

function optionText(scene: Phaser.Scene, s: string, w: number, code: boolean, size: number) {
  return code ? richTexture(scene, '`' + s.replace(/`/g, "'") + '`', { width: w, size, codeBg: 'rgba(0,0,0,0)' }) : richTexture(scene, s, { width: w, size });
}

// ---------------- teach ----------------
export function teachWidget(x: ExCtx, ex: Teach, refresher: boolean): ExWidget {
  const { scene, c, w } = x;
  const body = richTexture(scene, ex.body, { width: w - 44, size: 20 });
  const code = ex.code ? richTexture(scene, '```\n' + ex.code + '\n```', { width: w - 44, size: 20, lang: ex.lang ?? 'js' }) : null;
  const h = 90 + body.h + (code ? code.h + 14 : 0) + 20;
  const g = scene.add.graphics(); drawFrame(g, x.x, x.y, w, h, FRAMES.panel);
  c.add(g);
  c.add(text(scene, x.x + 22, x.y + 16, refresher ? 'REFRESHER' : 'NEW CONCEPT', 15, C.purple, { fontStyle: 'bold' }));
  c.add(text(scene, x.x + 22, x.y + 36, ex.title, 28, C.ink, { fontStyle: 'bold', wordWrap: { width: w - 44 } }));
  c.add(scene.add.image(x.x + 22, x.y + 80, body.key).setOrigin(0, 0));
  if (code) c.add(scene.add.image(x.x + 22, x.y + 92 + body.h, code.key).setOrigin(0, 0));
  return { h, ready: () => true, check: () => ({ correct: true }), hint: null };
}

// ---------------- choice ----------------
export function choiceWidget(x: ExCtx, ex: Choice): ExWidget {
  const { scene, c, w, ws, status } = x;
  if (!ws.order) ws.order = ex.options.length === 2 && ex.options[0] === 'True' ? [0, 1] : shuffle(ex.options.map((_, i) => i));
  const order = ws.order as number[];
  const removed = (ws.removed ?? []) as number[];
  let y = x.y;
  if (ex.code) y += codeBox(scene, c, x.x, y, w, ex.code, ex.lang ?? 'js') + 12;
  const code = ex.codeOptions ?? ex.options.every(codeish);
  const two = ex.options.length === 2 || (ex.options.length === 4 && ex.options.every((o) => o.length < 18) && w > 440);
  const cols = two ? 2 : 1, gap = 10, cw = (w - gap * (cols - 1)) / cols;
  const cards: Card[] = [];
  const heights = order.map((i) => optionText(scene, ex.options[i], cw - 80, code, 21).h);
  const rowH = (r: number) => Math.max(...heights.slice(r * cols, r * cols + cols)) + 30;
  let rowY = y;
  order.forEach((i, k) => {
    const r = Math.floor(k / cols), col = k % cols;
    if (col === 0 && k > 0) rowY += rowH(r - 1) + gap;
    const t = optionText(scene, ex.options[i], cw - 80, code, 21);
    const card = new Card(scene, x.x + col * (cw + gap), rowY, cw, rowH(r), () => pick(i), { id: `opt.${k}`, label: ex.options[i], clip: x.clip });
    const kb = scene.add.graphics(); kb.lineStyle(3, N('#c9b88f')).strokeRect(16, (rowH(r) - 30) / 2 - 2, 30, 30);
    card.add([kb, text(scene, 31, (rowH(r) - 30) / 2 + 13, String(k + 1), 17, C.inkSoft).setOrigin(0.5), scene.add.image(60, (rowH(r) - t.h) / 2 - 2, t.key).setOrigin(0, 0)]);
    card.setData('i', i);
    if (removed.includes(i)) card.setState2('off').setEnabled(false).setAlpha(0.45);
    cards.push(card);
    c.add(card);
  });
  const total = rowY + rowH(Math.ceil(order.length / cols) - 1) - y;
  const paint = () => cards.forEach((cd) => {
    const i = cd.getData('i') as number;
    if (removed.includes(i)) return;
    cd.setState2(status !== 'answer' && i === ex.answer ? 'right' : status === 'wrong' && i === ws.sel ? 'wrong' : i === ws.sel ? 'sel' : 'normal');
    cd.setEnabled(status === 'answer');
  });
  const pick = (i: number) => { if (status !== 'answer' || removed.includes(i)) return; ws.sel = i; play('click'); paint(); x.changed(); };
  paint();
  scene.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
    if (status !== 'answer' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    const n = Number(e.key);
    if (n >= 1 && n <= order.length) pick(order[n - 1]);
  });
  return {
    h: y - x.y + total,
    ready: () => ws.sel !== undefined,
    check: () => ({ correct: ws.sel === ex.answer, solution: ex.options[ex.answer] }),
    hint: ex.options.length > 2 && !removed.length ? () => {
      const wrong = shuffle(ex.options.map((_, i) => i).filter((i) => i !== ex.answer));
      ws.removed = wrong.slice(0, Math.ceil(wrong.length / 2));
      if (ws.sel !== undefined && (ws.removed as number[]).includes(ws.sel as number)) delete ws.sel;
      return true;
    } : null,
  };
}

// ---------------- tiles (fill / order banks) ----------------
function tile(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, label: string, onClick: () => void, opts: { code?: boolean; w?: number; state?: 'normal' | 'right' | 'wrong' | 'sel'; hidden?: boolean; id?: string; clip?: Clip; size?: number }) {
  const size = opts.size ?? 24;
  const mk = () => scene.add.text(0, 0, label, { fontFamily: opts.code === false ? FONT : CODE_FONT, fontSize: `${size}px`, color: C.ink });
  const t = opts.code === false ? mk() : untranslated(mk);
  const w = opts.w ?? Math.max(44, t.width + 28);
  const h = Math.round(size * 1.1) + 22;
  const card = new Card(scene, x, y, w, h, onClick, { id: opts.id, label, clip: opts.clip, frame: 'tile' });
  t.setPosition(opts.w ? 14 : Math.round((w - t.width) / 2), Math.round((h - t.height) / 2) - 2);
  card.add(t);
  if (opts.state && opts.state !== 'normal') card.setState2(opts.state);
  if (opts.hidden) card.setVisible(false);
  c.add(card);
  return { card, w, h };
}

/** Lays out tiles in wrapping rows. Returns the height. */
function bank(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, items: { label: string; used: boolean; onClick: () => void; id: string }[], clip: Clip, code = true, full = false) {
  let bx = 0, by = 0, rowH = 0;
  const widths = items.map((it) => { const t = scene.add.text(0, 0, it.label, { fontFamily: code ? CODE_FONT : FONT, fontSize: '24px' }); const ww = full ? w : Math.max(44, t.width + 28); t.destroy(); return ww; });
  // centre each row
  const rows: number[][] = [[]];
  let rw = 0;
  widths.forEach((ww, i) => { if (rw + ww > w && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += ww + 8; });
  for (const row of rows) {
    const tot = row.reduce((a, i) => a + widths[i] + 8, -8);
    bx = full ? 0 : Math.round((w - tot) / 2);
    for (const i of row) {
      const it = items[i];
      const r = tile(scene, c, x + bx, y + by, it.label, it.onClick, { code, w: full ? w : undefined, hidden: it.used, id: it.id, clip });
      rowH = Math.max(rowH, r.h);
      bx += widths[i] + 8;
    }
    by += rowH + 8;
  }
  return by;
}

// ---------------- fill in the blanks ----------------
export function fillWidget(x: ExCtx, ex: Fill): ExWidget {
  const { scene, c, w, ws, status } = x;
  if (!ws.tiles) ws.tiles = shuffle([...ex.answers, ...ex.distractors].map((text, id) => ({ id, text })));
  const tiles = ws.tiles as { id: number; text: string }[];
  const parts = ex.code.split('___');
  const slots = parts.length - 1;
  if (!ws.placed) ws.placed = Array(slots).fill(null);
  const placed = ws.placed as (number | null)[];
  const locked = (ws.locked ?? []) as number[];
  const textOf = (id: number | null) => (id === null ? undefined : tiles.find((t) => t.id === id)?.text);
  const size = x.codeSize;
  const cw = charW(scene, size);
  const lh = Math.round(size * 1.1) + 16;
  const slotChars = Math.max(3, ...tiles.map((t) => t.text.length)) + 1;
  const slotW = Math.ceil(slotChars * cw + 12);
  const active = (ws.target as number | undefined) ?? placed.indexOf(null);
  // layout code with inline slots
  const box = scene.add.container(x.x, x.y);
  c.add(box);
  const pad = 18;
  let cx = pad, cy = pad;
  const maxX = w - pad;
  const tokens = tokenLines(ex.code.replace(/___/g, '\u0001'), ex.lang ?? 'js');
  let slotIndex = 0;
  const items: Phaser.GameObjects.GameObject[] = [];
  for (let li = 0; li < tokens.length; li++) {
    if (li > 0) { cx = pad; cy += lh; }
    for (const t of tokens[li]) {
      const pieces = t.text.split('\u0001');
      pieces.forEach((piece, pi) => {
        if (piece) {
          const tw = piece.length * cw;
          if (cx + tw > maxX && cx > pad) { cx = pad + cw * 2; cy += lh; }
          items.push(scene.add.text(cx, cy + 6, piece, { fontFamily: CODE_FONT, fontSize: `${size}px`, color: TOKEN_COLORS[t.cls] ?? '#f3e9d2' }));
          cx += tw;
        }
        if (pi < pieces.length - 1) {
          if (cx + slotW > maxX && cx > pad) { cx = pad + cw * 2; cy += lh; }
          const k = slotIndex++;
          const sx = cx + 2, sy = cy;
          const g = scene.add.graphics();
          const val = textOf(placed[k]);
          const right = status !== 'answer' && val === ex.answers[k], wrong = status !== 'answer' && val !== ex.answers[k];
          g.fillStyle(right ? 0x5aa83c : wrong ? 0xd2473c : k === active && status === 'answer' ? 0xffd66b : 0xffffff, right || wrong ? 0.55 : k === active ? 0.25 : 0.08).fillRect(sx, sy + 2, slotW - 4, lh - 6);
          g.fillStyle(k === active && status === 'answer' ? 0xffd66b : locked.includes(k) ? 0xffd66b : 0x9a8468).fillRect(sx, sy + lh - 7, slotW - 4, 3);
          items.push(g);
          if (val !== undefined) items.push(scene.add.text(sx + (slotW - 4) / 2, sy + 6, val, { fontFamily: CODE_FONT, fontSize: `${size}px`, color: '#ffffff' }).setOrigin(0.5, 0));
          else if (slots > 1) items.push(scene.add.text(sx + (slotW - 4) / 2, sy + 10, String(k + 1), { fontFamily: CODE_FONT, fontSize: `${Math.round(size * 0.7)}px`, color: '#9a8468' }).setOrigin(0.5, 0));
          const z = scene.add.zone(sx, sy, slotW - 4, lh).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer) => {
            if (!x.clip.contains(p.x, p.y) || status !== 'answer' || locked.includes(k)) return;
            placed[k] = null; ws.target = k; play('click'); x.changed(); (scene as unknown as { rebuild: () => void }).rebuild();
          });
          items.push(z);
          UI.reg(scene, `slot.${k}`, z, `Gap ${k + 1}`, undefined, x.clip);
          cx += slotW;
        }
      });
    }
  }
  const boxH = cy + lh + pad - 6;
  const bg = scene.add.graphics(); drawFrame(bg, 0, 0, w, boxH, FRAMES.slate);
  box.add([bg, ...items]);
  const put = (id: number) => {
    if (status !== 'answer') return;
    const tgt = ws.target as number | undefined;
    const i = tgt !== undefined && !locked.includes(tgt) ? tgt : placed.indexOf(null);
    if (i < 0) return;
    placed[i] = id; delete ws.target; play('click'); x.changed(); (scene as unknown as { rebuild: () => void }).rebuild();
  };
  const bh = bank(scene, c, x.x, x.y + boxH + 14, w, tiles.map((t) => ({ label: t.text, used: placed.includes(t.id), onClick: () => put(t.id), id: 'tile.' + t.id })), x.clip);
  return {
    h: boxH + 14 + bh,
    ready: () => placed.every((p) => p !== null),
    check: () => {
      const filled = parts.map((p, i) => p + (i < slots ? ex.answers[i] : '')).join('');
      return { correct: placed.every((p, i) => textOf(p) === ex.answers[i]), solution: '```\n' + filled + '\n```' };
    },
    hint: () => {
      const i = placed.findIndex((p, k) => textOf(p) !== ex.answers[k]);
      if (i < 0) return false;
      const t = tiles.find((tt) => tt.text === ex.answers[i] && !placed.some((p, k) => p === tt.id && textOf(p) === ex.answers[k]));
      if (!t) return false;
      const was = placed.indexOf(t.id);
      if (was >= 0) placed[was] = null;
      placed[i] = t.id;
      ws.locked = [...locked, i];
      return true;
    },
  };
}

// ---------------- put in order ----------------
export function orderWidget(x: ExCtx, ex: Order): ExWidget {
  const { scene, c, w, ws, status } = x;
  if (!ws.tiles) ws.tiles = mixed(ex.lines.map((text, id) => ({ id, text })));
  const tiles = ws.tiles as { id: number; text: string }[];
  if (!ws.chosen) ws.chosen = [];
  const chosen = ws.chosen as number[];
  const lockedN = (ws.locked as number | undefined) ?? 0;
  const plain = ex.lang === 'text';
  const textOf = (id: number) => tiles.find((t) => t.id === id)!.text;
  let y = x.y;
  const rowH = 52;
  const area = scene.add.graphics();
  c.add(area);
  const areaH = ex.lines.length * (rowH + 6) + 14;
  area.fillStyle(0xfff6dc, 0.6).fillRect(x.x, y, w, areaH);
  area.lineStyle(3, N('#b8955c')).strokeRect(x.x, y, w, areaH);
  ex.lines.forEach((_, k) => {
    const ry = y + 8 + k * (rowH + 6);
    const id = chosen[k];
    if (id === undefined) {
      const next = k === chosen.length && status === 'answer';
      const g = scene.add.graphics();
      g.lineStyle(3, next ? N(C.gold) : N('#c9b88f')).strokeRect(x.x + 8, ry, w - 16, rowH);
      if (next) g.fillStyle(N('#fdeec4'), 0.8).fillRect(x.x + 10, ry + 2, w - 20, rowH - 4);
      c.add(g);
      c.add(text(scene, x.x + 20, ry + 14, String(k + 1), 18, '#c9b88f', { fontStyle: 'bold' }));
      if (next) c.add(text(scene, x.x + 48, ry + 14, 'tap a piece below', 17, C.muted));
      return;
    }
    const st = status !== 'answer' ? (textOf(id) === ex.lines[k] ? 'right' : 'wrong') : k < lockedN ? 'sel' : 'normal';
    const r = tile(scene, c, x.x + 8, ry, `${k + 1}  ${textOf(id)}`, () => {
      if (status !== 'answer' || k < lockedN) return;
      ws.chosen = chosen.filter((z) => z !== id); play('click'); x.changed(); (scene as unknown as { rebuild: () => void }).rebuild();
    }, { code: !plain, w: w - 16, state: st, id: `placed.${k}`, clip: x.clip, size: 22 });
    void r;
  });
  y += areaH + 14;
  const bh = bank(scene, c, x.x, y, w, tiles.map((t) => ({ label: t.text, used: chosen.includes(t.id), onClick: () => { if (status !== 'answer') return; chosen.push(t.id); play('click'); x.changed(); (scene as unknown as { rebuild: () => void }).rebuild(); }, id: 'tile.' + t.id })), x.clip, !plain, ex.lines.some((l) => l.length > 14) || !plain);
  return {
    h: areaH + 14 + bh,
    ready: () => chosen.length === tiles.length,
    check: () => ({ correct: chosen.length === ex.lines.length && chosen.every((id, i) => textOf(id) === ex.lines[i]), solution: '```\n' + ex.lines.join('\n') + '\n```' }),
    hint: () => {
      let k = 0;
      while (k < chosen.length && textOf(chosen[k]) === ex.lines[k]) k++;
      if (k >= ex.lines.length) return false;
      const keep = chosen.slice(0, k);
      const t = tiles.find((tt) => tt.text === ex.lines[k] && !keep.includes(tt.id));
      if (!t) return false;
      ws.chosen = [...keep, t.id];
      ws.locked = k + 1;
      return true;
    },
  };
}

// ---------------- match by tapping ----------------
export function matchWidget(x: ExCtx, ex: Match): ExWidget {
  const { scene, c, w, ws, status } = x;
  if (!ws.left) { ws.left = shuffle(ex.pairs.map((p, i) => ({ i, text: p[0] }))); ws.right = shuffle(ex.pairs.map((p, i) => ({ i, text: p[1] }))); ws.matched = []; ws.mistakes = 0; }
  const left = ws.left as { i: number; text: string }[], right = ws.right as { i: number; text: string }[];
  const matched = ws.matched as number[];
  const gap = 10, cw = (w - gap) / 2;
  const hOf = (s: string) => optionText(scene, s, cw - 30, codeish(s) && s.length < 30, 20).h + 28;
  const rows = left.map((l, k) => Math.max(58, hOf(l.text), hOf(right[k].text)));
  const cards = new Map<string, Card>();
  let y = x.y;
  left.forEach((l, k) => {
    const r = right[k];
    for (const [side, item, cx] of [['l', l, x.x], ['r', r, x.x + cw + gap]] as const) {
      const t = optionText(scene, item.text, cw - 30, codeish(item.text) && item.text.length < 30, 20);
      const card = new Card(scene, cx, y, cw, rows[k], () => pick(side, item.i), { id: `match.${side}.${k}`, label: item.text, clip: x.clip });
      card.add(scene.add.image((cw - t.w) / 2, (rows[k] - t.h) / 2 - 2, t.key).setOrigin(0, 0));
      c.add(card);
      cards.set(side + item.i, card);
    }
    y += rows[k] + gap;
  });
  const paint = () => {
    for (const [k, card] of cards) {
      const side = k[0], i = Number(k.slice(1));
      const gone = matched.includes(i);
      card.setAlpha(gone ? 0.3 : 1).setEnabled(!gone && status === 'answer');
      card.setState2((side === 'l' ? ws.selL : ws.selR) === i && !gone ? 'sel' : 'normal');
    }
  };
  let busy = false;
  const pick = (side: 'l' | 'r', i: number) => {
    if (busy || status !== 'answer' || matched.includes(i)) return;
    if (side === 'l') ws.selL = i; else ws.selR = i;
    const l = ws.selL as number | undefined, r = ws.selR as number | undefined;
    if (l === undefined || r === undefined) { play('click'); paint(); return; }
    if (l === r) {
      matched.push(l); delete ws.selL; delete ws.selR; play('coin'); paint();
      if (matched.length === ex.pairs.length) scene.time.delayedCall(250, () => x.auto({ correct: true, mistakes: ws.mistakes as number }));
    } else {
      ws.mistakes = (ws.mistakes as number) + 1;
      play('wrong');
      const a = cards.get('l' + l)!, b = cards.get('r' + r)!;
      a.setState2('wrong'); b.setState2('wrong');
      busy = true;
      scene.tweens.add({ targets: [a, b], x: '+=6', duration: 60, yoyo: true, repeat: 2 });
      scene.time.delayedCall(450, () => { busy = false; delete ws.selL; delete ws.selR; paint(); });
    }
  };
  paint();
  return {
    h: y - x.y,
    ready: () => false,
    check: () => ({ correct: matched.length === ex.pairs.length, mistakes: ws.mistakes as number }),
    hint: () => {
      const i = ex.pairs.findIndex((_, k) => !matched.includes(k));
      if (i < 0) return false;
      matched.push(i);
      if (matched.length === ex.pairs.length) scene.time.delayedCall(250, () => x.auto({ correct: true, mistakes: ws.mistakes as number }));
      return true;
    },
  };
}

// ---------------- link X to Y (ropes) ----------------
const ROPES = ['#e7a72c', '#3f8fd6', '#a066d8', '#e0603a', '#2fa08a', '#d94f8a', '#7a9a2a'];
export function linkWidget(x: ExCtx, ex: Match): ExWidget {
  const { scene, c, w, ws, status } = x;
  if (!ws.left) { ws.left = shuffle(ex.pairs.map((p, i) => ({ id: i, text: p[0] }))); ws.right = mixed(ex.pairs.map((p, i) => ({ id: i, text: p[1] }))); ws.links = {}; ws.locked = []; }
  const left = ws.left as { id: number; text: string }[], right = ws.right as { id: number; text: string }[];
  const links = ws.links as Record<number, number>;
  const locked = ws.locked as number[];
  const gapW = w < 500 ? 36 : 70;
  const cw = (w - gapW) / 2;
  const hOf = (s: string) => optionText(scene, s, cw - 44, codeish(s) && s.length < 34, 19).h + 28;
  const rows = left.map((l, k) => Math.max(56, hOf(l.text), hOf(right[k].text)));
  const pegs: { l: Record<number, [number, number]>; r: Record<number, [number, number]> } = { l: {}, r: {} };
  const cards = new Map<string, Card>();
  const ropes = scene.add.graphics();
  let y = x.y;
  left.forEach((l, k) => {
    for (const [side, item] of [['l', l], ['r', right[k]]] as const) {
      const cx = side === 'l' ? x.x : x.x + cw + gapW;
      const t = optionText(scene, item.text, cw - 44, codeish(item.text) && item.text.length < 34, 19);
      const card = new Card(scene, cx, y, cw, rows[k], () => tap(side, item.id), { id: `link.${side}.${k}`, label: item.text, clip: x.clip });
      card.add(scene.add.image(side === 'l' ? 14 : 30, (rows[k] - t.h) / 2 - 2, t.key).setOrigin(0, 0));
      const px = side === 'l' ? cw - 4 : 4, py = rows[k] / 2;
      const peg = scene.add.graphics(); peg.fillStyle(0x2b1a12).fillRect(px - 9, py - 9, 18, 18); peg.fillStyle(N('#fff4dc')).fillRect(px - 6, py - 6, 12, 12);
      card.add(peg);
      card.setData('side', side); card.setData('id', item.id);
      c.add(card);
      cards.set(side + item.id, card);
      (side === 'l' ? pegs.l : pegs.r)[item.id] = [cx + px, y + py];
    }
    y += rows[k] + 10;
  });
  c.add(ropes);
  const color = (l: number) => ROPES[left.findIndex((q) => q.id === l) % ROPES.length];
  let drag: { side: 'l' | 'r'; id: number; to: [number, number] } | null = null;
  const draw = () => {
    ropes.clear();
    for (const [ls, r] of Object.entries(links)) {
      const l = Number(ls);
      const a = pegs.l[l], b = pegs.r[r];
      if (!a || !b) continue;
      const col = status !== 'answer' ? (l === r ? '#4e9f35' : '#d2473c') : color(l);
      ropes.lineStyle(10, 0x2b1a12).lineBetween(a[0], a[1], b[0], b[1]);
      ropes.lineStyle(5, N(col)).lineBetween(a[0], a[1], b[0], b[1]);
    }
    if (drag) {
      const a = drag.side === 'l' ? pegs.l[drag.id] : pegs.r[drag.id];
      ropes.lineStyle(10, 0x2b1a12).lineBetween(a[0], a[1], drag.to[0], drag.to[1]);
      ropes.lineStyle(5, 0xfff4dc).lineBetween(a[0], a[1], drag.to[0], drag.to[1]);
    }
    for (const [k, card] of cards) {
      const side = k[0], id = Number(k.slice(1));
      // the left item this card is tied to (if any)
      const lid = side === 'l' ? (links[id] !== undefined ? id : undefined) : Object.keys(links).map(Number).find((q) => links[q] === id);
      const sel = ws.sel as { side: string; id: number } | undefined;
      let state: 'normal' | 'sel' | 'right' | 'wrong' = 'normal';
      if (status !== 'answer' && lid !== undefined) state = links[lid] === lid ? 'right' : 'wrong';
      else if (sel && sel.side === side && sel.id === id) state = 'sel';
      card.setState2(state);
      card.setEnabled(status === 'answer');
    }
  };
  const connect = (a: { side: string; id: number }, b: { side: string; id: number }) => {
    if (a.side === b.side) return false;
    const l = a.side === 'l' ? a.id : b.id, r = a.side === 'r' ? a.id : b.id;
    if (locked.includes(l)) return false;
    const holder = Object.keys(links).find((q) => links[Number(q)] === r);
    if (holder !== undefined && locked.includes(Number(holder))) return false;
    for (const q of Object.keys(links)) if (Number(q) === l || links[Number(q)] === r) delete links[Number(q)];
    links[l] = r;
    play('click');
    x.changed();
    return true;
  };
  const tap = (side: 'l' | 'r', id: number) => {
    if (status !== 'answer') return;
    const sel = ws.sel as { side: 'l' | 'r'; id: number } | undefined;
    if (sel && sel.side !== side) { connect(sel, { side, id }); delete ws.sel; draw(); return; }
    const lid = side === 'l' ? (links[id] !== undefined ? id : undefined) : Object.keys(links).map(Number).find((q) => links[q] === id);
    if (lid !== undefined && !locked.includes(lid) && !sel) { delete links[lid]; ws.sel = { side, id }; play('click'); x.changed(); draw(); return; }
    ws.sel = sel && sel.side === side && sel.id === id ? undefined : { side, id };
    draw();
  };
  // dragging ropes
  const local = (p: Phaser.Input.Pointer): [number, number] => [p.x - c.x, p.y - c.y];
  const onDown = (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
    if (status !== 'answer') return;
    for (const o of over) {
      const card = o.parentContainer as Card | null;
      if (card && card.getData && card.getData('side')) { drag = { side: card.getData('side'), id: card.getData('id'), to: local(p) }; drag.to = local(p); return; }
    }
  };
  let moved = false;
  const onMove = (p: Phaser.Input.Pointer) => {
    if (!drag || !p.isDown) return;
    const start = drag.side === 'l' ? pegs.l[drag.id] : pegs.r[drag.id];
    const to = local(p);
    if (Math.hypot(to[0] - start[0], to[1] - start[1]) > 40) moved = true;
    if (moved) { drag.to = to; draw(); }
  };
  const onUp = (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
    const d = drag; drag = null;
    if (!d || !moved) { moved = false; return; }
    moved = false;
    for (const o of over) {
      const card = o.parentContainer as Card | null;
      if (card && card.getData && card.getData('side')) connect(d, { side: card.getData('side'), id: card.getData('id') });
    }
    delete ws.sel;
    draw();
    void p;
  };
  scene.input.on('pointerdown', onDown); scene.input.on('pointermove', onMove); scene.input.on('pointerup', onUp);
  draw();
  let answerH = 0;
  if (status === 'wrong') {
    const t = richTexture(scene, ex.pairs.map(([a, b]) => `**${a}** → ${b}`).join('\n'), { width: w - 24, size: 17 });
    const g = scene.add.graphics(); g.fillStyle(0xfff6dc, 0.9).fillRect(x.x, y, w, t.h + 20); g.lineStyle(3, N('#b8955c')).strokeRect(x.x, y, w, t.h + 20);
    c.add([g, scene.add.image(x.x + 12, y + 10, t.key).setOrigin(0, 0)]);
    answerH = t.h + 30;
  }
  return {
    h: y - x.y + answerH,
    ready: () => Object.keys(links).length === ex.pairs.length,
    check: () => ({ correct: ex.pairs.every((_, i) => links[i] === i), solution: ex.pairs.map(([a, b]) => `${a} → ${b}`).join(' · ') }),
    hint: () => {
      const i = left.map((l) => l.id).find((id) => links[id] !== id);
      if (i === undefined) return false;
      for (const q of Object.keys(links)) if (Number(q) === i || links[Number(q)] === i) delete links[Number(q)];
      links[i] = i;
      locked.push(i);
      return true;
    },
    destroy: () => { scene.input.off('pointerdown', onDown); scene.input.off('pointermove', onMove); scene.input.off('pointerup', onUp); },
  };
}

// ---------------- type the answer ----------------
const normalize = (s: string, cs?: boolean) => { const t = s.trim().replace(/\s+/g, ' ').replace(/;$/, ''); return cs ? t : t.toLowerCase(); };
export function typeWidget(x: ExCtx, ex: TypeIn, onEnter: () => void): ExWidget {
  const { scene, c, w, ws, status } = x;
  let y = x.y;
  if (ex.code) y += codeBox(scene, c, x.x, y, w, ex.code, ex.lang ?? 'js') + 12;
  const sv = x.clip.rect();
  const inY = y;
  const inp = domInput(scene, 0, 0, w, 56, { value: (ws.value as string) ?? '', placeholder: ex.placeholder ?? 'Type your answer', size: 28, code: true, id: 'type.input', onInput: (v) => { ws.value = v; x.changed(); }, onEnter });
  inp.el.className += ' type-input';
  if (status !== 'answer') { inp.el.disabled = true; inp.el.style.background = status === 'right' ? '#d8f1c8' : '#fbd7d2'; }
  const place = () => {
    const yy = c.y + inY; const xx = c.x + x.x;
    inp.dom.setPosition(xx, yy);
    inp.dom.setVisible(yy > sv.y - 30 && yy + 56 < sv.y + sv.h + 30);
  };
  scene.events.on('update', place);
  place();
  if (status === 'answer') setTimeout(() => inp.el.focus(), 60);
  return {
    h: y - x.y + 60,
    ready: () => !!((ws.value as string) ?? '').trim(),
    check: () => ({ correct: [...ex.answers, ...ex.answers.map(tr)].some((a) => normalize(a, ex.caseSensitive) === normalize((ws.value as string) ?? '', ex.caseSensitive)), solution: '`' + ex.answers[0] + '`' }),
    hint: ws.hinted ? null : () => { const a = ex.answers[0]; ws.value = a.slice(0, Math.max(1, Math.ceil(a.length / 2))); ws.hinted = true; return true; },
    destroy: () => scene.events.off('update', place),
    focus: () => inp.el.focus(),
  };
}

// ---------------- find the bug ----------------
export function bugWidget(x: ExCtx, ex: Bug): ExWidget {
  const { scene, c, w, ws, status } = x;
  const lines = ex.code.split('\n');
  const clean = (ws.clean ?? []) as number[];
  const size = x.codeSize;
  const lh = Math.round(size * 1.1) + 14;
  const bg = scene.add.graphics(); drawFrame(bg, x.x, x.y, w, lines.length * lh + 24, FRAMES.slate);
  c.add(bg);
  lines.forEach((l, i) => {
    const n = i + 1;
    const ry = x.y + 12 + i * lh;
    const g = scene.add.graphics();
    const paint = (hover: boolean) => {
      g.clear();
      const col = status !== 'answer' && n === ex.line ? 0x5aa83c : status === 'wrong' && ws.sel === n ? 0xd2473c : ws.sel === n ? 0x3f8fd6 : hover ? 0xffffff : null;
      if (col !== null) g.fillStyle(col, hover && col === 0xffffff ? 0.08 : 0.55).fillRect(x.x + 10, ry, w - 20, lh);
    };
    paint(false);
    c.add(g);
    c.add(text(scene, x.x + 18, ry + 6, String(n), size * 0.8, '#8a7058', { fontFamily: CODE_FONT }));
    const inner = scene.add.container(x.x + 54, ry + 6);
    drawCode(scene, inner, 0, 0, l, ex.lang ?? 'js', size);
    if (clean.includes(n)) inner.setAlpha(0.3);
    c.add(inner);
    const z = scene.add.zone(x.x + 10, ry, w - 20, lh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => paint(true)).on('pointerout', () => paint(false)).on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!x.clip.contains(p.x, p.y) || status !== 'answer' || clean.includes(n)) return;
      ws.sel = n; play('click'); x.changed(); (scene as unknown as { rebuild: () => void }).rebuild();
    });
    c.add(z);
    UI.reg(scene, `bugline.${n}`, z, `Line ${n}`, () => { if (status === 'answer' && !clean.includes(n)) { ws.sel = n; x.changed(); (scene as unknown as { rebuild: () => void }).rebuild(); } }, x.clip);
  });
  const others = lines.map((_, i) => i + 1).filter((n) => n !== ex.line && lines[n - 1].trim());
  return {
    h: lines.length * lh + 24,
    ready: () => ws.sel !== undefined,
    check: () => ({ correct: ws.sel === ex.line, solution: `The bug is on **line ${ex.line}**: \`${lines[ex.line - 1].trim()}\`` }),
    hint: clean.length || others.length < 2 ? null : () => {
      const drop = shuffle(others).slice(0, Math.ceil(others.length / 2));
      ws.clean = drop;
      if (ws.sel !== undefined && drop.includes(ws.sel as number)) delete ws.sel;
      return true;
    },
  };
}
