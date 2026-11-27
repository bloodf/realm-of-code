// The Monster Gate: choose a region and a monster to fight, face the region bosses, and
// finally the Junior Trial (the final exam of your path, against the Elder Dragon of Bugs).
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame } from '../../game/store';
import { REGIONS, MOBS, TRIAL, playerStats, regionOpen, mobName } from '../../game/battle';
import { pathProgress, PATH_BY_ID } from '../../course';
import { ANIMS } from '../../components/anims';
import { anim, Button, text, sprite, ScrollView } from '../../ui/widgets';
import { spriteTex } from '../../engine/textures';
import { C, colorFrame } from '../../ui/theme';
import { drawFrame } from '../../ui/draw';
import { say } from '../kit';
import { h2, box, pill } from '../winkit';
import { go } from '../../lib/route';
import { t } from '../../i18n';

export class GateWindow extends WindowScene {
  winTitle = t('Monster Gate');
  winIcon = 'sword';
  wide = true;
  constructor() { super('W:battle'); }

  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const ps = playerStats();
    let y = say(this, c, 0, 0, w, [...ANIMS.npcTalk('quality'), ...ANIMS.npcIdle('quality')], t('Beyond this gate live monsters made of bugs. Your weapon is what you learn: answer questions to strike, type code words to cast spells. Dragons live on the peak. They are not our friends!'), t('Sir Gareth · Captain of the Gate')).h + 14;
    // hero card
    box(this, c, 0, y, w, 76);
    c.add(anim(this, 12, y + 8, ANIMS.heroIdle(s.profile!.avatar), 4, 60, s.profile!.tunic));
    c.add(text(this, 84, y + 12, t('{name} · Level {lv}', { name: s.profile!.name, lv: ps.level }), 21, C.ink, { fontStyle: 'bold' }));
    c.add(text(this, 84, y + 42, t('Health {hp} · Attack {atk} · Potions {p} · Battles won {w}', { hp: ps.hp, atk: ps.atk, p: s.items.potion, w: s.battle.wins }), 16, C.inkSoft));
    y += 90;
    if (s.battle.invaders.length) {
      const g = this.add.graphics(); drawFrame(g, 0, y, w, 56, colorFrame('#f6c9c2')); c.add(g);
      c.add(text(this, 16, y + 16, t('{n} monsters wandered into the village while you were away! Find them and press Space next to them.', { n: s.battle.invaders.length }), 17, C.redDark, { fontStyle: 'bold', wordWrap: { width: w - 32 } }));
      y += 68;
    }

    y = h2(this, c, y, t('Regions'));
    for (const r of REGIONS) {
      const open = regionOpen(r);
      const h = 176;
      const g = this.add.graphics(); drawFrame(g, 0, y, w, h, open ? colorFrame('#f3e2b8') : colorFrame('#c8c0b0')); c.add(g);
      const band = this.add.graphics(); band.fillStyle(Phaser.Display.Color.HexStringToColor(r.color).color, open ? 1 : 0.4).fillRect(6, y + 6, 12, h - 12); c.add(band);
      c.add(text(this, 30, y + 12, t(r.name), 24, open ? C.ink : C.muted, { fontStyle: 'bold' }));
      const cleared = s.battle.cleared[r.id] ?? 0;
      if (cleared) pill(this, c, w - 150, y + 14, t('Boss beaten ×{n}', { n: cleared }), '#5aa83c', '#ffffff', 14);
      c.add(text(this, 30, y + 42, open ? t(r.desc) : t('Opens after {n} lessons ({have} done).', { n: r.needLessons, have: s.stats.lessons }), 16, C.inkSoft, { wordWrap: { width: w - 60 } }));
      let mx = 30;
      for (const id of r.mobs) {
        const m = MOBS[id];
        const img = this.add.image(mx + 28, y + 100, spriteTex(this, m.sprite)).setScale(3.2);
        if (!open) img.setTint(0x554a40);
        c.add(img);
        c.add(text(this, mx + 28, y + 128, mobName(id), 13, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
        c.add(text(this, mx + 28, y + 146, `×${s.battle.kills[id] ?? 0}`, 13, C.inkSoft).setOrigin(0.5, 0));
        if (open) c.add(new Button(this, mx, y + 72, '', () => go(`battle/${r.id}/${id}`), { variant: 'ghost', w: 56, h: 56, id: `fight.${r.id}.${id}`, clip: sv }).setAlpha(0.01));
        mx += 84;
      }
      const boss = MOBS[r.boss];
      const bimg = this.add.image(mx + 50, y + 98, spriteTex(this, boss.sprite)).setScale(4.2);
      if (!open) bimg.setTint(0x554a40);
      c.add(bimg);
      c.add(sprite(this, mx + 38, y + 54, 'crown', 24));
      c.add(text(this, mx + 50, y + 136, mobName(r.boss), 14, C.redDark, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      if (open) {
        const bw = Math.min(210, w - mx - 130);
        c.add(new Button(this, w - bw - 16, y + 70, t('Fight'), () => go(`battle/${r.id}/${r.mobs[Math.floor(Math.random() * r.mobs.length)]}`), { variant: 'green', icon: 'sword', w: bw, h: 44, size: 17, id: 'fight.' + r.id, clip: sv }));
        c.add(new Button(this, w - bw - 16, y + 120, t('Boss fight'), () => go(`battle/${r.id}/${r.boss}`), { variant: 'red', icon: 'skull', w: bw, h: 44, size: 17, id: 'boss.' + r.id, clip: sv }));
      }
      y += h + 12;
    }

    // the Junior Trial
    y = h2(this, c, y + 6, t('The Junior Trial'));
    const pct = s.pathId ? pathProgress(s.pathId, s.done).pct : 0;
    const ready = pct >= TRIAL.needPct || s.dev.on;
    const g = this.add.graphics(); drawFrame(g, 0, y, w, 150, colorFrame(ready ? '#efe3ff' : '#e0d8c8')); c.add(g);
    const el = this.add.image(70, y + 76, spriteTex(this, MOBS.elder.sprite)).setScale(6);
    if (!ready) el.setTint(0x3a3040);
    c.add(el);
    c.add(text(this, 140, y + 14, mobName('elder'), 24, C.purple, { fontStyle: 'bold' }));
    c.add(text(this, 140, y + 46, t('The final exam of your path: questions from everything you learned. Win it to earn the rank of Junior Developer.'), 16, C.inkSoft, { wordWrap: { width: w - 160 } }));
    const pathName = s.pathId ? PATH_BY_ID[s.pathId]?.title : '';
    c.add(text(this, 140, y + 96, t('{path}: {pct}% done · needs {need}%', { path: t(pathName ?? ''), pct, need: TRIAL.needPct }), 15, ready ? C.greenDark : C.redDark, { fontStyle: 'bold' }));
    c.add(new Button(this, w - 220, y + 92, t('Face the trial'), () => go('battle/trial'), { variant: 'purple', icon: 'crown', w: 200, h: 46, size: 17, id: 'trial', disabled: !ready, clip: sv }));
    return y + 170;
  }
}
