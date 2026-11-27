// The seven minigames, drawn by Phaser. Each builder draws the current state (kept in
// ctx.gs so the screen can be rebuilt) and tells the shell what the items do.
import { t, tn } from '../../i18n';
import Phaser from 'phaser';
import { gemForge, runeTypist } from './newgames';
import type { GameId } from '../../game/store';
import type { Pools, Pair } from '../../games/pools';
import { shuffle } from '../../games/pools';
import { bugsFrom } from '../../games/select';
import { archeryRounds, makeQuery, makeLoop, optionsFor, KNIGHTS, COLS, type Round, type Query, type LoopRound, type BugRound } from '../../games/data';
import type { Choice } from '../../course/types';
import { Button, Card, sprite, text, iconTex, domInput, UI } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { tokenLines, TOKEN_COLORS } from '../../lib/tokens';
import { drawFrame } from '../../ui/draw';
import { C, N, FRAMES, CODE_FONT } from '../../ui/theme';
import { spriteTex, paintedTex } from '../../engine/textures';
import { paintBand } from '../../pixel/scenes';
import { useGame } from '../../game/store';
import { ANIMS } from '../../components/anims';
import { play } from '../../audio/sound';
import type { ItemApi } from './Minigame';

export interface GameCtx {
  scene: Phaser.Scene;
  x: number; y: number; w: number; h: number;
  gs: Record<string, unknown>;
  stop: boolean; unitIndex: number; pools: Pools; courseId: string;
  end: (score: number, max: number, stars?: number) => void;
  items: (api: ItemApi) => void;
  rebuild: () => void;
  /** Runs fn after ms, even if the screen rebuilds in between (scene timers die on rebuild). */
  later: (ms: number, fn: () => void) => void;
  timer: (total: number, onZero: () => void) => { add: (s: number) => void; set: (s: number) => void; pause: (on: boolean) => void };
}

// ---------------- helpers ----------------
function chips(ctx: GameCtx, y: number, labels: string[]) {
  const { scene } = ctx;
  const ts = labels.map((l) => scene.add.text(0, 0, l, { fontFamily: "'Jersey 15'", fontSize: '18px', color: '#fff3d6', fontStyle: 'bold' }));
  const total = ts.reduce((a, t) => a + t.width + 28, -8);
  let x = ctx.x + (ctx.w - total) / 2;
  for (const t of ts) {
    const g = scene.add.graphics();
    g.fillStyle(0x1c110a).fillRect(x - 3, y - 3, t.width + 26, 34);
    g.fillStyle(0x6b4226).fillRect(x, y, t.width + 20, 28);
    g.fillStyle(0x4a2c18).fillRect(x, y + 25, t.width + 20, 3);
    t.setPosition(x + 10, y + 4).setDepth(1);
    x += t.width + 28;
  }
  return y + 40;
}

function codeBoxAt(ctx: GameCtx, x: number, y: number, w: number, code: string, lang: 'js' | 'sql' | 'html' = 'js', size = 20) {
  const t = richTexture(ctx.scene, '```\n' + code + '\n```', { width: w, size, lang });
  ctx.scene.add.image(x, y, t.key).setOrigin(0, 0);
  return t.h;
}

function msgBox(ctx: GameCtx, y: number, ok: boolean, md: string, next: { label: string; fn: () => void } | null) {
  const { scene } = ctx;
  const t = richTexture(scene, md, { width: ctx.w - 220, size: 18, color: ok ? '#2d5a1b' : '#8a2418' });
  const h = Math.max(70, t.h + 30);
  const g = scene.add.graphics(); drawFrame(g, ctx.x, y, ctx.w, h, ok ? FRAMES.right : FRAMES.wrong);
  scene.add.image(ctx.x + 20, y + (h - t.h) / 2, t.key).setOrigin(0, 0);
  if (next) new Button(scene, ctx.x + ctx.w - 190, y + (h - 50) / 2, next.label, next.fn, { variant: 'gold', w: 174, h: 50, icon: 'next', size: 18, id: 'game.next' });
  return h;
}

function optionCards(ctx: GameCtx, y: number, labels: string[], state: (i: number) => 'normal' | 'right' | 'wrong' | 'sel' | 'off', onPick: (i: number) => void, code = false, cols = 2) {
  const { scene } = ctx;
  const gap = 10, cw = (ctx.w - gap * (cols - 1)) / cols;
  const hs = labels.map((l) => (code ? richTexture(scene, '`' + l + '`', { width: cw - 70, size: 20, codeBg: 'rgba(0,0,0,0)' }) : richTexture(scene, l, { width: cw - 70, size: 20 })));
  let rowY = y;
  for (let r = 0; r < Math.ceil(labels.length / cols); r++) {
    const rh = Math.max(...hs.slice(r * cols, r * cols + cols).map((t) => t.h)) + 30;
    for (let k = r * cols; k < Math.min(labels.length, r * cols + cols); k++) {
      const card = new Card(scene, ctx.x + (k % cols) * (cw + gap), rowY, cw, rh, () => onPick(k), { id: `gopt.${k}`, label: labels[k] });
      const st = state(k);
      if (st === 'off') card.setState2('off').setEnabled(false).setAlpha(0.4);
      else card.setState2(st);
      card.add([text(scene, 24, rh / 2 - 11, String(k + 1), 17, C.inkSoft), scene.add.image(52, (rh - hs[k].h) / 2 - 2, hs[k].key).setOrigin(0, 0)]);
    }
    rowY += rh + gap;
  }
  return rowY - y;
}

// ---------------- Rune Link ----------------
function runeLink(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.rounds) {
    const pairs = ctx.pools.pairs;
    const per = 4;
    const n = Math.min(ctx.stop ? 3 : 4, Math.max(1, Math.floor(pairs.length / per)));
    const pick = shuffle(pairs).slice(0, n * per);
    const out: Pair[][] = [];
    for (let i = 0; i < pick.length; i += per) out.push(pick.slice(i, i + per));
    if (out.length > 1 && out[out.length - 1].length < 3) out[out.length - 2].push(...out.pop()!);
    Object.assign(gs, { rounds: out, round: 0, links: {}, score: 0, order: null });
  }
  const rounds = gs.rounds as Pair[][];
  const max = rounds.reduce((a, r) => a + r.length, 0);
  const cur = rounds[gs.round as number] ?? [];
  if (!gs.order) gs.order = { l: shuffle(cur.map((_, i) => i)), r: shuffle(cur.map((_, i) => i)) };
  const order = gs.order as { l: number[]; r: number[] };
  const links = gs.links as Record<number, number>;
  const timer = ctx.timer(20 + max * 4, () => ctx.end(gs.score as number, max));
  let y = ctx.y + 44;
  y = chips(ctx, y, [`Round ${Math.min((gs.round as number) + 1, rounds.length)}/${rounds.length}`, `Runes linked: ${gs.score}/${max}`]);
  const gapW = ctx.w < 520 ? 40 : 80;
  const cw = (ctx.w - gapW) / 2;
  const rowH = Math.max(60, ...cur.map((p) => Math.max(richTexture(scene, p.a, { width: cw - 44, size: 19 }).h, richTexture(scene, p.b, { width: cw - 44, size: 19 }).h) + 28));
  const pegs: { l: Record<number, [number, number]>; r: Record<number, [number, number]> } = { l: {}, r: {} };
  const cards = new Map<string, Card>();
  const ropes = scene.add.graphics().setDepth(5);
  let sel = gs.sel as { side: 'l' | 'r'; id: number } | undefined;
  const make = (side: 'l' | 'r', id: number, k: number) => {
    const cx = side === 'l' ? ctx.x : ctx.x + cw + gapW, cy = y + k * (rowH + 10);
    const t = richTexture(scene, side === 'l' ? cur[id].a : cur[id].b, { width: cw - 44, size: 19 });
    const card = new Card(scene, cx, cy, cw, rowH, () => tap(side, id), { id: `rune.${side}.${k}`, label: side === 'l' ? cur[id].a : cur[id].b });
    card.add(scene.add.image(side === 'l' ? 14 : 30, (rowH - t.h) / 2 - 2, t.key).setOrigin(0, 0));
    const px = side === 'l' ? cw - 4 : 4;
    const peg = scene.add.graphics(); peg.fillStyle(0x2b1a12).fillRect(px - 9, rowH / 2 - 9, 18, 18); peg.fillStyle(0xfff4dc).fillRect(px - 6, rowH / 2 - 6, 12, 12);
    card.add(peg);
    card.setData('side', side); card.setData('id', id);
    (side === 'l' ? pegs.l : pegs.r)[id] = [cx + px, cy + rowH / 2];
    cards.set(side + id, card);
    const linked = side === 'l' ? links[id] !== undefined : Object.values(links).includes(id);
    if (linked) card.setState2('right').setEnabled(false);
    else if (sel && sel.side === side && sel.id === id) card.setState2('sel');
  };
  order.l.forEach((id, k) => make('l', id, k));
  order.r.forEach((id, k) => make('r', id, k));
  const draw = (drag?: { from: [number, number]; to: [number, number] }) => {
    ropes.clear();
    for (const [l, r] of Object.entries(links)) { const a = pegs.l[Number(l)], b = pegs.r[r]; ropes.lineStyle(10, 0x2b1a12).lineBetween(a[0], a[1], b[0], b[1]); ropes.lineStyle(5, 0x6cc04a).lineBetween(a[0], a[1], b[0], b[1]); }
    if (drag) { ropes.lineStyle(10, 0x2b1a12).lineBetween(drag.from[0], drag.from[1], drag.to[0], drag.to[1]); ropes.lineStyle(5, 0xfff4dc).lineBetween(drag.from[0], drag.from[1], drag.to[0], drag.to[1]); }
  };
  draw();
  const got = (l: number) => {
    links[l] = l;
    gs.score = (gs.score as number) + 1;
    delete gs.sel;
    play('coin');
    if (Object.keys(links).length === cur.length) {
      ctx.later(450, () => {
        if ((gs.round as number) + 1 >= rounds.length) ctx.end(gs.score as number, max);
        else { gs.round = (gs.round as number) + 1; gs.links = {}; gs.order = null; play('unlock'); ctx.rebuild(); }
      });
    }
    ctx.rebuild();
  };
  const attempt = (l: number, r: number) => {
    if (links[l] !== undefined || Object.values(links).includes(r)) return;
    if (l === r) { got(l); return; }
    play('wrong');
    timer.add(-3);
    const a = cards.get('l' + l), b = cards.get('r' + r);
    for (const cd of [a, b]) { cd?.setState2('wrong'); if (cd) scene.tweens.add({ targets: cd, x: cd.x + 6, duration: 60, yoyo: true, repeat: 2 }); }
    delete gs.sel; sel = undefined;
    ctx.later(450, () => { a?.active && a.setState2('normal'); b?.active && b.setState2('normal'); });
  };
  const tap = (side: 'l' | 'r', id: number) => {
    if (sel && sel.side !== side) { const l = side === 'l' ? id : sel.id, r = side === 'r' ? id : sel.id; attempt(l, r); return; }
    gs.sel = sel = { side, id };
    play('click');
    for (const [k, cd] of cards) { const s2 = k[0], i2 = Number(k.slice(1)); const linked = s2 === 'l' ? links[i2] !== undefined : Object.values(links).includes(i2); if (!linked) cd.setState2(s2 === side && i2 === id ? 'sel' : 'normal'); }
  };
  // drag a rope
  let drag: { side: 'l' | 'r'; id: number } | null = null;
  let moved = false;
  scene.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
    const cd = over.map((o) => o.parentContainer as Card | null).find((q) => q?.getData?.('side'));
    drag = cd ? { side: cd.getData('side'), id: cd.getData('id') } : null; moved = false;
  });
  scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
    if (!drag || !p.isDown) return;
    const from = drag.side === 'l' ? pegs.l[drag.id] : pegs.r[drag.id];
    if (Math.hypot(p.x - from[0], p.y - from[1]) > 40) moved = true;
    if (moved) draw({ from, to: [p.x, p.y] });
  });
  scene.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
    const d = drag; drag = null;
    if (!d || !moved) return;
    draw();
    const cd = over.map((o) => o.parentContainer as Card | null).find((q) => q?.getData?.('side'));
    if (cd && cd.getData('side') !== d.side) { const l = d.side === 'l' ? d.id : cd.getData('id'), r = d.side === 'r' ? d.id : cd.getData('id'); attempt(l, r); }
  });
  const bottom = y + cur.length * (rowH + 10);
  text(scene, ctx.x + ctx.w / 2, bottom + 6, 'Drag a rope from a rune to its meaning, or tap one and then the other. A wrong link costs 3 seconds.', 16, C.inkSoft, { align: 'center', wordWrap: { width: ctx.w } }).setOrigin(0.5, 0);
  ctx.items({
    bulb: () => { const l = order.l.find((id) => links[id] === undefined); if (l === undefined) return false; got(l); return true; },
    torch: () => { timer.add(15); return true; },
  });
}

// ---------------- Memory Crypt ----------------
function memoryCrypt(ctx: GameCtx) {
  const { scene, gs } = ctx;
  const n = Math.min(ctx.stop ? 6 : 8, ctx.pools.pairs.length);
  if (!gs.cards) {
    const pick = shuffle(ctx.pools.pairs.filter((p) => p.a.length <= 24 && p.b.length <= 24)).slice(0, n);
    Object.assign(gs, { cards: shuffle(pick.flatMap((p, i) => [{ pid: i, side: 'a', text: p.a }, { pid: i, side: 'b', text: p.b }])), open: [], found: [], misses: 0, peek: false });
  }
  const cards = gs.cards as { pid: number; side: string; text: string }[];
  const open = gs.open as number[], found = gs.found as number[];
  let y = chips(ctx, ctx.y, [`Pairs found: ${found.length}/${n}`, `Misses: ${gs.misses}`]);
  const cols = cards.length > 12 ? 4 : ctx.w < 520 ? 3 : 4;
  const gap = 10, cw = (ctx.w - gap * (cols - 1)) / cols;
  const ch = Math.min(cw * 0.62, (ctx.h - (y - ctx.y) - 60) / Math.ceil(cards.length / cols) - gap);
  const finish = () => {
    if (found.length < n || gs.over) return;
    gs.over = true;
    const m = gs.misses as number;
    const stars = m <= Math.ceil(n / 2) ? 3 : m <= n + 2 ? 2 : 1;
    ctx.later(600, () => ctx.end(n, n, stars));
  };
  cards.forEach((cd, i) => {
    const up = !!gs.peek || open.includes(i) || found.includes(cd.pid);
    const x = ctx.x + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap);
    const card = new Card(scene, x, yy, cw, ch, () => flip(i), { id: `mem.${i}`, label: up ? cd.text : 'Hidden tile', frame: up ? (cd.side === 'a' ? 'slate' : 'paper') : 'stone' });
    card.setData('pid', cd.pid);
    if (found.includes(cd.pid)) card.setState2('right');
    if (up) {
      const t = richTexture(scene, /[<>{}()=.#:;]/.test(cd.text) ? '`' + cd.text + '`' : cd.text, { width: cw - 20, size: 17, align: 'center', color: cd.side === 'a' && !found.includes(cd.pid) ? '#f3e9d2' : C.ink, codeBg: 'rgba(0,0,0,0)', codeColor: cd.side === 'a' && !found.includes(cd.pid) ? '#ffd479' : C.ink });
      card.add(scene.add.image(cw / 2, ch / 2, t.key).setOrigin(0.5));
    } else card.add(scene.add.text(cw / 2, ch / 2, '?', { fontFamily: "'Jacquard 12'", fontSize: '44px', color: '#6c6875' }).setOrigin(0.5));
  });
  const flip = (i: number) => {
    const cd = cards[i];
    if (gs.peek || gs.over || open.includes(i) || found.includes(cd.pid) || open.length >= 2) return;
    play('flip');
    open.push(i);
    ctx.rebuild();
    if (open.length === 2) {
      const [a, b] = open.map((k) => cards[k]);
      if (a.pid === b.pid) ctx.later(350, () => { found.push(a.pid); gs.open = []; play('coin'); finish(); ctx.rebuild(); });
      else { gs.misses = (gs.misses as number) + 1; ctx.later(900, () => { gs.open = []; play('bump'); ctx.rebuild(); }); }
    }
  };
  y += Math.ceil(cards.length / cols) * (ch + gap);
  text(scene, ctx.x + ctx.w / 2, y + 4, 'Each term has a partner: its meaning. Fewer misses, more stars.', 16, C.inkSoft).setOrigin(0.5, 0);
  ctx.items({
    bulb: () => { const pid = cards.find((c) => !found.includes(c.pid))?.pid; if (pid === undefined || gs.over) return false; found.push(pid); gs.open = []; finish(); return true; },
    torch: () => { if (gs.peek || gs.over) return false; gs.peek = true; ctx.later(1800, () => { gs.peek = false; ctx.rebuild(); }); return true; },
  });
}

// ---------------- Torch Run ----------------
function torchRun(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.qs) {
    const qs = shuffle(ctx.pools.choices).slice(0, ctx.stop ? 8 : 12);
    Object.assign(gs, { qs, i: 0, score: 0, picked: null, removed: [], order: null });
  }
  const qs = gs.qs as Choice[];
  const max = qs.length;
  const q = qs[gs.i as number];
  if (!gs.order) gs.order = q.options[0] === 'True' ? [0, 1] : shuffle(q.options.map((_, k) => k));
  const order = gs.order as number[];
  const removed = gs.removed as number[];
  const picked = gs.picked as number | null;
  const timer = ctx.timer(40, () => ctx.end(gs.score as number, max));
  let y = chips(ctx, ctx.y + 44, [`Question ${(gs.i as number) + 1}/${max}`, `Right: ${gs.score}`]);
  const qt = richTexture(scene, q.q, { width: ctx.w - 40, size: 22, bold: true });
  const code = q.code ? richTexture(scene, '```\n' + q.code + '\n```', { width: ctx.w - 40, size: 19, lang: q.lang ?? 'js' }) : null;
  const ph = qt.h + (code ? code.h + 14 : 0) + 30;
  const g = scene.add.graphics(); drawFrame(g, ctx.x, y, ctx.w, ph, FRAMES.panel);
  scene.add.image(ctx.x + 20, y + 14, qt.key).setOrigin(0, 0);
  if (code) scene.add.image(ctx.x + 20, y + 24 + qt.h, code.key).setOrigin(0, 0);
  y += ph + 12;
  const codeOpts = q.codeOptions ?? q.options.every((o) => /[<>{}();=]/.test(o));
  const labels = order.map((k) => q.options[k]);
  optionCards(ctx, y, labels, (i) => { const k = order[i]; if (removed.includes(k)) return 'off'; if (picked !== null && k === q.answer) return 'right'; if (picked === k) return 'wrong'; return 'normal'; }, (i) => pick(order[i]), codeOpts, q.options.length === 2 || q.options.every((o) => o.length < 18) ? 2 : 1);
  // mark the right option for automated tests
  const ri = order.indexOf(q.answer);
  UI.get(`gopt.${ri}`)?.obj.setData?.('right', true);
  scene.registry.set('torchrun:right', ri);
  if (picked !== null) timer.pause(true); else timer.pause(false);
  const pick = (k: number) => {
    if (gs.picked !== null) return;
    gs.picked = k;
    const ok = k === q.answer;
    if (ok) { gs.score = (gs.score as number) + 1; timer.add(4); play('correct'); } else { timer.add(-4); play('wrong'); }
    ctx.rebuild();
    ctx.later(ok ? 650 : 1500, () => {
      if ((gs.i as number) + 1 >= max) { ctx.end(gs.score as number, max); return; }
      gs.i = (gs.i as number) + 1; gs.picked = null; gs.removed = []; gs.order = null;
      ctx.rebuild();
    });
  };
  ctx.items({
    bulb: () => { if (picked !== null || removed.length || q.options.length < 3) return false; const wrong = shuffle(q.options.map((_, k) => k).filter((k) => k !== q.answer)); gs.removed = wrong.slice(0, Math.ceil(wrong.length / 2)); return true; },
    torch: () => { timer.add(10); return true; },
  });
}

// ---------------- Bug Hunt ----------------
function bugHunt(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.list) Object.assign(gs, { list: shuffle(bugsFrom(ctx.pools, !ctx.stop)).slice(0, ctx.stop ? 6 : 10), round: 0, score: 0, picked: null, clean: [], timedOut: false });
  const list = gs.list as BugRound[];
  const bug = list[gs.round as number];
  const lines = bug.code.split('\n');
  const picked = gs.picked as number | null;
  const clean = gs.clean as number[];
  const revealed = picked !== null || !!gs.timedOut;
  const timer = ctx.timer(20, () => { gs.timedOut = true; play('fail'); ctx.rebuild(); });
  timer.pause(revealed);
  let y = chips(ctx, ctx.y + 44, [`Bug ${(gs.round as number) + 1}/${list.length}`, `Squashed: ${gs.score}`]);
  const size = 24, lh = 38;
  const g = scene.add.graphics(); drawFrame(g, ctx.x, y, ctx.w, lines.length * lh + 24, FRAMES.slate);
  lines.forEach((l, i) => {
    const n = i + 1, ry = y + 12 + i * lh;
    const hit = revealed && (n === bug.line || n === bug.also);
    const bg = scene.add.graphics();
    if (hit) bg.fillStyle(0x5aa83c, 0.55).fillRect(ctx.x + 10, ry, ctx.w - 20, lh);
    else if (picked === n) bg.fillStyle(0xd2473c, 0.55).fillRect(ctx.x + 10, ry, ctx.w - 20, lh);
    text(scene, ctx.x + 18, ry + 8, String(n), 19, '#8a7058', { fontFamily: CODE_FONT });
    let xx = ctx.x + 54;
    for (const t of tokenLines(l, bug.lang ?? 'js')[0] ?? []) { const tt = scene.add.text(xx, ry + 6, t.text, { fontFamily: CODE_FONT, fontSize: `${size}px`, color: TOKEN_COLORS[t.cls] ?? '#f3e9d2' }); if (clean.includes(n)) tt.setAlpha(0.3); xx += tt.width; }
    const z = scene.add.zone(ctx.x + 10, ry, ctx.w - 20, lh).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => pick(n));
    UI.reg(scene, `bug.${n}`, z, `Line ${n}`, () => pick(n));
    if (n === bug.line) z.setData('bug', true);
  });
  y += lines.length * lh + 36;
  const pick = (n: number) => {
    if (revealed || clean.includes(n)) return;
    gs.picked = n;
    if (n === bug.line || n === bug.also) { gs.score = (gs.score as number) + 1; play('hit'); } else play('bump');
    ctx.rebuild();
  };
  scene.registry.set('bughunt:line', bug.line);
  if (revealed) {
    const ok = picked !== null && (picked === bug.line || picked === bug.also);
    msgBox(ctx, y, ok, `**${ok ? 'Squashed it!' : gs.timedOut && picked === null ? 'The torch went out...' : `Not that one. The bug was on line ${bug.line}.`}**\n${bug.why}`, {
      label: (gs.round as number) + 1 >= list.length ? 'See results' : 'Next bug',
      fn: () => { if ((gs.round as number) + 1 >= list.length) { ctx.end(gs.score as number, list.length); return; } gs.round = (gs.round as number) + 1; gs.picked = null; gs.clean = []; gs.timedOut = false; timer.set(20); ctx.rebuild(); },
    });
  }
  ctx.items({
    bulb: () => { if (revealed || clean.length) return false; const others = lines.map((_, i) => i + 1).filter((n) => n !== bug.line && n !== bug.also && lines[n - 1].trim()); if (others.length < 2) return false; gs.clean = shuffle(others).slice(0, Math.ceil(others.length / 2)); return true; },
    torch: () => { if (revealed) return false; timer.add(10); return true; },
  });
}

// ---------------- Selector Archery ----------------
const SPR: Record<string, string> = { goblin: 'goblin', gem: 'gem', coin: 'coin', key: 'key', scroll: 'scroll', heart: 'heart', skull: 'skull' };
function archery(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.rounds) Object.assign(gs, { rounds: archeryRounds(ctx.stop, ctx.unitIndex), round: 0, score: 0, tries: 0, arrows: 3, sel: '', msg: null, hits: [], cleared: false });
  const rounds = gs.rounds as Round[];
  const r = rounds[gs.round as number];
  const root = document.createElement('div');
  root.innerHTML = r.html;
  const all = Array.from(root.querySelectorAll('*'));
  const hits = gs.hits as number[];
  let y = chips(ctx, ctx.y, [`Round ${(gs.round as number) + 1}/${rounds.length}`, `Arrows: ${Math.max(0, (gs.arrows as number) - (gs.tries as number))}`, `Score: ${gs.score}`]);
  const narrow = ctx.w < 900;
  const stageW = narrow ? ctx.w : ctx.w - 340, stageH = 280;
  // stage: sky + landscape
  const sg = scene.add.graphics(); sg.fillStyle(0x2b1a12).fillRect(ctx.x, y, stageW, stageH); sg.fillStyle(0xf0d8e8).fillRect(ctx.x + 6, y + 6, stageW - 12, stageH - 12);
  scene.add.tileSprite(ctx.x + 6, y + stageH - 6 - 150, stageW - 12, 150, paintedTex(scene, paintBand('css'))).setOrigin(0, 0).setTileScale(150 / 72 * 1);
  // lay out the elements left to right, containers as boxes
  const place = (el: Element, x: number, base: number): number => {
    const tag = el.tagName.toLowerCase();
    const label = `<${tag}${el.id ? ` id="${el.id}"` : ''}${el.className ? ` class="${el.className}"` : ''}>`;
    const idx = all.indexOf(el);
    const target = el.hasAttribute('data-t');
    if (SPR[tag]) {
      const lt = scene.add.text(0, 0, label, { fontFamily: CODE_FONT, fontSize: '17px', color: '#fff7e6', backgroundColor: '#1c110acc', padding: { x: 4, y: 1 } });
      const w = Math.max(64, lt.width + 8);
      if (target) { const gl = scene.add.ellipse(x + w / 2, base - 40, 70, 70, 0xf6d98a, 0.55); scene.tweens.add({ targets: gl, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 }); }
      const sp = sprite(scene, x + w / 2 - 28, base - 70, SPR[tag], 56);
      if (el.classList.contains('gold')) sp.setTint(0xffd23f);
      if (el.classList.contains('cursed')) sp.setTint(0x8f55dd);
      lt.setPosition(x + (w - lt.width) / 2, base - 14);
      if (hits.includes(idx)) scene.add.image(x + w - 14, base - 66, iconTex(scene, 'sword', target ? '#8fd14f' : '#ff6b5a', 2));
      return w + 8;
    }
    // container
    const kids = Array.from(el.children);
    let cx = x + 10;
    const parts: (() => void)[] = [];
    const innerStart = cx;
    for (const k of kids) cx += place(k, cx, base - 10);
    const w = Math.max(90, cx - x + 4);
    const bg = scene.add.graphics().setDepth(-1);
    bg.fillStyle(tag === 'chest' ? 0x7a4826 : 0x281a0e, 0.75).fillRect(x, base - 110, w, 118);
    bg.lineStyle(4, 0x3a2414).strokeRect(x, base - 110, w, 118);
    scene.add.text(x + 6, base - 108, label, { fontFamily: CODE_FONT, fontSize: '17px', color: '#ffd479' });
    if (hits.includes(idx)) scene.add.image(x + w - 16, base - 106, iconTex(scene, 'sword', target ? '#8fd14f' : '#ff6b5a', 2));
    void parts; void innerStart;
    return w + 10;
  };
  // measure total width first (approximate) then centre
  let total = 0;
  for (const el of Array.from(root.children)) total += el.children.length ? 100 + el.children.length * 72 : 72;
  let px = ctx.x + Math.max(12, (stageW - total) / 2);
  for (const el of Array.from(root.children)) px += place(el, px, y + stageH - 40);
  // courtyard HTML + tip
  const sideX = narrow ? ctx.x : ctx.x + stageW + 12, sideY = narrow ? y + stageH + 10 : y;
  const html = r.html.replace(/ data-t/g, '').replace(/></g, '>\n<');
  const codeT = richTexture(scene, '```\n' + html + '\n```', { width: (narrow ? ctx.w : 328) - 24, size: 16, lang: 'html' });
  const tip = richTexture(scene, `**Tip:** ${r.concept}`, { width: (narrow ? ctx.w : 328) - 24, size: 16 });
  const sh = 40 + codeT.h + tip.h + 20;
  const pg = scene.add.graphics(); drawFrame(pg, sideX, sideY, narrow ? ctx.w : 328, sh, FRAMES.panel);
  text(scene, sideX + 12, sideY + 10, "The courtyard's HTML", 18, C.ink, { fontStyle: 'bold' });
  scene.add.image(sideX + 12, sideY + 36, codeT.key).setOrigin(0, 0);
  scene.add.image(sideX + 12, sideY + 42 + codeT.h, tip.key).setOrigin(0, 0);
  y = (narrow ? sideY + sh : y + Math.max(stageH, sh)) + 12;
  // the selector input
  const fw = ctx.w;
  const fg = scene.add.graphics(); drawFrame(fg, ctx.x, y, fw, 76, FRAMES.panel);
  text(scene, ctx.x + 16, y + 24, 'Selector', 20, C.ink, { fontStyle: 'bold' });
  const inp = domInput(scene, ctx.x + 110, y + 16, fw - 110 - 200, 44, { value: gs.sel as string, placeholder: 'e.g. goblin', size: 24, code: true, id: 'archery.input', onInput: (v) => { gs.sel = v; }, onEnter: () => shoot() });
  inp.el.dataset.answer = r.answer;
  if (gs.cleared) inp.el.disabled = true; else setTimeout(() => inp.el.focus(), 60);
  const shoot = () => {
    if (gs.cleared) return;
    let found: Element[] = [];
    try { found = Array.from(root.querySelectorAll(gs.sel as string)); } catch { gs.msg = { ok: false, text: 'That selector is not valid CSS. Check for typos.' }; play('error'); ctx.rebuild(); return; }
    play('arrow');
    gs.hits = found.map((f) => all.indexOf(f));
    const targets = Array.from(root.querySelectorAll('[data-t]'));
    const ok = found.length === targets.length && targets.every((t) => found.includes(t));
    ctx.later(160, () => play(ok ? 'hit' : 'thunk'));
    if (ok) { gs.msg = { ok: true, text: 'Bullseye! Every target hit, nothing else.' }; gs.cleared = true; }
    else {
      gs.tries = (gs.tries as number) + 1;
      const wrong = found.filter((f) => !targets.includes(f)).length, missed = targets.filter((t) => !found.includes(t)).length;
      const left = (gs.arrows as number) - (gs.tries as number);
      gs.msg = { ok: false, text: `${missed ? tn(missed, 'Missed {n} target.', 'Missed {n} targets.') + ' ' : ''}${wrong ? tn(wrong, 'Hit {n} innocent thing!', 'Hit {n} innocent things!') + ' ' : ''}${left <= 0 ? t('Out of arrows. One answer: `{a}`', { a: r.answer }) : tn(left, '{n} arrow left.', '{n} arrows left.')}` };
      if (left <= 0) gs.cleared = true;
    }
    ctx.rebuild();
  };
  const nextRound = () => {
    const got = (gs.msg as { ok: boolean } | null)?.ok ?? false;
    gs.score = (gs.score as number) + (got ? 1 : 0);
    if ((gs.round as number) + 1 >= rounds.length) { ctx.end(gs.score as number, rounds.length); return; }
    Object.assign(gs, { round: (gs.round as number) + 1, tries: 0, arrows: 3, sel: '', msg: null, hits: [], cleared: false });
    ctx.rebuild();
  };
  if (!gs.cleared) new Button(scene, ctx.x + fw - 186, y + 14, 'Loose arrow', shoot, { variant: 'red', icon: 'bow', w: 172, h: 48, size: 18, id: 'archery.shoot' });
  else new Button(scene, ctx.x + fw - 186, y + 14, 'Next round', nextRound, { variant: 'gold', icon: 'next', w: 172, h: 48, size: 18, id: 'archery.next' });
  y += 88;
  const msg = gs.msg as { ok: boolean; text: string } | null;
  if (msg) msgBox(ctx, y, msg.ok, msg.text, null);
  ctx.items({
    bulb: () => { if (gs.cleared || gs.sel === r.answer) return false; gs.sel = r.answer; return true; },
    torch: () => { if (gs.cleared) return false; gs.arrows = (gs.arrows as number) + 1; return true; },
  });
}

// ---------------- Archive Hunt ----------------
function archive(ctx: GameCtx) {
  const { scene, gs } = ctx;
  const rounds = ctx.stop ? 6 : 8;
  const knows = (w: string) => !ctx.stop || new RegExp('\\b' + w + '\\b').test(ctx.pools.corpus);
  if (!gs.q) Object.assign(gs, { round: 0, q: makeQuery(0, knows), sel: [], locked: [], checked: null, score: 0, second: false });
  const q = gs.q as Query;
  const sel = gs.sel as number[], locked = gs.locked as number[];
  const checked = gs.checked as boolean | null;
  let y = chips(ctx, ctx.y, [`Scroll ${(gs.round as number) + 1}/${rounds}`, `Right: ${gs.score}`]);
  text(scene, ctx.x, y, "Mira's request: which rows does this query return?", 18, C.ink, { fontStyle: 'bold' });
  y += 26;
  y += codeBoxAt(ctx, ctx.x, y, ctx.w, q.sql, 'sql', 20) + 12;
  // the table
  const colW = ctx.w / COLS.length;
  const rh = 38;
  const tg = scene.add.graphics();
  tg.fillStyle(0x2b1a12).fillRect(ctx.x - 3, y - 3, ctx.w + 6, rh * (KNIGHTS.length + 1) + 6);
  tg.fillStyle(N('#fdeec4')).fillRect(ctx.x, y, ctx.w, rh);
  COLS.forEach((c, i) => text(scene, ctx.x + i * colW + 10, y + 8, c, 20, C.ink, { fontFamily: CODE_FONT, fontStyle: 'bold' }));
  KNIGHTS.forEach((k, ri) => {
    const ry = y + (ri + 1) * rh;
    const picked = sel.includes(k.id), want = q.ids.includes(k.id);
    let col = 0xffffff;
    if (checked !== null) col = want ? (picked ? 0xd8f1c8 : 0xfff3c4) : picked ? 0xfbd7d2 : 0xffffff;
    else if (picked) col = 0xd6ebfb;
    const rowG = scene.add.graphics();
    rowG.fillStyle(col).fillRect(ctx.x, ry, ctx.w, rh - 2);
    if (picked || (checked !== null && want)) rowG.fillStyle(checked !== null ? (want ? (picked ? 0x5aa83c : 0xe7a72c) : 0xd2473c) : 0x3f8fd6).fillRect(ctx.x, ry, 6, rh - 2);
    COLS.forEach((c, i) => text(scene, ctx.x + i * colW + 10, ry + 8, String(k[c]), 20, C.ink, { fontFamily: CODE_FONT }));
    const z = scene.add.zone(ctx.x, ry, ctx.w, rh).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => toggle(k.id));
    if (want) z.setData('want', true);
    UI.reg(scene, `row.${k.id}`, z, `${k.name} (row ${k.id})`, () => toggle(k.id));
  });
  scene.registry.set('archive:want', q.ids);
  y += rh * (KNIGHTS.length + 1) + 12;
  const toggle = (id: number) => { if (checked !== null || locked.includes(id)) return; play('click'); gs.sel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]; ctx.rebuild(); };
  const cast = () => {
    const ok = sel.length === q.ids.length && q.ids.every((id) => sel.includes(id));
    gs.checked = ok;
    if (ok) { gs.score = (gs.score as number) + 1; play('correct'); } else play('wrong');
    ctx.rebuild();
  };
  const next = () => {
    if ((gs.round as number) + 1 >= rounds) { ctx.end(gs.score as number, rounds); return; }
    Object.assign(gs, { round: (gs.round as number) + 1, q: makeQuery((gs.round as number) + 1, knows), sel: [], locked: [], checked: null, second: false });
    ctx.rebuild();
  };
  if (checked === null) {
    text(scene, ctx.x, y + 14, `Tap the rows to pick them (${sel.length} picked).`, 17, C.inkSoft);
    new Button(scene, ctx.x + ctx.w - 200, y, 'Cast query', cast, { variant: 'blue', icon: 'database', w: 200, h: 52, id: 'archive.cast', disabled: !sel.length });
  } else msgBox(ctx, y, checked, checked ? '**Exactly right!** Mira files the scroll.' : `**Not quite:** it returns ${q.ids.map((id) => KNIGHTS[id - 1].name).join(', ')}.${q.ordered ? '\nORDER BY sorts the rows first, then LIMIT keeps only the first ones.' : ''}`, { label: (gs.round as number) + 1 >= rounds ? 'See results' : 'Next scroll', fn: next });
  ctx.items({
    bulb: () => {
      if (checked !== null) return false;
      const wrong = sel.find((id) => !q.ids.includes(id));
      if (wrong !== undefined) { gs.sel = sel.filter((x) => x !== wrong); return true; }
      const miss = q.ids.find((id) => !sel.includes(id));
      if (miss === undefined) return false;
      gs.sel = [...sel, miss]; gs.locked = [...locked, miss];
      return true;
    },
    torch: () => { if (checked !== false || gs.second) return false; gs.checked = null; gs.second = true; return true; },
  });
}

// ---------------- Loop Bridge ----------------
function loopBridge(ctx: GameCtx) {
  const { scene, gs } = ctx;
  const rounds = 6;
  const knows = (w: string) => !ctx.stop || new RegExp('\\b' + w + '\\b').test(ctx.pools.corpus);
  if (!gs.loop) { const l = makeLoop(0, knows); Object.assign(gs, { round: 0, loop: l, opts: optionsFor(l.count), removed: [], picked: null, laid: 0, phase: 'ask', score: 0, retried: false }); }
  const loop = gs.loop as LoopRound;
  const opts = gs.opts as number[];
  const picked = gs.picked as number | null;
  const phase = gs.phase as 'ask' | 'build' | 'cross' | 'done';
  const gap = loop.count;
  const tiles = Math.max(gap, picked ?? 0, 3);
  const ok = picked === loop.count;
  const short = picked !== null && picked < gap;
  let y = chips(ctx, ctx.y, [`Bridge ${(gs.round as number) + 1}/${rounds}`, `Crossed: ${gs.score}`]);
  text(scene, ctx.x, y, 'How many planks does this loop lay?', 18, C.ink, { fontStyle: 'bold' });
  y += 26;
  y += codeBoxAt(ctx, ctx.x, y, ctx.w, loop.code, 'js', 20) + 12;
  // the bridge
  const n = tiles + 2, tw = ctx.w / n, sh = 130;
  const g = scene.add.graphics();
  g.fillStyle(0x2b1a12).fillRect(ctx.x - 4, y - 4, ctx.w + 8, sh + 8);
  g.fillStyle(0xbfe3f5).fillRect(ctx.x, y, ctx.w, sh);
  const bankY = y + sh - 60;
  const land = (i: number) => { g.fillStyle(0x6cb04a).fillRect(ctx.x + i * tw, bankY, tw + 1, 60); g.fillStyle(0x84c95c).fillRect(ctx.x + i * tw, bankY, tw + 1, 6); g.fillStyle(0x8a6a3e).fillRect(ctx.x + i * tw, bankY + 30, tw + 1, 30); };
  land(0); land(n - 1);
  for (let i = 0; i < tiles; i++) {
    const tx = ctx.x + (i + 1) * tw;
    if (i < gap) { g.fillStyle(0x3f7fc9).fillRect(tx, y + sh - 36, tw + 1, 36); g.fillStyle(0x9fd8f5).fillRect(tx, y + sh - 36, tw + 1, 4); }
    else land(i + 1);
    if (i < (gs.laid as number)) { g.fillStyle(0x4a2c18).fillRect(tx + 1, bankY - 4, tw - 2, 16); g.fillStyle(i >= gap ? 0xc9543a : 0xb07a44).fillRect(tx + 4, bankY - 1, tw - 8, 10); }
  }
  scene.add.image(ctx.x + (n - 0.5) * tw, bankY - 20, spriteTex(scene, 'flag')).setScale(2.5);
  const prof = useGame.getState().profile!;
  const heroAt = phase === 'cross' || phase === 'done' ? (short ? (gs.laid as number) + 0.5 : n - 1) : 0;
  const hero = scene.add.image(ctx.x + 0.5 * tw, bankY - 24, spriteTex(scene, prof.avatar, prof.tunic)).setScale(3);
  if (phase === 'cross') {
    let k = 0;
    const frames = ANIMS.heroWalk(prof.avatar);
    const ev = scene.time.addEvent({ delay: 110, loop: true, callback: () => hero.setTexture(spriteTex(scene, frames[++k % frames.length], prof.tunic)) });
    scene.tweens.add({ targets: hero, x: ctx.x + (heroAt + 0.5) * tw, duration: 1200, onComplete: () => { ev.remove(); if (short) scene.tweens.add({ targets: hero, y: y + sh + 10, alpha: 0.5, duration: 400 }); } });
  } else { hero.x = ctx.x + (heroAt + 0.5) * tw; if (phase === 'done' && short) hero.setY(y + sh - 10).setAlpha(0.6); }
  y += sh + 16;
  if (phase === 'ask') {
    optionCards(ctx, y, opts.map((o) => tn(o, '{n} plank', '{n} planks')), (i) => ((gs.removed as number[]).includes(opts[i]) ? 'off' : 'normal'), (i) => {
      gs.picked = opts[i]; gs.laid = 0; gs.phase = 'build'; play('click'); ctx.rebuild();
    });
    const ri = opts.indexOf(loop.count);
    scene.registry.set('loop:right', ri);
  } else if (phase === 'build') {
    ctx.later(260, () => {
      if ((gs.laid as number) < (picked ?? 0)) { gs.laid = (gs.laid as number) + 1; play('step'); }
      else gs.phase = 'cross';
      ctx.rebuild();
    });
  } else if (phase === 'cross') {
    ctx.later(1300, () => { gs.phase = 'done'; if (ok) { gs.score = (gs.score as number) + 1; play('correct'); } else play('splash'); ctx.rebuild(); });
  } else {
    msgBox(ctx, y, ok, ok ? tn(loop.count, '**Across!** The loop ran {n} time.', '**Across!** The loop ran {n} times.') : short ? `**Splash!** Too few planks: the loop runs ${loop.count} times.` : `**Too many planks!** The loop runs only ${loop.count} times.`, {
      label: (gs.round as number) + 1 >= rounds ? 'See results' : 'Next bridge',
      fn: () => {
        if ((gs.round as number) + 1 >= rounds) { ctx.end(gs.score as number, rounds); return; }
        const l = makeLoop((gs.round as number) + 1, knows);
        Object.assign(gs, { round: (gs.round as number) + 1, loop: l, opts: optionsFor(l.count), removed: [], picked: null, laid: 0, phase: 'ask', retried: false });
        ctx.rebuild();
      },
    });
  }
  ctx.items({
    bulb: () => { if (phase !== 'ask' || (gs.removed as number[]).length) return false; gs.removed = shuffle(opts.filter((o) => o !== loop.count)).slice(0, 2); return true; },
    torch: () => { if (phase !== 'done' || ok || gs.retried) return false; Object.assign(gs, { picked: null, laid: 0, phase: 'ask', retried: true }); return true; },
  });
}

export const GAMES: Record<GameId, (ctx: GameCtx) => void> = { link: runeLink, memory: memoryCrypt, torchrun: torchRun, bughunt: bugHunt, archery, archive, loop: loopBridge, gemforge: gemForge, typist: runeTypist };
