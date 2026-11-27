// The frame around every minigame: the host's intro (with the stars you can win), the
// play screen with item buttons, and the results with stars and rewards.
import { t, tn } from '../../i18n';
import Phaser from 'phaser';
import { UIScene } from '../base';
import { useGame, type GameId, type GameReward } from '../../game/store';
import { GAME_INFO } from '../../course/adaptive';
import { ITEM_BY_ID, STAR_ITEMS, type ItemId } from '../../game/items';
import { NPC_BY_COURSE } from '../../pixel/art';
import { ANIMS } from '../../components/anims';
import { spriteTex } from '../../engine/textures';
import { anim, Button, sprite, text, iconTex, modal, panel, bigTitle, UI } from '../../ui/widgets';
import { drawBar } from '../../ui/draw';
import { C, N } from '../../ui/theme';
import { say, skyBackground } from '../kit';
import { setupGame, type GameSetup } from '../../games/select';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { GAMES, type GameCtx } from './builders';
import { openHelp, maybeTour, setHelpContext } from '../help/helpers';

export interface ItemApi { bulb?: () => boolean; torch?: () => boolean; bulbText?: string; torchText?: string }

interface St {
  setup: GameSetup | { blocked: string };
  phase: 'intro' | 'play' | 'done';
  gs: Record<string, unknown>;
  result: { score: number; max: number; reward: GameReward } | null;
  ended: boolean;
}

export class Minigame extends UIScene {
  itemsApi: ItemApi = {};
  private timers: Phaser.Time.TimerEvent[] = [];
  constructor() { super('Minigame'); }

  get st(): St {
    const s = this.p.st as unknown as St;
    if (!s.setup) Object.assign(s, { setup: setupGame(this.p as { stop?: string; arcade?: string }), phase: 'intro', gs: {}, result: null, ended: false });
    return s;
  }

  build() {
    const st = this.st;
    const setup = st.setup;
    this.itemsApi = {};
    this.game.registry.set('debug:Minigame', () => ({ phase: st.phase, game: 'game' in setup ? setup.game : null, gs: st.gs, stars: st.result?.reward.stars ?? null }));
    if ('blocked' in setup) {
      skyBackground(this, 'web', 0);
      const w = Math.min(520, this.W - 24);
      panel(this, (this.W - w) / 2, this.H / 2 - 120, w, 240);
      anim(this, this.W / 2 - 48, this.H / 2 - 110, ANIMS.fairySad, 4, 96);
      text(this, this.W / 2, this.H / 2, setup.blocked, 22, C.ink, { align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0);
      new Button(this, this.W / 2 - 100, this.H / 2 + 56, 'Back', () => go('learn'), { variant: 'ghost', w: 200, id: 'game.back' });
      return;
    }
    if (st.phase === 'intro') return this.intro(setup);
    if (st.phase === 'done' && st.result) return this.results(setup);
    this.playScreen(setup);
  }

  private exitTo(s: GameSetup) { return s.stopId ? 'learn' : 'practice'; }

  // ---------------- intro ----------------
  private intro(s: GameSetup) {
    const { W, H } = this;
    const info = GAME_INFO[s.game];
    const npc = NPC_BY_COURSE[info.npc] ?? NPC_BY_COURSE.web;
    const record = useGame.getState().games[s.stopId ?? 'arcade:' + s.game];
    skyBackground(this, s.courseId, 100);
    const fy = H - 100;
    const fg = this.add.graphics(); fg.fillStyle(0xe9d6a8).fillRect(0, fy, W, 100); fg.fillStyle(0x2b1a12).fillRect(0, fy, W, 6);
    new Button(this, 12, 12, '', () => go(this.exitTo(s)), { variant: 'ghost', icon: 'x', w: 48, h: 46, id: 'game.close' });
    const cw = Math.min(660, W - 24), x0 = (W - cw) / 2;
    let y = 16;
    const badge = this.add.graphics();
    badge.fillStyle(0x2b1a12).fillRect(W / 2 - 51, y - 3, 102, 102).fillStyle(N(info.color)).fillRect(W / 2 - 48, y, 96, 96);
    this.add.image(W / 2, y + 48, iconTex(this, info.icon, '#ffffff', 4));
    y += 110;
    bigTitle(this, W / 2, y, info.name, this.narrow ? 40 : 52);
    y += this.narrow ? 56 : 70;
    const host = say(this, null, x0, y, cw, [...ANIMS.npcTalk(npc.id), ...ANIMS.npcIdle(npc.id)], info.blurb, `${npc.name} · ${npc.title}`);
    UI.area(this, 'game.host', x0, y, cw, host.h, 'The rules');
    y += host.h + 14;
    const rows = s.stopId ? 3 : 1;
    const ph = 60 + rows * 44 + (record ? 30 : 0);
    panel(this, x0, y, cw, ph);
    UI.area(this, 'game.rewards', x0, y, cw, ph, 'Rewards');
    text(this, x0 + 20, y + 16, s.stopId ? 'Win stars to fill your satchel' : 'Arcade rewards', 20, C.ink, { fontStyle: 'bold' });
    if (s.stopId) STAR_ITEMS.forEach((items, i) => {
      const ry = y + 52 + i * 44;
      const got = (record?.stars ?? 0) > i;
      for (let k = 0; k < 3; k++) sprite(this, x0 + 20 + k * 28, ry, 'starIcon', 24).setAlpha(k <= i ? 1 : 0.2);
      let ix = x0 + cw - 20;
      Object.entries(items).reverse().forEach(([id, n]) => { const t = text(this, ix, ry + 2, `+${n}`, 20, C.ink, { fontStyle: 'bold' }).setOrigin(1, 0); ix -= t.width + 4; sprite(this, ix - 32, ry - 4, ITEM_BY_ID[id as ItemId].sprite, 32); ix -= 44; });
      if (got) this.add.image(x0 + 120, ry + 12, iconTex(this, 'check', C.greenDark, 2)).setOrigin(0, 0.5);
    });
    else text(this, x0 + 20, y + 54, 'Gold and XP every game, and a lightbulb for a 3-star game (up to 3 a day).', 17, C.inkSoft, { wordWrap: { width: cw - 40 } });
    if (record) text(this, x0 + 20, y + ph - 30, t('Best score: {best}', { best: record.best }) + ' · ' + tn(record.plays, 'played {n} time', 'played {n} times'), 16, C.muted);
    const b = new Button(this, 0, fy + 20, 'Play!', () => this.start(), { variant: 'green', w: 220, h: 60, size: 26, id: 'game.play' });
    b.x = Math.round(W / 2 + Math.min(500, W / 2 - 12) - b.bw);
    this.input.keyboard?.on('keydown-ENTER', () => this.start());
    new Button(this, W - 68, 12, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 56, h: 46, id: 'game.help' });
    setHelpContext(this, { screen: 'Minigame', game: s.game, item: 'intro:' + s.game, watch: false, button: 'game.help' });
    maybeTour(this, 'Minigame');
  }

  private start() {
    const st = this.st;
    st.phase = 'play'; st.gs = {}; st.ended = false; st.result = null;
    play('unlock');
    this.rebuild();
  }

  // ---------------- play ----------------
  private playScreen(s: GameSetup) {
    const st = this.st;
    const { W, H } = this;
    const info = GAME_INFO[s.game];
    skyBackground(this, s.courseId, 0);
    new Button(this, 12, 10, '', () => this.confirmQuit(s), { variant: 'ghost', icon: 'x', w: 48, h: 46, id: 'game.quit' });
    this.add.image(72, 33, iconTex(this, info.icon, C.ink, 2)).setOrigin(0, 0.5);
    text(this, 102, 18, info.name, 26, C.ink, { fontStyle: 'bold' });
    const inv = useGame.getState().items;
    const bulbBtn = new Button(this, W - 214, 10, `${inv.bulb}`, () => this.useItem('bulb'), { variant: 'paper', sprite: 'bulbLit', w: 96, h: 48, size: 20, id: 'game.bulb' });
    const torchBtn = new Button(this, W - 110, 10, `${inv.torch}`, () => this.useItem('torch'), { variant: 'paper', sprite: 'torchItem', w: 96, h: 48, size: 20, id: 'game.torch' });
    new Button(this, W - 270, 10, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 50, h: 48, id: 'game.help' });
    const w = Math.min(s.game === 'archery' ? 1100 : 800, W - 24);
    const ctx: GameCtx = {
      scene: this, x: Math.round((W - w) / 2), y: 72, w, h: H - 80, gs: st.gs, stop: !!s.stopId, unitIndex: s.unitIndex, pools: s.pools, courseId: s.courseId,
      end: (score, max, stars) => this.end(s, score, max, stars),
      items: (api) => {
        this.itemsApi = api;
        bulbBtn.setEnabled(!!api.bulb && useGame.getState().items.bulb > 0);
        torchBtn.setEnabled(!!api.torch && useGame.getState().items.torch > 0);
      },
      rebuild: () => this.rebuild(),
      later: (ms, fn) => this.later(ms, fn),
      timer: (total, onZero) => this.timerBar(ctx, total, onZero),
    };
    GAMES[s.game](ctx);
    setHelpContext(this, { screen: 'Minigame', game: s.game, item: 'play:' + s.game, watch: !st.ended, button: 'game.help' });
  }

  /** A timer that survives rebuilds of this screen and waits while the game is paused (help open). */
  later(ms: number, fn: () => void) {
    const gs = this.st.gs;
    const wait = (left: number) => window.setTimeout(() => {
      if (this.st.gs !== gs || !(this.sys.isActive() || this.sys.isPaused())) return;
      if (this.sys.isPaused()) { wait(200); return; }
      fn();
    }, left);
    wait(ms);
  }

  /** A burning torch timer at the top of the game. Time left lives in gs.timeLeft. */
  private timerBar(ctx: GameCtx, total: number, onZero: () => void) {
    const gs = ctx.gs as { timeLeft?: number; timerOn?: boolean };
    gs.timeLeft ??= total;
    gs.timerOn ??= true;
    const y = ctx.y;
    const torch = anim(this, ctx.x, y - 4, ANIMS.torchItem, 4, 40);
    const g = this.add.graphics();
    const t = text(this, ctx.x + ctx.w, y + 4, '', 24, C.ink, { fontStyle: 'bold' }).setOrigin(1, 0);
    const draw = () => {
      g.clear();
      const left = gs.timeLeft!;
      drawBar(g, ctx.x + 46, y + 6, ctx.w - 110, 22, left / Math.max(total, left), left > total * 0.3 ? '#f2a03d' : '#e4553a', left > total * 0.3 ? '#d9782a' : '#b83a26');
      t.setText(`${left}s`);
    };
    draw();
    // wall-clock ticks: screens rebuild often (scene timers restart), so the last tick time lives in gs
    const g2 = gs as { lastTick?: number };
    g2.lastTick ??= Date.now();
    const ev = this.time.addEvent({ delay: 200, loop: true, callback: () => {
      if (!gs.timerOn || this.st.ended) { g2.lastTick = Date.now(); return; }
      if (Date.now() - g2.lastTick! < 1000) return;
      g2.lastTick! += 1000;
      if (Date.now() - g2.lastTick! > 1000) g2.lastTick = Date.now();
      gs.timeLeft = Math.max(0, gs.timeLeft! - 1);
      if (gs.timeLeft <= 5 && gs.timeLeft > 0) play('tick');
      draw();
      if (gs.timeLeft === 0) { gs.timerOn = false; onZero(); }
    } });
    this.timers.push(ev);
    void torch;
    return { add: (sec: number) => { gs.timeLeft = Math.max(0, gs.timeLeft! + sec); draw(); }, set: (sec: number) => { gs.timeLeft = sec; gs.timerOn = true; draw(); }, pause: (on: boolean) => { gs.timerOn = !on; } };
  }

  private useItem(id: 'bulb' | 'torch') {
    const fn = this.itemsApi[id];
    const s = useGame.getState();
    if (!fn || s.items[id] <= 0) return;
    if (fn()) {
      s.useItem(id);
      play(id === 'bulb' ? 'hint' : 'whoosh');
      const img = this.add.image(this.W / 2, this.H * 0.45, spriteTex(this, id === 'bulb' ? 'bulbLit' : 'torchItem')).setScale(4).setDepth(2000).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, scale: 6, y: img.y - 30, duration: 250, yoyo: true, hold: 300, onComplete: () => img.destroy() });
      this.time.delayedCall(20, () => this.rebuild());
    }
  }

  private end(s: GameSetup, score: number, max: number, stars?: number) {
    const st = this.st;
    if (st.ended) return;
    st.ended = true;
    const reward = useGame.getState().finishGame({ stopId: s.stopId, game: s.game, score, max, stars, courseId: s.courseId });
    play(reward.stars >= 2 ? 'victory' : reward.stars === 1 ? 'achievement' : 'fail');
    st.result = { score, max, reward };
    st.phase = 'done';
    this.rebuild();
  }

  private confirmQuit(s: GameSetup) {
    modal(this, 440, (c, w, close) => {
      c.add(anim(this, w / 2 - 48, 16, ANIMS.fairySad, 4, 96));
      c.add(text(this, w / 2, 120, 'Leave the game?', 28, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      c.add(text(this, w / 2, 160, 'Your score in this game will be lost.', 18, C.inkSoft).setOrigin(0.5, 0));
      c.add(new Button(this, 24, 200, 'Keep playing', close, { variant: 'blue', w: w - 48, id: 'gquit.stay' }));
      c.add(new Button(this, 24, 262, 'Leave', () => go(this.exitTo(s)), { variant: 'ghost', w: w - 48, id: 'gquit.leave' }));
      return 334;
    });
  }

  // ---------------- results ----------------
  private results(s: GameSetup) {
    const st = this.st;
    const { W, H } = this;
    const r = st.result!.reward;
    const info = GAME_INFO[s.game];
    setHelpContext(this, { screen: 'Minigame', game: s.game, item: 'done:' + s.game, watch: false, button: 'game.help' });
    skyBackground(this, s.courseId, 100);
    const fy = H - 100;
    const fg = this.add.graphics(); fg.fillStyle(0xe9d6a8).fillRect(0, fy, W, 100); fg.fillStyle(0x2b1a12).fillRect(0, fy, W, 6);
    let y = 20;
    anim(this, W / 2 - 55, y, r.stars >= 2 ? ANIMS.fairyCheer : r.stars === 1 ? ANIMS.fairy : ANIMS.fairySad, 4, 110);
    y += 118;
    for (let k = 0; k < 3; k++) {
      const star = sprite(this, W / 2 - 120 + k * 84, y, 'starIcon', 72);
      if (k < r.stars) { star.setScale(0.5); this.tweens.add({ targets: star, scale: 72 / 16, duration: 400, delay: 300 + k * 350, ease: 'Back.easeOut', onStart: () => play('coin') }); }
      else star.setTint(0x555555).setAlpha(0.5);
    }
    y += 84;
    bigTitle(this, W / 2, y, r.stars === 3 ? 'Legendary!' : r.stars === 2 ? 'Well played!' : r.stars === 1 ? 'Not bad!' : 'Keep trying!', this.narrow ? 42 : 56);
    y += this.narrow ? 56 : 72;
    text(this, W / 2, y, `${info.name}: ${st.result!.score} / ${st.result!.max}${r.best && st.result!.score > 0 ? ' · new best!' : ''}`, 24, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
    y += 44;
    const rewards: [string, string][] = [...Object.entries(r.items).map(([id, n]) => [ITEM_BY_ID[id as ItemId].sprite, `+${n} ${ITEM_BY_ID[id as ItemId].name}`] as [string, string]), ['coin', `+${r.gold} gold`], ['starIcon', `+${r.xp} XP`]];
    const rw = 120;
    rewards.forEach(([spr, label], i) => {
      const rx = W / 2 - (rewards.length * (rw + 10)) / 2 + i * (rw + 10);
      const g = this.add.graphics(); g.fillStyle(0x2b1a12).fillRect(rx, y, rw, 100); g.fillStyle(0xfff6dc).fillRect(rx + 3, y + 3, rw - 6, 94);
      sprite(this, rx + rw / 2 - 28, y + 10, spr, 56);
      text(this, rx + rw / 2, y + 70, label, 15, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
    });
    y += 116;
    if (s.stopId && r.stars < 3) text(this, W / 2, y, 'Play again to win the stars you missed. Each new star adds items to your satchel.', 17, C.inkSoft, { align: 'center', wordWrap: { width: Math.min(600, W - 40) } }).setOrigin(0.5, 0);
    const inner = Math.min(1000, W - 24), ix = (W - inner) / 2;
    new Button(this, ix, fy + 22, 'Play again', () => this.start(), { variant: 'ghost', h: 60, id: 'game.again' });
    const c = new Button(this, 0, fy + 22, 'Continue', () => go(this.exitTo(s)), { variant: 'green', w: 220, h: 60, size: 24, id: 'game.continue' });
    c.x = ix + inner - c.bw;
    this.input.keyboard?.on('keydown-ENTER', () => go(this.exitTo(s)));
    void UI;
  }
}

export type { GameId };
