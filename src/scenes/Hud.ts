// The HUD over the village and building windows: hero plate (level, XP, daily goal, career
// rank), resources, the raven inbox, a travel bar, the "Enter" prompt at doors, and
// Lumi's help button.
import Phaser from 'phaser';
import { UIScene } from './base';
import { useGame, MAX_HEARTS } from '../game/store';
import { levelFromXp, today } from '../game/progress';
import { QUEST_BY_ID } from '../game/quests';
import { careerRank } from '../game/achievements';
import { ANIMS } from '../components/anims';
import { anim, sprite, text, iconTex, woodBg, UI, Button } from '../ui/widgets';
import { drawFrame, drawBar } from '../ui/draw';
import { FRAMES, C } from '../ui/theme';
import { go } from '../lib/route';
import { play } from '../audio/sound';
import { currentTarget, WINDOWS, type Target } from '../game/director';
import type { Place } from '../world/WorldScene';
import { openHelp } from './help/helpers';
import { t, up } from '../i18n';

export const HOTBAR: { id: string; route: string; label: string; icon: string; main?: boolean }[] = [
  { id: 'world', route: 'world', label: 'Village', icon: 'map', main: true },
  { id: 'learn', route: 'learn', label: 'Academy', icon: 'castle', main: true },
  { id: 'home', route: 'home', label: 'Home', icon: 'home', main: true },
  { id: 'pets', route: 'pets', label: 'Pets', icon: 'heart', main: true },
  { id: 'battle', route: 'battle', label: 'Battle', icon: 'sword', main: true },
  { id: 'practice', route: 'practice', label: 'Tavern', icon: 'mug' },
  { id: 'farm', route: 'farm', label: 'Code Farm', icon: 'tree' },
  { id: 'quests', route: 'quests', label: 'Quests', icon: 'board' },
  { id: 'skills', route: 'skills', label: 'Skills', icon: 'book' },
  { id: 'trophies', route: 'trophies', label: 'Trophies', icon: 'trophy' },
  { id: 'profile', route: 'profile', label: 'Hero', icon: 'helm' },
  { id: 'settings', route: 'settings', label: 'Settings', icon: 'gear' },
];

export class Hud extends UIScene {
  constructor() { super('Hud'); }

  build() {
    const s = useGame.getState();
    const prof = s.profile;
    if (!prof) return;
    const { W, H } = this;
    const narrow = this.narrow;
    const tg = currentTarget();
    const page = tg?.kind === 'window' ? Object.entries(WINDOWS).find(([, v]) => v === tg.scene)?.[0] ?? '' : 'world';

    // ----- hero plate -----
    const lv = levelFromXp(s.xp);
    const goal = s.dailyGoal, xpToday = s.xpByDay[today()] ?? 0;
    const pw = narrow ? 170 : 270, ph = narrow ? 60 : 84;
    const plate = this.add.container(8, 8);
    const pg = this.add.graphics();
    drawFrame(pg, 0, 0, pw, ph, FRAMES.wood);
    plate.add(pg);
    const ps = narrow ? 40 : 52;
    const port = this.add.graphics();
    port.fillStyle(0x2b1a12).fillRect(10, (ph - ps) / 2, ps, ps);
    port.lineStyle(3, 0x8a5a36).strokeRect(10, (ph - ps) / 2, ps, ps);
    plate.add(port);
    plate.add(anim(this, 12, (ph - ps) / 2 + 2, ANIMS.heroIdle(prof.avatar), 4, ps - 4, prof.tunic));
    const nx = ps + 18;
    plate.add(text(this, nx, narrow ? 8 : 8, prof.name.slice(0, 12), narrow ? 18 : 22, C.cream, { fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#1c110a', fill: true } }));
    plate.add(text(this, pw - 14, narrow ? 8 : 8, t('Lv {n}', { n: lv.level }), narrow ? 18 : 22, '#ffd66b', { fontStyle: 'bold' }).setOrigin(1, 0));
    const bars = this.add.graphics();
    const bw = pw - nx - 14;
    drawBar(bars, nx, narrow ? 32 : 36, bw, 12, lv.into / lv.need, '#e7a72c', '#c08420');
    drawBar(bars, nx, narrow ? 44 : 50, bw, 12, xpToday / goal, '#6cc04a', '#4e9f35');
    plate.add(bars);
    if (!narrow) plate.add(text(this, nx, 64, up(careerRank(s).name), 13, '#ffd66b', { fontStyle: 'bold' }));
    const pz = this.add.zone(0, 0, pw, ph).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => { play('click'); go('profile'); });
    plate.add(pz);
    UI.reg(this, 'hud.hero', pz, t('Your hero, level {n}', { n: lv.level }));

    // ----- resources -----
    const res: [string, string, string][] = [
      ['flameIcon', String(s.streak.count), s.streak.last === today() ? '#ffb347' : '#c9b08a'],
      ['coin', String(s.gold), '#ffd66b'],
      ['heart', s.settings.hearts ? String(s.hearts.n) : '∞', '#ff8f7a'],
    ];
    if (!narrow) res.push(['bulb', String(s.items.bulb), C.cream], ['torchItem', String(s.items.torch), C.cream], ['potion', String(s.items.potion), C.cream]);
    const rc = this.add.container(0, 8);
    let rx = 14;
    const items: Phaser.GameObjects.GameObject[] = [];
    for (const [spr, val, col] of res) {
      items.push(sprite(this, rx, narrow ? 14 : 20, spr, narrow ? 24 : 32));
      const tx = text(this, rx + (narrow ? 26 : 34), narrow ? 14 : 20, val, narrow ? 20 : 24, col, { fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: '#1c110a', fill: true } });
      items.push(tx);
      rx += (narrow ? 26 : 34) + tx.width + (narrow ? 10 : 16);
    }
    const rw = rx + 2;
    const rg = this.add.graphics();
    drawFrame(rg, 0, 0, rw, narrow ? 52 : 72, FRAMES.wood);
    rc.add([rg, ...items]);
    rc.x = W - rw - 8;
    const rz = this.add.zone(0, 0, rw, narrow ? 52 : 72).setOrigin(0, 0);
    rc.add(rz);
    UI.reg(this, 'hud.resources', rz, t('Streak, gold, hearts and items'));

    // ----- the raven inbox -----
    const unread = s.inbox.filter((m) => !m.read).length;
    const ib = new Button(this, W - 8 - 58, (narrow ? 8 : 8) + (narrow ? 58 : 80), '', () => go('inbox'), { variant: unread ? 'gold' : 'wood', icon: 'scroll', w: 58, h: 48, id: 'hud.inbox' });
    if (unread) {
      const badge = this.add.container(ib.x + 40, ib.y - 6);
      const bgb = this.add.graphics(); bgb.fillStyle(0x1c110a).fillRect(0, 0, 26, 22); bgb.fillStyle(0xd2473c).fillRect(2, 2, 22, 18);
      badge.add([bgb, text(this, 13, 1, String(Math.min(9, unread)), 16, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5, 0)]);
      this.tweens.add({ targets: badge, y: badge.y - 3, duration: 500, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    }

    // ----- travel bar (on phones: the main five and a "more" button) -----
    const more = this.p.more === true;
    const list = narrow ? (more ? HOTBAR.filter((h) => !h.main) : HOTBAR.filter((h) => h.main)) : HOTBAR;
    const slots = narrow ? list.length + 1 : list.length;
    const slot = narrow ? Math.floor((W - 16) / slots) : Math.min(74, Math.floor((W - 40) / slots));
    const hb = this.add.container(0, 0);
    const hw = slot * slots + 16, hh = narrow ? 56 : 74;
    const hg = this.add.graphics();
    drawFrame(hg, 0, 0, hw, hh, FRAMES.wood);
    hb.add(hg);
    const hz0 = this.add.zone(0, 0, hw, hh).setOrigin(0, 0);
    hb.add(hz0);
    const claimable = s.daily.quests.some((q) => !q.claimed && q.progress >= (QUEST_BY_ID[q.id]?.goal ?? 99));
    const readyEgg = s.pets.eggs.some((e) => e.progress >= e.need);
    const entries = narrow ? [...list, { id: 'more', route: '', label: more ? 'Back' : 'More', icon: more ? 'back' : 'board' }] : list;
    entries.forEach((h, i) => {
      const on = h.id === page;
      const bx = 8 + i * slot, by = 8;
      const bg = this.add.graphics();
      const bh = hh - 16;
      const draw = (hover: boolean) => {
        bg.clear();
        bg.fillStyle(on ? 0xe7a72c : hover ? 0x4e3220 : 0x3a2416).fillRect(bx + 2, by, slot - 4, bh);
        bg.lineStyle(2, on ? 0xffd66b : 0x8a5a36).strokeRect(bx + 3, by + 1, slot - 6, bh - 2);
        bg.fillStyle(on ? 0xa86e16 : 0x24160d).fillRect(bx + 2, by + bh - 4, slot - 4, 4);
      };
      draw(false);
      const ic = this.add.image(bx + slot / 2, by + (narrow ? bh / 2 : 18), iconTex(this, h.icon, on ? '#2b1a12' : C.cream, 2)).setOrigin(0.5);
      hb.add([bg, ic]);
      if (!narrow) hb.add(text(this, bx + slot / 2, by + 34, up(h.label), slot < 70 ? 12 : 14, on ? '#2b1a12' : C.cream, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      if ((h.id === 'quests' && claimable) || (h.id === 'pets' && readyEgg) || (h.id === 'battle' && s.battle.invaders.length)) { const d = this.add.rectangle(bx + slot - 12, by + 4, 10, 10, 0xd2473c).setOrigin(0, 0).setStrokeStyle(2, 0x1c110a); hb.add(d); }
      const z = this.add.zone(bx, by, slot, bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      const act = () => { if (h.id === 'more') { this.p.more = !more; this.rebuild(); } else go(h.route); };
      z.on('pointerover', () => draw(true)).on('pointerout', () => draw(false)).on('pointerup', () => { play('click'); act(); });
      hb.add(z);
      UI.reg(this, 'hot.' + h.id, z, t(h.label), act);
    });
    hb.setPosition(Math.round((W - hw) / 2), H - hh - (narrow ? 2 : 6));
    UI.reg(this, 'hud.hotbar', hz0, t('Travel bar'));

    // ----- Lumi: help -----
    const hx = narrow ? W - 62 : W - 92, hy = H - hh - (narrow ? 70 : 110);
    const help = this.add.container(hx, hy);
    const hgb = this.add.graphics();
    drawFrame(hgb, 0, 0, narrow ? 56 : 84, narrow ? 60 : 96, FRAMES.gold, { base: 1 });
    help.add(hgb);
    help.add(anim(this, narrow ? 4 : 10, 2, ANIMS.fairy, 4, narrow ? 48 : 64));
    help.add(text(this, (narrow ? 56 : 84) / 2, narrow ? 40 : 66, up('Help'), narrow ? 14 : 18, '#2b1a12', { fontStyle: 'bold' }).setOrigin(0.5, 0));
    const hz = this.add.zone(0, 0, narrow ? 56 : 84, narrow ? 60 : 96).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => { play('say'); openHelp(this); });
    help.add(hz);
    UI.reg(this, 'hud.help', hz, t('Help'), () => openHelp(this));
    this.tweens.add({ targets: help, y: hy - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });

    // ----- "Enter" prompt at doors -----
    const near = this.p.near as Place | null | undefined;
    if (near && tg?.kind === 'world') {
      const b = new Button(this, 0, 0, t('Enter {place}', { place: t(near.name) }), () => { const w = this.scene.get('World') as unknown as { enterNear: () => void }; w.enterNear(); }, { variant: 'gold', icon: 'next', id: 'hud.enter' });
      b.setPosition(Math.round((W - b.bw) / 2), H - hh - b.bh - (narrow ? 12 : 20));
      this.tweens.add({ targets: b, y: b.y - 4, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    } else if (tg?.kind === 'world' && !narrow) {
      text(this, W / 2, H - hh - 30, t('WASD or arrows to walk · Space or Enter to act · click a building to go there'), 15, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#2b1a12aa', padding: { x: 8, y: 3 } }).setOrigin(0.5, 0);
    }

    // keep up to date
    const onNear = (p: Place | null) => { if ((this.p.near as Place | null)?.id !== p?.id) { this.p.near = p; this.rebuild(); } };
    const onShow = (tt: Target) => { if (tt.kind !== 'full') this.rebuild(); };
    this.game.events.on('world:near', onNear);
    this.game.events.on('director:show', onShow);
    let pending = 0;
    const unsub = useGame.subscribe((a, b) => {
      if (a.xp !== b.xp || a.gold !== b.gold || a.hearts.n !== b.hearts.n || a.items !== b.items || a.streak !== b.streak || a.profile !== b.profile || a.daily !== b.daily || a.settings.hearts !== b.settings.hearts || a.inbox !== b.inbox || a.pets.eggs !== b.pets.eggs || a.battle.invaders !== b.battle.invaders) {
        clearTimeout(pending); pending = window.setTimeout(() => this.rebuild(), 50);
      }
    });
    const onWake = () => this.rebuild();
    this.events.on('wake', onWake);
    this.events.once('shutdown', () => { this.events.off('wake', onWake); this.game.events.off('world:near', onNear); this.game.events.off('director:show', onShow); unsub(); clearTimeout(pending); });
    void MAX_HEARTS;
  }
}

/** A bare HUD-like wooden strip (used by full-screen scenes' top bars). */
export function topBar(scene: Phaser.Scene, h: number) {
  return woodBg(scene, 0, 0, scene.scale.width, h);
}
