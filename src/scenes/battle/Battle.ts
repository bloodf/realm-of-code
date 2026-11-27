// A turn-based battle. Each turn you choose:
//   Strike  - answer a question about what you learned (right = damage, combos hit harder)
//   Spell   - type a code word before the rune fades (big damage)
//   Defend  - halve the next hit and catch your breath
//   Potion  - drink a potion to heal
// then the monster attacks. Win for XP, gold, items and sometimes a pet egg.
import Phaser from 'phaser';
import { UIScene } from '../base';
import { useGame } from '../../game/store';
import { MOBS, REGION_BY_ID, TRIAL, scaledMob, playerStats, battleQuestions, typingWords, winBattle, loseBattle, mobName, regionOpen, type Mob, type BattleReward } from '../../game/battle';
import { giveEgg, activePet, petSprite, mood, rarityName } from '../../game/pets';
import { pathProgress } from '../../course';
import type { Choice } from '../../course/types';
import { ANIMS } from '../../components/anims';
import { anim, Button, Card, text, sprite, bigTitle, modal, domInput, panel, iconTex } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { spriteTex } from '../../engine/textures';
import { drawBar } from '../../ui/draw';
import { C } from '../../ui/theme';
import { skyBackground } from '../kit';
import { play } from '../../audio/sound';
import { go } from '../../lib/route';
import { t } from '../../i18n';
import { openHelp, setHelpContext, maybeTour, noteStruggle } from '../help/helpers';

type Phase = 'intro' | 'choose' | 'question' | 'typing' | 'busy' | 'won' | 'lost' | 'blocked';
interface St {
  phase: Phase; mob: Mob & { id: string }; mobId: string; region: string | null; invader?: string; trial: boolean;
  hp: number; max: number; mhp: number; combo: number; defend: boolean; turn: number; log: string;
  qs: Choice[]; qi: number; order: number[]; words: string[]; wi: number; until: number; reward: BattleReward | null; blocked?: string;
}

export class Battle extends UIScene {
  private heroImg?: Phaser.GameObjects.Image;
  private mobImg?: Phaser.GameObjects.Image;
  private timerEv?: Phaser.Time.TimerEvent;
  constructor() { super('Battle'); }

  get st(): St {
    const s = this.p.st as unknown as St;
    if (!s.phase) this.setup(s);
    return s;
  }

  private setup(s: St) {
    const d = this.p as { region?: string; mob?: string; invader?: string; trial?: boolean };
    const g = useGame.getState();
    let mobId = d.mob ?? 'slime', region: string | null = d.region ?? null, blocked: string | undefined;
    if (d.trial) {
      mobId = TRIAL.mob; region = null;
      const pct = g.pathId ? pathProgress(g.pathId, g.done).pct : 0;
      if (pct < TRIAL.needPct && !g.dev.on) blocked = t('The Junior Trial opens when you finish {n}% of your path. You are at {pct}%.', { n: TRIAL.needPct, pct });
    } else if (d.invader) {
      const inv = g.battle.invaders.find((x) => x.uid === d.invader);
      if (!inv) blocked = t('This monster already ran away.');
      else mobId = inv.mob;
    } else if (region) {
      const r = REGION_BY_ID[region];
      if (!r || !(r.mobs.includes(mobId) || r.boss === mobId)) blocked = t('There is no such monster here.');
      else if (!regionOpen(r)) blocked = t('This region is still closed. Finish more lessons first.');
    }
    const mob = { ...scaledMob(mobId), id: mobId };
    const ps = playerStats();
    Object.assign(s, {
      phase: blocked ? 'blocked' : 'intro', blocked, mob, mobId, region, invader: d.invader, trial: !!d.trial,
      hp: ps.hp, max: ps.hp, mhp: mob.hp, combo: 0, defend: false, turn: 0, log: t(mob.taunt),
      qs: battleQuestions(), qi: 0, order: [], words: typingWords(), wi: 0, until: 0, reward: null,
    } satisfies St);
  }

  build() {
    const st = this.st;
    const { W, H } = this;
    const narrow = this.narrow;
    this.game.registry.set('debug:Battle', () => ({ phase: st.phase, hp: st.hp, mhp: st.mhp, mob: st.mobId, turn: st.turn, right: st.phase === 'question' ? st.order.indexOf(st.qs[st.qi % st.qs.length].answer) : null, word: st.phase === 'typing' ? st.words[st.wi % st.words.length] : null, reward: st.reward }));
    const region = st.region ? REGION_BY_ID[st.region] : null;
    const footH = narrow ? 300 : 250;
    skyBackground(this, region?.biome ?? (st.trial ? 'career' : 'web'), footH);
    const fy = H - footH;
    const g = this.add.graphics();
    g.fillStyle(0x2b1a12).fillRect(0, fy, W, 6);
    g.fillStyle(0xe9d6a8).fillRect(0, fy + 6, W, footH - 6);
    setHelpContext(this, { screen: 'Battle', item: 'battle:' + st.turn + ':' + st.phase, watch: st.phase === 'question' || st.phase === 'typing', button: 'battle.help' });

    // top bar
    new Button(this, 12, 10, '', () => this.flee(), { variant: 'ghost', icon: 'x', w: 48, h: 46, id: 'battle.flee' });
    new Button(this, W - 62, 10, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 52, h: 46, id: 'battle.help' });
    text(this, 72, 20, st.trial ? t('The Junior Trial') : region ? t(region.name) : t('Village defence'), 24, C.ink, { fontStyle: 'bold' });
    if (st.phase === 'blocked') {
      panel(this, W / 2 - 260, H / 2 - 120, 520, 220);
      anim(this, W / 2 - 40, H / 2 - 110, ANIMS.fairySad, 4, 80);
      text(this, W / 2, H / 2 - 20, st.blocked ?? '', 20, C.ink, { align: 'center', wordWrap: { width: 480 } }).setOrigin(0.5, 0);
      new Button(this, W / 2 - 100, H / 2 + 40, t('Back'), () => go(st.invader ? 'world' : 'battle'), { variant: 'ghost', w: 200, id: 'battle.back' });
      return;
    }

    // the two fighters
    const groundY = fy - 14;
    const heroX = Math.round(W * (narrow ? 0.22 : 0.28)), mobX = Math.round(W * (narrow ? 0.74 : 0.7));
    const prof = useGame.getState().profile!;
    this.add.ellipse(heroX, groundY, 110, 22, 0x000000, 0.25);
    this.add.ellipse(mobX, groundY, 140 * (st.mob.scale ?? 1), 26, 0x000000, 0.25);
    this.heroImg = this.add.image(heroX, groundY + 4, spriteTex(this, prof.avatar, prof.tunic)).setOrigin(0.5, 1).setScale(narrow ? 6 : 10);
    const pet = activePet();
    if (pet) this.add.image(heroX - (narrow ? 70 : 90), groundY + 2, spriteTex(this, petSprite(pet))).setOrigin(0.5, 1).setScale(narrow ? 3 : 4);
    const ms = (narrow ? 6 : 10) * (st.mob.scale ?? 1);
    this.mobImg = this.add.image(mobX, groundY + 4, spriteTex(this, st.mob.sprite)).setOrigin(0.5, 1).setScale(ms).setFlipX(true);
    if (st.mhp > 0) this.tweens.add({ targets: this.mobImg, y: this.mobImg.y - 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    else this.mobImg.setAlpha(0);

    // health bars
    const bw = narrow ? 150 : 240;
    const barAt = (x: number, y: number, name: string, hp: number, max: number, col: string) => {
      const bg = this.add.graphics();
      bg.fillStyle(0x1c110a, 0.8).fillRect(x - bw / 2 - 6, y - 6, bw + 12, 48);
      text(this, x - bw / 2, y - 2, name, 16, '#fff3d6', { fontStyle: 'bold' });
      text(this, x + bw / 2, y - 2, `${Math.max(0, Math.ceil(hp))}/${max}`, 16, '#fff3d6').setOrigin(1, 0);
      drawBar(bg, x - bw / 2, y + 20, bw, 14, Math.max(0, hp) / max, col, '#8e2a23');
    };
    const topY = Math.max(narrow ? 64 : 130, groundY - (narrow ? 200 : 300));
    barAt(heroX, topY, prof.name, st.hp, st.max, '#6cc04a');
    barAt(mobX, topY, (st.mob.boss ? '♛ ' : '') + mobName(st.mobId), st.mhp, st.mob.hp, '#d2473c');
    if (st.combo >= 2) text(this, heroX, topY + 46, t('Combo ×{n}!', { n: st.combo }), 18, '#b8541a', { fontStyle: 'bold', stroke: '#fff4dc', strokeThickness: 4 }).setOrigin(0.5, 0);
    if (st.defend) this.add.image(heroX + 40, groundY - 80, iconTex(this, 'shield', '#3f8fd6', 4));

    // the message line
    const logT = richTexture(this, st.log, { width: Math.min(700, W - 40), size: narrow ? 17 : 20, align: 'center', bold: true });
    const ly = narrow ? topY + 70 : 70;
    const lg = this.add.graphics(); lg.fillStyle(0xfdf6e3, 0.92).fillRect(W / 2 - logT.w / 2 - 14, ly - 6, logT.w + 28, logT.h + 12); lg.lineStyle(3, 0x2b1a12).strokeRect(W / 2 - logT.w / 2 - 14, ly - 6, logT.w + 28, logT.h + 12);
    this.add.image(W / 2, ly, logT.key).setOrigin(0.5, 0);

    // the footer
    const inner = Math.min(900, W - 24), ix = Math.round((W - inner) / 2);
    if (st.phase === 'intro') this.intro(ix, fy, inner);
    else if (st.phase === 'choose') this.choose(ix, fy, inner);
    else if (st.phase === 'question') this.question(ix, fy, inner, footH);
    else if (st.phase === 'typing') this.typing(ix, fy, inner);
    else if (st.phase === 'won') this.won();
    else if (st.phase === 'lost') this.lost();
    maybeTour(this, 'Battle');
  }

  private intro(ix: number, fy: number, inner: number) {
    const st = this.st;
    text(this, ix, fy + 24, st.mob.boss ? t('A boss appears! Bosses hit hard, so defend and use potions.') : t('A wild {name} appears!', { name: mobName(st.mobId) }), 22, C.ink, { fontStyle: 'bold', wordWrap: { width: inner } });
    text(this, ix, fy + 64, t('Strike by answering questions, cast spells by typing code words. Right answers in a row make combos.'), 17, C.inkSoft, { wordWrap: { width: inner } });
    const b = new Button(this, 0, fy + 120, t('Fight!'), () => { st.phase = 'choose'; play('unlock'); this.rebuild(); }, { variant: 'red', icon: 'sword', w: 220, h: 60, size: 24, id: 'battle.start' });
    b.x = ix + inner - b.bw;
    this.input.keyboard?.once('keydown-ENTER', () => { if (st.phase === 'intro') { st.phase = 'choose'; this.rebuild(); } });
  }

  private choose(ix: number, fy: number, inner: number) {
    const st = this.st;
    const s = useGame.getState();
    const cols = this.narrow ? 2 : 4, gap = 10, bw = (inner - gap * (cols - 1)) / cols, bh = this.narrow ? 76 : 96;
    const acts: [string, string, string, () => void, boolean, string][] = [
      ['sword', t('Strike'), t('Answer a question'), () => this.startQuestion(), true, 'act.strike'],
      ['wand', t('Spell'), t('Type a code word'), () => this.startTyping(), true, 'act.spell'],
      ['shield', t('Defend'), t('Halve the next hit'), () => this.doDefend(), true, 'act.defend'],
      ['heart', t('Potion ({n})', { n: s.items.potion }), t('Heal 40% of your health'), () => this.drink(), s.items.potion > 0 && st.hp < st.max, 'act.potion'],
    ];
    acts.forEach(([ic, label, sub, fn, ok, id], i) => {
      const x = ix + (i % cols) * (bw + gap), y = fy + 22 + Math.floor(i / cols) * (bh + gap);
      const card = new Card(this, x, y, bw, bh, ok ? () => { play('click'); fn(); } : null, { id, label });
      card.add(this.add.image(28, bh / 2, iconTex(this, ic, ok ? C.ink : C.muted, 3)).setOrigin(0.5));
      card.add(text(this, 56, bh / 2 - 22, label, this.narrow ? 17 : 21, ok ? C.ink : C.muted, { fontStyle: 'bold' }));
      card.add(text(this, 56, bh / 2 + 4, sub, this.narrow ? 13 : 15, C.inkSoft, { wordWrap: { width: bw - 64 } }));
      if (!ok) card.setState2('off');
    });
    const keys = ['ONE', 'TWO', 'THREE', 'FOUR'];
    keys.forEach((k, i) => this.input.keyboard?.once('keydown-' + k, () => { if (st.phase === 'choose' && acts[i][4]) acts[i][3](); }));
  }

  // ---------------- strike: a question ----------------
  private startQuestion() {
    const st = this.st;
    st.qi++;
    const q = st.qs[st.qi % st.qs.length];
    st.order = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    st.until = Date.now() + 20000;
    st.phase = 'question';
    this.rebuild();
  }
  private question(ix: number, fy: number, inner: number, footH: number) {
    const st = this.st;
    const q = st.qs[st.qi % st.qs.length];
    const qt = richTexture(this, q.q + (q.code ? '\n```\n' + q.code + '\n```' : ''), { width: inner, size: this.narrow ? 17 : 20, bold: true, lang: q.lang ?? 'js' });
    const img = this.add.image(ix, fy + 16, qt.key).setOrigin(0, 0);
    const maxQ = footH - 150;
    if (qt.h > maxQ) img.setCrop(0, 0, qt.w, maxQ);
    let y = fy + 22 + Math.min(qt.h, maxQ);
    const cols = q.options.length > 2 && !this.narrow ? 2 : q.options.length === 2 ? 2 : 1;
    const ow = (inner - 10 * (cols - 1)) / cols, oh = this.narrow ? 40 : 46;
    st.order.forEach((k, i) => {
      const x = ix + (i % cols) * (ow + 10), yy = y + Math.floor(i / cols) * (oh + 8);
      const card = new Card(this, x, yy, ow, oh, () => this.answer(k === q.answer), { id: 'bopt.' + i, label: q.options[k] });
      const ot = richTexture(this, q.codeOptions ? '`' + q.options[k] + '`' : q.options[k], { width: ow - 50, size: this.narrow ? 15 : 17 });
      card.add(text(this, 12, oh / 2 - 10, String(i + 1), 16, C.inkSoft, { fontStyle: 'bold' }));
      card.add(this.add.image(36, oh / 2, ot.key).setOrigin(0, 0.5));
      this.input.keyboard?.once('keydown-' + ['ONE', 'TWO', 'THREE', 'FOUR'][i], () => { if (st.phase === 'question') this.answer(k === q.answer); });
    });
    this.timer(st.until, 20000, () => this.answer(false, true));
  }
  private answer(right: boolean, timeout = false) {
    const st = this.st;
    if (st.phase !== 'question') return;
    st.phase = 'busy';
    this.timerEv?.remove();
    if (right) {
      st.combo++;
      const dmg = this.hitFor(1 + 0.15 * Math.min(st.combo - 1, 4));
      play('correct');
      st.log = st.combo >= 3 ? t('Combo ×{n}! You strike for {d}!', { n: st.combo, d: dmg }) : t('Right! You strike for {d}!', { d: dmg });
      this.playerAttack(dmg);
    } else {
      st.combo = 0;
      play('wrong');
      const q = st.qs[st.qi % st.qs.length];
      st.log = (timeout ? t('Too slow!') : t('Missed!')) + ' ' + t('The answer was: {a}', { a: q.options[q.answer] });
      noteStruggle(this, 'battle-q');
      this.after(900, () => this.monsterTurn());
      this.rebuild();
    }
  }

  // ---------------- spell: type a word ----------------
  private startTyping() {
    const st = this.st;
    st.wi++;
    const word = st.words[st.wi % st.words.length];
    const ms = 4500 + word.length * 450;
    st.until = Date.now() + ms;
    st.phase = 'typing';
    this.p.__ms = ms;
    this.rebuild();
  }
  private typing(ix: number, fy: number, inner: number) {
    const st = this.st;
    const word = st.words[st.wi % st.words.length];
    text(this, ix, fy + 18, t('Type the rune to cast the spell:'), 18, C.inkSoft, { fontStyle: 'bold' });
    this.add.text(ix + inner / 2, fy + 48, word, { fontFamily: "'VT323', monospace", fontSize: this.narrow ? '44px' : '56px', color: '#6a3fa0', stroke: '#fff4dc', strokeThickness: 6 }).setOrigin(0.5, 0);
    const inp = domInput(this, ix + inner / 2 - 200, fy + 120, 400, 52, { size: 28, code: true, id: 'spell.input', onEnter: () => check(), onInput: (v) => { if (v === word) check(); } });
    inp.el.setAttribute('data-word', word);
    setTimeout(() => inp.el.focus(), 50);
    const check = () => {
      if (st.phase !== 'typing') return;
      const ok = inp.el.value.trim() === word;
      st.phase = 'busy';
      this.timerEv?.remove();
      if (ok) {
        const left = Math.max(0, st.until - Date.now()) / (this.p.__ms as number);
        const dmg = this.hitFor(1.5 + left * 0.6);
        st.combo++;
        play('cast');
        st.log = t('The spell "{w}" blasts for {d}!', { w: word, d: dmg });
        this.playerAttack(dmg, true);
      } else {
        st.combo = 0;
        play('wrong');
        st.log = t('The spell fizzles!');
        this.after(900, () => this.monsterTurn());
        this.rebuild();
      }
    };
    this.timer(st.until, this.p.__ms as number, () => check());
  }

  private timer(until: number, total: number, onZero: () => void) {
    const { W } = this;
    const g = this.add.graphics();
    const draw = () => { g.clear(); drawBar(g, W / 2 - 200, this.H - 26, 400, 14, Math.max(0, until - Date.now()) / total, '#e7a72c', '#c08420'); };
    draw();
    this.timerEv = this.time.addEvent({ delay: 100, loop: true, callback: () => { draw(); if (Date.now() >= until) { this.timerEv?.remove(); onZero(); } } });
  }

  // ---------------- defend, potion, flee ----------------
  private doDefend() {
    const st = this.st;
    st.defend = true;
    const heal = Math.round(st.max * 0.08);
    st.hp = Math.min(st.max, st.hp + heal);
    st.log = t('You raise your shield (+{n} health).', { n: heal });
    st.phase = 'busy';
    play('whoosh');
    this.after(700, () => this.monsterTurn());
    this.rebuild();
  }
  private drink() {
    const st = this.st;
    if (!useGame.getState().useItem('potion')) return;
    const heal = Math.round(st.max * 0.4);
    st.hp = Math.min(st.max, st.hp + heal);
    st.log = t('You drink a potion: +{n} health!', { n: heal });
    st.phase = 'busy';
    play('drink');
    this.after(700, () => this.monsterTurn());
    this.rebuild();
  }
  private flee() {
    const st = this.st;
    if (st.phase === 'won' || st.phase === 'lost' || st.phase === 'blocked' || st.phase === 'intro') { go(st.invader ? 'world' : 'battle'); return; }
    modal(this, 440, (c, w, close) => {
      c.add(text(this, w / 2, 24, t('Run away?'), 26, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      c.add(text(this, w / 2, 66, t('You lose nothing, but the monster stays.'), 18, C.inkSoft).setOrigin(0.5, 0));
      c.add(new Button(this, 20, 110, t('Keep fighting'), close, { variant: 'green', w: (w - 50) / 2, id: 'flee.stay' }));
      c.add(new Button(this, 30 + (w - 50) / 2, 110, t('Run'), () => { close(); useGame.getState().unlock('fled'); go(st.invader ? 'world' : 'battle'); }, { variant: 'ghost', w: (w - 50) / 2, id: 'flee.go' }));
      return 180;
    });
  }

  // ---------------- damage ----------------
  private hitFor(mult: number) {
    const ps = playerStats();
    const pet = activePet();
    const petBonus = pet && mood(pet) !== 'hungry' && mood(pet) !== 'sad' ? 2 : 0;
    return Math.round((ps.atk + petBonus) * mult * (0.9 + Math.random() * 0.2));
  }

  private floatText(x: number, y: number, s: string, color: string) {
    const tx = this.add.text(x, y, s, { fontFamily: "'Jersey 15'", fontSize: '44px', color, stroke: '#1c110a', strokeThickness: 6 }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: tx, y: y - 60, alpha: 0, duration: 900, onComplete: () => tx.destroy() });
  }

  private playerAttack(dmg: number, spell = false) {
    const st = this.st;
    const h = this.heroImg, m = this.mobImg;
    if (!h || !m) { st.mhp -= dmg; this.after(100, () => this.afterPlayer()); return; }
    this.tweens.add({ targets: h, x: h.x + 60, duration: 140, yoyo: true });
    this.after(160, () => {
      if (!this.sys.isActive()) return;
      st.mhp = Math.max(0, st.mhp - dmg);
      if (spell) { for (let i = 0; i < 10; i++) { const p = this.add.image(m.x + (Math.random() - 0.5) * 80, m.y - 60 - Math.random() * 80, spriteTex(this, 'fire1')).setScale(3).setDepth(40); this.tweens.add({ targets: p, alpha: 0, scale: 5, duration: 500, onComplete: () => p.destroy() }); } }
      const slash = this.add.graphics().setDepth(40);
      slash.lineStyle(8, 0xffffff, 0.9).lineBetween(m.x - 60, m.y - 140, m.x + 40, m.y - 30);
      this.tweens.add({ targets: slash, alpha: 0, duration: 300, onComplete: () => slash.destroy() });
      m.setTintFill(0xffffff);
      this.after(90, () => m.active && m.clearTint());
      this.tweens.add({ targets: m, x: m.x + 10, duration: 50, yoyo: true, repeat: 2 });
      this.floatText(m.x, m.y - 150, '-' + dmg, '#ffd66b');
      play('hit');
      this.after(600, () => this.afterPlayer());
    });
  }
  private afterPlayer() {
    const st = this.st;
    if (st.mhp <= 0) { this.win(); return; }
    this.monsterTurn();
  }

  private monsterTurn() {
    const st = this.st;
    if (st.phase === 'won' || st.phase === 'lost') return;
    st.turn++;
    const raw = st.mob.atk * (0.85 + Math.random() * 0.3) * (st.mob.boss && st.turn % 3 === 0 ? 1.5 : 1);
    const dmg = Math.max(1, Math.round(st.defend ? raw / 2 : raw));
    const heavy = st.mob.boss && st.turn % 3 === 0;
    st.defend = false;
    const h = this.heroImg, m = this.mobImg;
    const finish = () => {
      st.hp = Math.max(0, st.hp - dmg);
      st.log = (heavy ? t('{name} uses a heavy attack!', { name: mobName(st.mobId) }) + ' ' : '') + t('{name} hits you for {d}.', { name: mobName(st.mobId), d: dmg });
      if (st.hp <= 0) { this.lose(); return; }
      st.phase = 'choose';
      this.rebuild();
    };
    if (!h || !m || !this.sys.isActive()) { finish(); return; }
    this.tweens.add({ targets: m, x: m.x - 70, duration: 160, yoyo: true });
    this.after(170, () => {
      if (!this.sys.isActive()) { finish(); return; }
      this.cameras.main.shake(180, 0.008);
      h.setTintFill(0xff6b5a);
      this.after(100, () => h.active && h.clearTint());
      this.floatText(h.x, h.y - 140, '-' + dmg, '#ff8f7a');
      play('bump');
      this.after(650, finish);
    });
  }

  // ---------------- the end ----------------
  private win() {
    const st = this.st;
    st.phase = 'won';
    st.reward = winBattle(st.mobId, st.region, st.turn + 1, st.invader);
    if (st.reward.egg) giveEgg(st.reward.egg, t('The {name} dropped an egg!', { name: mobName(st.mobId) }));
    if (st.trial) useGame.getState().mail({ kind: 'career', title: t('You are a Junior Developer!'), text: t('You passed the Junior Trial. This is the skill level of a junior developer: now build projects, polish your portfolio and apply!'), sprite: 'fairyCheer' });
    play('victory');
    st.log = t('You defeated the {name}!', { name: mobName(st.mobId) });
    this.rebuild();
  }
  private lose() {
    const st = this.st;
    st.phase = 'lost';
    loseBattle();
    play('fail');
    this.rebuild();
  }
  private won() {
    const st = this.st;
    const r = st.reward!;
    modal(this, 520, (c, w) => {
      c.add(bigTitle(this, w / 2, 18, st.trial ? t('Junior Developer!') : t('Victory!'), 52));
      c.add(anim(this, w / 2 - 40, 84, ANIMS.fairyCheer, 4, 80));
      let y = 176;
      const line = (spr: string, s: string) => { c.add(sprite(this, 40, y, spr, 32)); c.add(text(this, 84, y + 4, s, 20, C.ink, { fontStyle: 'bold' })); y += 42; };
      line('starIcon', `+${r.xp} XP`);
      line('coin', t('+{n} gold', { n: r.gold }));
      if (r.item) line(r.item === 'torch' ? 'torchItem' : r.item, t('A {item}!', { item: t(r.item === 'bulb' ? 'lightbulb' : r.item) }));
      if (r.egg) line('egg-' + r.egg, t('A {r} egg!', { r: rarityName(r.egg) }));
      if (st.invader) line('heart', t('The village is a little safer.'));
      c.add(new Button(this, w / 2 - 110, y + 10, t('Continue'), () => go(st.invader ? 'world' : 'battle'), { variant: 'green', w: 220, id: 'battle.continue' }));
      if (!st.invader && !st.trial) c.add(new Button(this, 20, y + 10, t('Again'), () => { this.p.st = {}; this.rebuild(); }, { variant: 'ghost', id: 'battle.again' }));
      return y + 80;
    }, { closable: false });
  }
  private lost() {
    const st = this.st;
    modal(this, 520, (c, w) => {
      c.add(bigTitle(this, w / 2, 18, t('You fainted...'), 48, '#ff8f7a'));
      c.add(anim(this, w / 2 - 40, 84, ANIMS.fairySad, 4, 80));
      c.add(text(this, w / 2, 176, t('Lumi carried you home. You lost nothing. Learn a few more lessons, level up, bring potions, and try again!'), 18, C.inkSoft, { align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0));
      c.add(new Button(this, w / 2 - 110, 260, t('Continue'), () => go(st.invader ? 'world' : 'battle'), { variant: 'green', w: 220, id: 'battle.continue' }));
      return 340;
    }, { closable: false });
  }
}
void MOBS;
