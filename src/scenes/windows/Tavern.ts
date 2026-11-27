// The Tavern (practice) and Greenhollow Farm (the Code Farm level select) windows.
import { tn } from '../../i18n';
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame, type GameId } from '../../game/store';
import { COURSES, courseProgress, skillStrength } from '../../course';
import { GAME_INFO } from '../../course/adaptive';
import { ITEMS } from '../../game/items';
import { arcadeLock, arcadePools } from '../../games/select';
import { LEVELS, CHAPTERS } from '../../farm/levels';
import { ANIMS } from '../../components/anims';
import { anim, Button, Card, sprite, text, iconTex, ScrollView, bar } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { paintNode } from '../../pixel/scenes';
import { paintedTex } from '../../engine/textures';
import { C, N, colorFrame } from '../../ui/theme';
import { drawFrame } from '../../ui/draw';
import { say } from '../kit';
import { h2, emblem, box } from '../winkit';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';

const ARCADE: GameId[] = ['gemforge', 'typist', 'link', 'memory', 'torchrun', 'bughunt', 'archery', 'archive', 'loop'];

export class TavernWindow extends WindowScene {
  winTitle = 'The Tavern';
  winIcon = 'mug';
  constructor() { super('W:practice'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('node'), 'Welcome to the tavern! Practise old lessons (each session earns a heart), play games to fill your satchel, and visit the merchant.', 'Rolf · Innkeeper').h + 16;
    // satchel
    box(this, c, 0, y, w, 96);
    c.add(text(this, 16, y + 12, 'Your satchel', 20, C.ink, { fontStyle: 'bold' }));
    ITEMS.forEach((it, i) => {
      const ix = 16 + i * Math.floor((w - 32) / 3);
      c.add(it.id === 'bulb' ? anim(this, ix, y + 38, ANIMS.bulb, 2, 44) : it.id === 'torch' ? anim(this, ix, y + 38, ANIMS.torchItem, 4, 44) : sprite(this, ix, y + 38, it.sprite, 44));
      c.add(text(this, ix + 50, y + 38, String(s.items[it.id]), 24, C.ink, { fontStyle: 'bold' }));
      if (w >= 480) c.add(text(this, ix + 50, y + 64, w < 640 ? it.short : `${it.name}: ${it.short}`, 15, C.inkSoft));
    });
    y += 110;
    // practice options
    const nMistakes = Object.keys(s.mistakes).length;
    const started = COURSES.filter((co) => courseProgress(co.id, s.done).done > 0);
    const opt = (id: string, color: string, ic: string, title: string, desc: string, to: string, enabled: boolean) => {
      const card = new Card(this, 0, y, w, 80, enabled ? () => go(to) : null, { id, label: title, clip: sv });
      card.add(emblem(this, 14, 14, color, ic, 52));
      card.add(text(this, 82, 12, title, 22, C.ink, { fontStyle: 'bold' }));
      card.add(text(this, 82, 42, desc, w < 560 ? 14 : 16, C.inkSoft, { wordWrap: { width: w - 82 - 56 } }));
      card.add(this.add.image(w - 34, 40, iconTex(this, 'next', C.ink, 2)).setOrigin(0.5));
      if (!enabled) card.setAlpha(0.6);
      c.add(card);
      y += 90;
    };
    opt('tavern.mistakes', C.red, 'target', 'Mistake review', nMistakes ? tn(nMistakes, '{n} exercise you got wrong before', '{n} exercises you got wrong before') : 'No mistakes to review yet.', 'review', nMistakes > 0);
    opt('tavern.mixed', C.purple, 'dumbbell', 'Mixed practice', '10 quick exercises from everything you have learned.', 'practice/all', started.length > 0);
    y += 10;
    // arcade
    y = h2(this, c, y, 'Tavern games');
    const { pools } = arcadePools();
    const cols = w > 620 ? 2 : 1, gap = 10, cw = (w - gap) / cols;
    ARCADE.forEach((g, i) => {
      const info = GAME_INFO[g];
      const lock = arcadeLock(g, pools);
      const rec = s.games['arcade:' + g];
      const cx = (i % cols) * (cw + gap), cy = y + Math.floor(i / cols) * 112;
      const card = new Card(this, cx, cy, cw, 102, lock ? null : () => go('arcade/' + g), { id: 'arcade.' + g, label: info.name, clip: sv });
      card.add(emblem(this, 14, 22, lock ? '#b7ad98' : info.color, lock ? 'lock' : info.icon, 52));
      card.add(text(this, 82, 10, info.name, 21, C.ink, { fontStyle: 'bold' }));
      const d = richTexture(this, lock ?? info.blurb, { width: cw - 100, size: 15, color: C.inkSoft });
      card.add(this.add.image(82, 36, d.key).setOrigin(0, 0));
      if (rec) for (let k = 0; k < 3; k++) card.add(sprite(this, cw - 80 + k * 22, 8, 'starIcon', 20).setAlpha(k < rec.stars ? 1 : 0.25));
      if (lock) card.setAlpha(0.7);
      c.add(card);
    });
    y += Math.ceil(ARCADE.length / cols) * 112 + 14;
    // merchant
    y = h2(this, c, y, 'The merchant');
    const mh = 90 + ITEMS.length * 76;
    box(this, c, 0, y, w, mh);
    c.add(anim(this, 14, y + 12, ANIMS.npcIdle('tailwind'), 4, 64));
    const mt = richTexture(this, `"Short on light? I sell the finest lightbulbs, torches and potions in the realm." You have **${s.gold} gold**.`, { width: w - 110, size: 17 });
    c.add(this.add.image(90, y + 20, mt.key).setOrigin(0, 0));
    ITEMS.forEach((it, i) => {
      const iy = y + 86 + i * 76;
      c.add(sprite(this, 16, iy + 6, it.sprite, 48));
      c.add(text(this, 76, iy + 4, it.name, 20, C.ink, { fontStyle: 'bold' }));
      const dd = richTexture(this, it.desc, { width: w - 76 - 150, size: 14, color: C.inkSoft });
      c.add(this.add.image(76, iy + 30, dd.key).setOrigin(0, 0));
      c.add(new Button(this, w - 130, iy + 10, String(it.price), () => { if (useGame.getState().buyItem(it.id)) { play('coin'); this.rebuild(); } }, { variant: 'gold', sprite: 'coin', w: 114, h: 46, size: 18, disabled: s.gold < it.price, id: 'buy.' + it.id, clip: sv }));
    });
    y += mh + 20;
    // skills
    y = h2(this, c, y, 'Practise a skill');
    if (!started.length) { c.add(text(this, 0, y, 'Finish your first lesson and your skills will appear here.', 17, C.inkSoft)); y += 30; }
    started.forEach((co) => {
      box(this, c, 0, y, w, 76);
      c.add(emblem(this, 14, y + 12, co.color, co.emblem, 50));
      c.add(text(this, 80, y + 10, co.title, 20, C.ink, { fontStyle: 'bold' }));
      const st = skillStrength(s.practicedAt[co.id]);
      const g = this.add.graphics();
      for (let k = 0; k < 4; k++) g.fillStyle(k < st ? N(C.gold) : N('#d9c08c')).fillRect(80 + k * 10, y + 44, 7, 16);
      c.add(g);
      c.add(text(this, 126, y + 42, st <= 2 ? 'Needs practice' : 'Fresh', 16, C.inkSoft));
      c.add(new Button(this, w - 140, y + 16, 'Practice', () => go('practice/' + co.id), { variant: 'blue', size: 16, w: 124, h: 44, id: 'tavern.skill.' + co.id, clip: sv }));
      y += 86;
    });
    return y;
  }
}

export function farmUnlocked(id: string, farm: Record<string, { stars: number }>) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i <= 0 || (farm[LEVELS[i - 1].id]?.stars ?? 0) > 0;
}

export class FarmWindow extends WindowScene {
  winTitle = 'Greenhollow Farm';
  winIcon = 'tree';
  constructor() { super('W:farm'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const farm = useGame.getState().farm;
    const stars = Object.values(farm).reduce((a, f) => a + f.stars, 0);
    const next = LEVELS.find((l) => !farm[l.id]) ?? LEVELS[LEVELS.length - 1];
    let y = say(this, c, 0, 0, w, [...ANIMS.npcTalk('farm'), ...ANIMS.npcIdle('farm')], 'Welcome to Greenhollow! Every field is a puzzle: write a program and your farmer acts it out. We start with blocks you drag and drop. Later you will type real JavaScript.', 'Bess · Farmer of Greenhollow').h + 14;
    const g = this.add.graphics(); g.fillStyle(0x2b1a12).fillRect(0, y, 190, 36); g.fillStyle(N('#e3cf9f')).fillRect(3, y + 3, 184, 30); c.add(g);
    c.add(sprite(this, 8, y + 6, 'starIcon', 24));
    c.add(text(this, 38, y + 7, `${stars} / ${LEVELS.length * 3} stars`, 18, C.inkSoft, { fontStyle: 'bold' }));
    const cont = new Button(this, 0, y - 6, Object.keys(farm).length ? 'Continue' : 'Start farming', () => go('farm/' + next.id), { variant: 'green', icon: 'play', id: 'farm.continue', clip: sv });
    cont.x = w - cont.bw;
    c.add(cont);
    y += 66;
    for (const ch of CHAPTERS) {
      const levels = LEVELS.filter((l) => l.chapter === ch.n);
      const hg = this.add.graphics(); drawFrame(hg, 0, y, w, 96, colorFrame(ch.color)); c.add(hg);
      c.add(text(this, 18, y + 10, `CHAPTER ${ch.n}`, 14, '#ffffff', { fontStyle: 'bold' }));
      c.add(this.add.text(18, y + 26, ch.title, { fontFamily: "'Jacquard 12', serif", fontSize: '38px', color: '#ffffff', stroke: '#2b1a12', strokeThickness: 5 }));
      c.add(text(this, 18, y + 68, ch.sub, 16, '#ffffff'));
      y += 108;
      const cols = Math.max(2, Math.floor(w / 132)), tw = (w - (cols - 1) * 10) / cols;
      levels.forEach((l, i) => {
        const open = farmUnlocked(l.id, farm);
        const st = farm[l.id]?.stars ?? 0;
        const isNext = l.id === next.id;
        const cx = (i % cols) * (tw + 10), cy = y + Math.floor(i / cols) * 160;
        const card = new Card(this, cx, cy, tw, 150, open ? () => go('farm/' + l.id) : null, { id: 'farm.' + l.id, label: l.title, clip: sv });
        if (isNext) card.setState2('sel');
        const img = paintNode(open ? (st ? '#e7a72c' : ch.color) : '#b7ad98', open ? (st ? 'check' : l.mode === 'code' ? 'code' : l.mode === 'hybrid' ? 'swap' : 'board') : 'lock', false, open ? '#ffffff' : '#7a705c');
        card.add(this.add.image(tw / 2, 34, paintedTex(this, img)).setScale(2.2));
        card.add(text(this, tw / 2, 70, String(l.n), 15, C.inkSoft, { fontStyle: 'bold' }).setOrigin(0.5, 0));
        card.add(text(this, tw / 2, 88, l.title, 16, C.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: tw - 12 } }).setOrigin(0.5, 0));
        for (let k = 0; k < 3; k++) card.add(sprite(this, tw / 2 - 27 + k * 18, 126, 'starIcon', 16).setAlpha(k < st ? 1 : 0.2));
        if (!open) card.setAlpha(0.6);
        if (isNext) this.tweens.add({ targets: card, y: cy - 3, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
        c.add(card);
      });
      y += Math.ceil(levels.length / cols) * 160 + 14;
    }
    void bar;
    return y;
  }
}
