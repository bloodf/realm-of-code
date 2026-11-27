// Two more minigames:
//  Gem Forge   - match three gems (swap neighbours). Every 600 points a quick question:
//                a right answer adds time and bonus points.
//  Rune Typist - monsters march down carrying code words; type a word to shoot its monster
//                before it reaches the wall.
import Phaser from 'phaser';
import type { GameCtx } from './builders';
import { useGame } from '../../game/store';
import { typingWords } from '../../game/battle';
import { shuffle } from '../../games/pools';
import { Button, Card, text, domInput } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { spriteTex } from '../../engine/textures';
import { drawFrame } from '../../ui/draw';
import { C, FRAMES } from '../../ui/theme';
import { play } from '../../audio/sound';
import { t } from '../../i18n';

const GEMS = ['ruby', 'sapphire', 'emerald', 'topaz', 'amethyst', 'pearl'];
const N = 8;

type Board = number[][];
function randBoard(): Board {
  const b: Board = [];
  for (let y = 0; y < N; y++) {
    b.push([]);
    for (let x = 0; x < N; x++) {
      let g: number;
      do { g = Math.floor(Math.random() * GEMS.length); } while ((x >= 2 && b[y][x - 1] === g && b[y][x - 2] === g) || (y >= 2 && b[y - 1][x] === g && b[y - 2][x] === g));
      b[y].push(g);
    }
  }
  return b;
}
function matches(b: Board): Set<number> {
  const out = new Set<number>();
  for (let y = 0; y < N; y++) for (let x = 0; x < N - 2; x++) { const g = b[y][x]; if (g >= 0 && b[y][x + 1] === g && b[y][x + 2] === g) { let k = x; while (k < N && b[y][k] === g) out.add(y * N + k++); } }
  for (let x = 0; x < N; x++) for (let y = 0; y < N - 2; y++) { const g = b[y][x]; if (g >= 0 && b[y + 1][x] === g && b[y + 2][x] === g) { let k = y; while (k < N && b[k][x] === g) out.add(k++ * N + x); } }
  return out;
}
function collapse(b: Board) {
  for (let x = 0; x < N; x++) {
    const col = [];
    for (let y = N - 1; y >= 0; y--) if (b[y][x] >= 0) col.push(b[y][x]);
    for (let y = N - 1, k = 0; y >= 0; y--, k++) b[y][x] = k < col.length ? col[k] : Math.floor(Math.random() * GEMS.length);
  }
}
function hasMove(b: Board) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= N || ny >= N) continue;
    const c = b.map((r) => r.slice());
    [c[y][x], c[ny][nx]] = [c[ny][nx], c[y][x]];
    if (matches(c).size) return [x, y, nx, ny];
  }
  return null;
}

export function gemForge(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.board) Object.assign(gs, { board: randBoard(), score: 0, sel: null, busy: false, flash: [], nextQ: 600, quiz: null, chain: 0, qn: 0 });
  const b = gs.board as Board;
  const timer = ctx.timer(75, () => finish());
  const finish = () => {
    const score = gs.score as number;
    useGame.setState((s) => ({ stats: { ...s.stats, gemBest: Math.max(s.stats.gemBest, score) } }));
    ctx.end(score, 3000);
  };
  let y = ctx.y + 44;
  const chip = text(scene, ctx.x + ctx.w / 2, y, t('Score {n}', { n: gs.score as number }) + (gs.chain ? '   ' + t('Chain ×{n}!', { n: gs.chain as number }) : ''), 22, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
  void chip;
  y += 34;
  // a knowledge question (time bonus)
  if (gs.quiz) {
    timer.pause(true);
    const q = gs.quiz as { q: string; options: string[]; answer: number; order: number[] };
    const g = scene.add.graphics(); drawFrame(g, ctx.x, y, ctx.w, 300, FRAMES.panel);
    text(scene, ctx.x + 20, y + 14, t('Bonus rune! Answer for +15 seconds and +200 points.'), 18, C.purple, { fontStyle: 'bold' });
    const qt = richTexture(scene, q.q, { width: ctx.w - 40, size: 20, bold: true });
    scene.add.image(ctx.x + 20, y + 44, qt.key).setOrigin(0, 0);
    let oy = y + 54 + qt.h;
    q.order.forEach((k, i) => {
      const card = new Card(scene, ctx.x + 20, oy, ctx.w - 40, 44, () => {
        const ok = k === q.answer;
        play(ok ? 'correct' : 'wrong');
        if (ok) { gs.score = (gs.score as number) + 200; timer.add(15); }
        gs.quiz = null; timer.pause(false); ctx.rebuild();
      }, { id: 'gq.' + i, label: q.options[k] });
      card.add(text(scene, 14, 10, q.options[k], 18, C.ink));
      oy += 50;
    });
    scene.registry.set('gemforge:right', q.order.indexOf(q.answer));
    return;
  }
  // the board
  const size = Math.min(ctx.w, ctx.h - 140, 560);
  const cell = Math.floor(size / N);
  const bx = Math.round(ctx.x + (ctx.w - cell * N) / 2), by = y;
  const g = scene.add.graphics();
  g.fillStyle(0x1c110a).fillRect(bx - 6, by - 6, cell * N + 12, cell * N + 12);
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) g.fillStyle((xx + yy) % 2 ? 0x3a2a4a : 0x44345a).fillRect(bx + xx * cell, by + yy * cell, cell, cell);
  const sel = gs.sel as [number, number] | null;
  const flash = new Set(gs.flash as number[]);
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
    const v = b[yy][xx];
    if (v < 0) continue;
    const img = scene.add.image(bx + xx * cell + cell / 2, by + yy * cell + cell / 2, spriteTex(scene, 'gem-' + GEMS[v])).setScale(cell / 18);
    if (flash.has(yy * N + xx)) { img.setTintFill(0xffffff); scene.tweens.add({ targets: img, scale: 0, duration: 180 }); }
    if (sel && sel[0] === xx && sel[1] === yy) { const r = scene.add.graphics(); r.lineStyle(4, 0xffd66b).strokeRect(bx + xx * cell + 2, by + yy * cell + 2, cell - 4, cell - 4); scene.tweens.add({ targets: img, scale: cell / 15, duration: 200, yoyo: true, repeat: -1 }); }
    const z = scene.add.zone(bx + xx * cell, by + yy * cell, cell, cell).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => tap(xx, yy));
  }
  text(scene, ctx.x + ctx.w / 2, by + cell * N + 14, t('Tap a gem, then a neighbour, to swap them. Three in a row break!'), 16, C.inkSoft, { align: 'center', wordWrap: { width: ctx.w - 20 } }).setOrigin(0.5, 0);
  (scene.game.registry as Phaser.Data.DataManager).set('gemforge:board', { board: b.map((r) => r.slice()), move: hasMove(b), cell, bx, by, busy: gs.busy });

  function tap(x: number, y2: number) {
    if (gs.busy || gs.quiz) return;
    const s = gs.sel as [number, number] | null;
    if (!s) { gs.sel = [x, y2]; play('click'); ctx.rebuild(); return; }
    if (Math.abs(s[0] - x) + Math.abs(s[1] - y2) !== 1) { gs.sel = [x, y2]; play('click'); ctx.rebuild(); return; }
    gs.sel = null;
    swap(s[0], s[1], x, y2);
  }
  function swap(x1: number, y1: number, x2: number, y2: number) {
    [b[y1][x1], b[y2][x2]] = [b[y2][x2], b[y1][x1]];
    if (!matches(b).size) {
      [b[y1][x1], b[y2][x2]] = [b[y2][x2], b[y1][x1]];
      play('bump');
      ctx.rebuild();
      return;
    }
    gs.busy = true; gs.chain = 0;
    step();
  }
  function step() {
    const m = matches(b);
    if (!m.size) {
      gs.busy = false; gs.flash = []; gs.chain = 0;
      if (!hasMove(b)) gs.board = randBoard();
      // at most 4 bonus questions per game (each adds time, so the game must still end)
      if ((gs.score as number) >= (gs.nextQ as number) && (gs.qn as number) < 4 && ctx.pools.choices.length) {
        gs.nextQ = (gs.nextQ as number) + 600;
        const c = shuffle(ctx.pools.choices.filter((q) => q.options.every((o) => o.length < 50)))[0];
        if (c) { gs.quiz = { q: c.q, options: c.options, answer: c.answer, order: shuffle(c.options.map((_, i) => i)) }; gs.qn = (gs.qn as number) + 1; }
      }
      ctx.rebuild();
      return;
    }
    gs.chain = (gs.chain as number) + 1;
    gs.score = (gs.score as number) + m.size * 10 * (gs.chain as number);
    gs.flash = [...m];
    play(gs.chain as number > 1 ? 'coin' : 'gem');
    ctx.rebuild();
    ctx.later(220, () => {
      for (const k of m) b[Math.floor(k / N)][k % N] = -1;
      collapse(b);
      gs.flash = [];
      ctx.rebuild();
      ctx.later(160, step);
    });
  }
  (scene as unknown as { gemDebug?: unknown }).gemDebug = { swap: (a: number, c: number, d: number, e: number) => swap(a, c, d, e) };
  ctx.items({
    bulb: () => { const mv = hasMove(b); if (!mv || gs.busy) return false; gs.sel = null; swap(mv[0], mv[1], mv[2], mv[3]); return true; },
    torch: () => { timer.add(15); return true; },
  });
}

// ---------------- Rune Typist ----------------
export function runeTypist(ctx: GameCtx) {
  const { scene, gs } = ctx;
  if (!gs.words) Object.assign(gs, { words: typingWords(), wi: 0, typed: 0, lives: 3, done: false });
  const words = gs.words as string[];
  const W = ctx.w, top = ctx.y + 84, bottom = ctx.y + Math.min(ctx.h - 160, 460);
  const finish = () => {
    if (gs.done) return;
    gs.done = true;
    const n = gs.typed as number;
    useGame.setState((s) => ({ stats: { ...s.stats, typingBest: Math.max(s.stats.typingBest, n) } }));
    ctx.end(n, 22);
  };
  const timer = ctx.timer(60, finish);
  const hud = text(scene, ctx.x + W / 2, ctx.y + 44, '', 22, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
  const drawHud = () => hud.setText(t('Words {n}', { n: gs.typed as number }) + '   ' + '♥'.repeat(gs.lives as number));
  drawHud();
  // the field and the castle wall
  const g = scene.add.graphics();
  drawFrame(g, ctx.x, top - 10, W, bottom - top + 60, FRAMES.panel);
  g.fillStyle(0x8d8a94).fillRect(ctx.x + 6, bottom + 20, W - 12, 24);
  for (let x = ctx.x + 6; x < ctx.x + W - 12; x += 24) g.fillStyle(0x6c6875).fillRect(x, bottom + 20, 12, 8);
  const hero = scene.add.image(ctx.x + W / 2, bottom + 22, spriteTex(scene, useGame.getState().profile?.avatar ?? 'knight', useGame.getState().profile?.tunic)).setOrigin(0.5, 1).setScale(3).setDepth(5);
  const mobs = ['mob-slime', 'mob-bat', 'mob-ghost', 'mob-skeleton', 'mob-wisp', 'mob-slimeBlue'];
  interface Foe { word: string; c: Phaser.GameObjects.Container; speed: number; alive: boolean }
  const foes: Foe[] = [];
  const lanes = Math.max(2, Math.min(5, Math.floor(W / 170)));
  let spawnIn = 400, elapsed = 0;
  const spawn = () => {
    const word = words[(gs.wi as number) % words.length];
    gs.wi = (gs.wi as number) + 1;
    const lane = Math.floor(Math.random() * lanes);
    const x = ctx.x + (W / lanes) * (lane + 0.5);
    const c = scene.add.container(x, top);
    const img = scene.add.image(0, 0, spriteTex(scene, mobs[Math.floor(Math.random() * mobs.length)])).setScale(2.6).setOrigin(0.5, 1);
    const label = scene.add.text(0, 4, word, { fontFamily: "'VT323', monospace", fontSize: '28px', color: '#2b1a12', backgroundColor: '#fdf6e3', padding: { x: 6, y: 0 } }).setOrigin(0.5, 0);
    c.add([img, label]);
    foes.push({ word, c, speed: 22 + Math.min(40, (gs.typed as number) * 2.2) + Math.random() * 10, alive: true });
  };
  const inp = domInput(scene, ctx.x + W / 2 - 180, bottom + 64, 360, 52, { size: 28, code: true, id: 'typist.input', placeholder: t('type a word...'), onInput: (v) => tryWord(v), onEnter: () => { tryWord(inp.el.value, true); } });
  setTimeout(() => inp.el.focus(), 80);
  const tryWord = (v: string, enter = false) => {
    const w = v.trim();
    const f = foes.filter((x) => x.alive && x.word === w).sort((a, b) => b.c.y - a.c.y)[0];
    if (!f) { if (enter && w) { play('wrong'); inp.el.value = ''; } return; }
    f.alive = false;
    inp.el.value = '';
    gs.typed = (gs.typed as number) + 1;
    drawHud();
    play('arrow');
    const arrow = scene.add.rectangle(hero.x, hero.y - 40, 4, 18, 0xffd66b).setDepth(6);
    scene.tweens.add({ targets: arrow, x: f.c.x, y: f.c.y - 20, duration: 160, onComplete: () => { arrow.destroy(); play('hit'); scene.tweens.add({ targets: f.c, alpha: 0, scale: 1.4, duration: 200, onComplete: () => f.c.destroy() }); } });
    if ((gs.typed as number) % 5 === 0) {
      // +5s every 5 words, shrinking as the run grows, at most 45s in total, so every run ends
      const add = Math.min(Math.max(1, 5 - Math.floor((gs.typed as number) / 30)), 45 - ((gs.bonus as number) ?? 0));
      if (add > 0) { gs.bonus = ((gs.bonus as number) ?? 0) + add; timer.add(add); }
    }
  };
  scene.registry.set('typist:words', () => foes.filter((f) => f.alive).map((f) => f.word));
  const onUpdate = (_t: number, dt: number) => {
    if (gs.done || !scene.sys.isActive()) return;
    elapsed += dt;
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = Math.max(900, 2600 - (gs.typed as number) * 70); }
    for (const f of foes) {
      if (!f.alive) continue;
      f.c.y += (f.speed * dt) / 1000;
      if (f.c.y >= bottom + 16) {
        f.alive = false;
        gs.lives = (gs.lives as number) - 1;
        drawHud();
        play('bump');
        scene.cameras.main.shake(150, 0.006);
        f.c.destroy();
        if ((gs.lives as number) <= 0) finish();
      }
    }
  };
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => scene.events.off('update', onUpdate));
  text(scene, ctx.x + W / 2, bottom + 124, t('Type the word on a monster (spaces count!). Every 5 words: +5 seconds.'), 16, C.inkSoft, { align: 'center', wordWrap: { width: W - 20 } }).setOrigin(0.5, 0);
  ctx.items({
    bulb: () => { const f = foes.filter((x) => x.alive).sort((a, b) => b.c.y - a.c.y)[0]; if (!f) return false; tryWord(f.word); return true; },
    torch: () => { timer.add(10); return true; },
  });
  void Button; void elapsed;
}
