// The raven inbox (notifications) and the "welcome back" screen after a long absence.
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame } from '../../game/store';
import { awayReport, buildReport, askNotify, notifySupported } from '../../game/away';
import { now, DAY, HOUR, MIN } from '../../game/clock';
import { ANIMS } from '../../components/anims';
import { anim, Button, text, sprite, iconTex, ScrollView } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { C } from '../../ui/theme';
import { say } from '../kit';
import { h2, box } from '../winkit';
import { go } from '../../lib/route';
import { t, tn } from '../../i18n';

export function ago(at: number) {
  const d = now() - at;
  if (d < MIN) return t('just now');
  if (d < HOUR) return tn(Math.floor(d / MIN), '{n} minute ago', '{n} minutes ago');
  if (d < DAY) return tn(Math.floor(d / HOUR), '{n} hour ago', '{n} hours ago');
  return tn(Math.floor(d / DAY), '{n} day ago', '{n} days ago');
}

export class InboxWindow extends WindowScene {
  winTitle = t('Raven Mail');
  winIcon = 'scroll';
  constructor() { super('W:inbox'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    let y = say(this, c, 0, 0, w, ANIMS.fairy, t('Ravens bring news from all over the realm: pets, eggs, crops, quests and reminders.'), t('Lumi · your guide')).h + 14;
    if (!s.settings.notify && notifySupported()) {
      const narrow = w < 520;
      const q = text(this, 16, y + 12, t('Want reminders even when the game is in the background?'), 17, C.blueDark, { fontStyle: 'bold', wordWrap: { width: narrow ? w - 32 : w - 230 } });
      const bh = narrow ? q.height + 80 : Math.max(70, q.height + 24);
      box(this, c, 0, y, w, bh, 'sel');
      c.add(q);
      c.add(new Button(this, narrow ? 16 : w - 200, narrow ? y + q.height + 22 : y + 12, t('Turn on'), () => { void askNotify().then(() => this.rebuild()); }, { variant: 'blue', w: narrow ? w - 32 : 184, h: 46, id: 'inbox.notify', clip: sv }));
      y += bh + 12;
    }
    y = h2(this, c, y, t('Messages'));
    if (!s.inbox.length) { c.add(text(this, 0, y, t('No messages yet.'), 18, C.inkSoft)); y += 30; }
    for (const m of s.inbox) {
      const tt = richTexture(this, `**${m.title}**\n${m.text}`, { width: w - 200, size: 17 });
      const h = Math.max(76, tt.h + 34);
      box(this, c, 0, y, w, h, m.read ? 'panel' : 'sel');
      if (m.sprite) c.add(sprite(this, 14, y + 14, m.sprite, 44));
      else c.add(this.add.image(36, y + 36, iconTex(this, m.icon ?? 'scroll', C.ink, 3)));
      c.add(this.add.image(70, y + 12, tt.key).setOrigin(0, 0));
      c.add(text(this, 70, y + h - 24, ago(m.at), 13, C.muted));
      if (m.to) c.add(new Button(this, w - 118, y + (h - 42) / 2, t('Go'), () => go(m.to!), { variant: 'green', icon: 'next', w: 104, h: 42, size: 16, id: 'mail.go.' + m.id, clip: sv }));
      y += h + 8;
    }
    // opening the inbox reads everything
    if (s.inbox.some((m) => !m.read)) setTimeout(() => useGame.getState().readMail(), 400);
    return y;
  }
}

export class WelcomeBackWindow extends WindowScene {
  winTitle = t('Welcome back!');
  winIcon = 'home';
  constructor() { super('W:welcome'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const away = s.away;
    const r = awayReport() ?? buildReport(away ? away.days * DAY : 0);
    if (away && !away.seen) setTimeout(() => useGame.setState((st) => ({ away: st.away ? { ...st.away, seen: true } : null })), 300);
    const days = away?.days ?? r.days;
    let y = 0;
    c.add(anim(this, w / 2 - 60, y, days >= 2 ? ANIMS.fairySad : ANIMS.fairyCheer, 4, 120));
    y += 128;
    c.add(this.add.text(w / 2, y, days >= 2 ? t('We missed you, {name}!', { name: s.profile!.name }) : t('Welcome back, {name}!', { name: s.profile!.name }), { fontFamily: "'Jacquard 12', serif", fontSize: '44px', color: C.ink }).setOrigin(0.5, 0));
    y += 60;
    c.add(text(this, w / 2, y, days >= 1 ? tn(days, 'You were away for {n} day.', 'You were away for {n} days.') : t('Good to see you again.'), 20, C.inkSoft, { fontStyle: 'bold' }).setOrigin(0.5, 0));
    y += 40;
    y = h2(this, c, y, t('While you were away'));
    const items: [string, string, string | null, string][] = [];
    if (r.streakLost) items.push(['flameIcon', t('Your streak went out. Start a new one today: one lesson is enough.'), 'learn', t('Learn')]);
    if (r.hungryPets.length) items.push(['heart', t('{names} missed you and need food and play.', { names: r.hungryPets.join(', ') }), 'pets', t('Pets')]);
    if (r.ripe) items.push(['crop-tomato', tn(r.ripe, '{n} crop is ripe in your garden.', '{n} crops are ripe in your garden.'), 'home', t('Garden')]);
    if (r.withered) items.push(['weed', tn(r.withered, '{n} crop withered.', '{n} crops withered.'), 'home', t('Garden')]);
    if (r.animalsReady) items.push(['item-egg', tn(r.animalsReady, '{n} animal has something for you.', '{n} animals have something for you.'), 'home', t('Barn')]);
    if (s.battle.invaders.length) items.push(['mob-slime', tn(s.battle.invaders.length, '{n} monster wandered into the village.', '{n} monsters wandered into the village.'), 'world', t('Chase')]);
    if (s.decay > 0) items.push(['mushroom', t('Weeds and gloom crept over the village. Every lesson you finish cleans it up, and a clean village gives a comeback bonus!'), null, '']);
    if (!items.length) items.push(['starIcon', t('Everything is calm and ready for you.'), null, '']);
    for (const [spr, msg, to, label] of items) {
      const tt = richTexture(this, msg, { width: w - 200, size: 18 });
      const h = Math.max(64, tt.h + 24);
      box(this, c, 0, y, w, h);
      c.add(sprite(this, 12, y + (h - 40) / 2, spr, 40));
      c.add(this.add.image(66, y + (h - tt.h) / 2, tt.key).setOrigin(0, 0));
      if (to) c.add(new Button(this, w - 124, y + (h - 42) / 2, label, () => go(to), { variant: 'blue', w: 110, h: 42, size: 16, id: 'wb.' + to + '.' + y, clip: sv }));
      y += h + 8;
    }
    y += 8;
    const b = new Button(this, 0, y, t('Start a comeback lesson'), () => go('learn'), { variant: 'green', icon: 'play', id: 'wb.lesson', clip: sv });
    b.x = (w - b.bw) / 2;
    c.add(b);
    return y + 80;
  }
}
