// Character creation: path, experience, daily goal, lesson style, and your hero.
import Phaser from 'phaser';
import { UIScene } from './base';
import { useGame, type Avatar } from '../game/store';
import { PATHS, pathNodes } from '../course';
import { TUNICS } from '../grid/sprites';
import { ANIMS } from '../components/anims';
import { anim, Button, Card, ScrollView, text, domInput, iconTex, sprite, bar, UI } from '../ui/widgets';
import { TITLE_FONT, C, N } from '../ui/theme';
import { say, choiceCard, screenFrame } from './kit';
import { go } from '../lib/route';
import { openHelp } from './help/helpers';
import { play } from '../audio/sound';

const GOALS = [
  { xp: 10, name: 'Casual', text: '5 minutes a day' },
  { xp: 20, name: 'Regular', text: '10 minutes a day' },
  { xp: 30, name: 'Serious', text: '15 minutes a day' },
  { xp: 50, name: 'Intense', text: '20+ minutes a day' },
];
const CLASSES: { id: Avatar; name: string }[] = [{ id: 'knight', name: 'Knight' }, { id: 'mage', name: 'Mage' }, { id: 'ranger', name: 'Ranger' }];

interface St { step: number; path: string | null; level: string | null; goal: number; detail: boolean | null; name: string; avatar: Avatar; tunic: string }

export class Create extends UIScene {
  constructor() { super('Create'); }

  get st(): St {
    const s = this.p.st as unknown as St;
    if (s.step === undefined) Object.assign(s, { step: 0, path: null, level: null, goal: 20, detail: null, name: '', avatar: 'knight', tunic: 'crimson' });
    return s;
  }

  build() {
    const st = this.st;
    const { W, H } = this;
    const narrow = this.narrow;
    const footY = screenFrame(this, narrow ? 80 : 96);
    const cw = Math.min(820, W - 24);
    const x0 = (W - cw) / 2;
    // top: back + progress
    new Button(this, x0, 12, '', () => { if (st.step) { st.step--; this.rebuild(); } else go(''); }, { variant: 'ghost', icon: 'back', w: 52, h: 48, id: 'create.back' });
    bar(this, x0 + 64, 24, cw - 64 - 70, 24, (st.step + 1) / 5, '#6cc04a');
    new Button(this, x0 + cw - 56, 12, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 56, h: 48, id: 'create.help' });

    const steps = [
      { title: 'What do you want to become?', say: 'Pick a goal. You can change your path any time, and your progress comes with you!', ok: !!st.path },
      { title: 'How much code do you know?', say: 'No wrong answers here!', ok: !!st.level },
      { title: 'Pick a daily goal', say: 'A little every day beats a lot once a month.', ok: true },
      { title: 'How do you like your lessons?', say: 'This only changes the extra notes. Everyone learns the same skills.', ok: st.detail !== null },
      { title: 'Create your hero', say: 'Every legend needs a name.', ok: st.name.trim().length > 0 },
    ];
    const cur = steps[st.step];
    const sv = new ScrollView(this, x0, 70, cw, footY - 80);
    const c = sv.content;
    let y = 0;
    y += say(this, c, 0, y, cw, ANIMS.fairy, cur.say, undefined, { size: narrow ? 64 : 88 }).h + 12;
    const tt = this.add.text(0, y, cur.title, { fontFamily: TITLE_FONT, fontSize: narrow ? '34px' : '46px', color: C.ink, wordWrap: { width: cw } }).setOrigin(0, 0);
    c.add(tt);
    y += tt.height + (narrow ? 8 : 10);
    const pick = (fn: () => void) => () => { fn(); play('click'); this.rebuild(); };

    if (st.step === 0) {
      const cols = narrow ? 1 : 2;
      const gap = 10, w = (cw - gap * (cols - 1)) / cols;
      let colY = [y, y];
      PATHS.forEach((p) => {
        const col = cols === 1 ? 0 : colY[0] <= colY[1] ? 0 : 1;
        const ic = this.add.container(16, 16);
        const sq = this.add.graphics(); sq.fillStyle(N(p.color)).fillRect(0, 0, 44, 44).lineStyle(3, 0x2b1a12).strokeRect(0, 0, 44, 44);
        ic.add([sq, this.add.image(22, 22, iconTex(this, p.icon, '#ffffff', 2))]);
        const r = choiceCard(this, c, col * (w + gap), colY[col], w, p.title, `**${p.subtitle}** · ${p.desc}`, st.path === p.id, pick(() => { st.path = p.id; }), { id: 'create.path.' + p.id, clip: sv, icon: ic, iconW: 56, extra: `${pathNodes(p.id).length} lessons` });
        colY[col] += r.h + gap;
      });
      y = Math.max(...colY);
    } else if (st.step === 1) {
      for (const [id, t, d] of [['new', "I'm new to coding", 'Start from the very beginning. Perfect for kids and adults.'], ['some', 'I know some already', 'Start at the beginning, but use the **Jump here** key on any unit to pass a short test and skip ahead.']]) {
        y += choiceCard(this, c, 0, y, cw, t, d, st.level === id, pick(() => { st.level = id; }), { id: 'create.level.' + id, clip: sv }).h + 10;
      }
    } else if (st.step === 2) {
      for (const g of GOALS) y += choiceCard(this, c, 0, y, cw, g.name, `${g.text} · ${g.xp} XP`, st.goal === g.xp, pick(() => { st.goal = g.xp; }), { id: 'create.goal.' + g.xp, clip: sv }).h + 10;
    } else if (st.step === 3) {
      y += choiceCard(this, c, 0, y, cw, 'Short and simple', 'Just the essentials. Great for kids and busy people.', st.detail === false, pick(() => { st.detail = false; }), { id: 'create.style.short', clip: sv }).h + 10;
      y += choiceCard(this, c, 0, y, cw, 'With real-world details', 'Adds "Sage\'s notes" to challenges: how things work at a real job, interview tips and best practices.', st.detail === true, pick(() => { st.detail = true; }), { id: 'create.style.detail', clip: sv }).h + 10;
    } else {
      // hero: preview, name, class, colour
      const pv = new Card(this, 0, y, 180, 200, null);
      c.add(pv);
      pv.add(anim(this, 30, 20, ANIMS.heroWalk(st.avatar), 8, 120, st.tunic));
      const nm = text(this, 90, 150, st.name || 'Your name', 22, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
      pv.add(nm);
      const fx = narrow ? 0 : 200;
      let fy = narrow ? y + 212 : y;
      c.add(text(this, fx, fy, 'Name', 18, C.ink, { fontStyle: 'bold' }));
      fy += 26;
      const nameY = fy;
      const inp = domInput(this, x0 + fx, sv.y + nameY, Math.min(360, cw - fx), 44, { value: st.name, placeholder: 'e.g. Ada', maxLength: 20, id: 'create.name', onInput: (v) => { st.name = v; nm.setText(v || 'Your name'); cont.setEnabled(v.trim().length > 0); }, onEnter: () => { if (st.name.trim()) next(); } });
      inp.el.id = 'hero-name';
      setTimeout(() => inp.el.focus(), 50);
      this.events.on('update', () => {
        const yy = sv.y + nameY - sv.scrollY;
        inp.dom.setPosition(x0 + fx, yy);
        inp.dom.setVisible(yy > sv.y - 10 && yy + 44 < sv.y + sv.h + 10);
      });
      fy += 56;
      c.add(text(this, fx, fy, 'Class', 18, C.ink, { fontStyle: 'bold' }));
      fy += 26;
      CLASSES.forEach((k, i) => {
        const cd = new Card(this, fx + i * 100, fy, 92, 96, pick(() => { st.avatar = k.id; }), { id: 'create.class.' + k.id, label: k.name, clip: sv });
        if (st.avatar === k.id) cd.setState2('sel');
        cd.add(sprite(this, 22, 10, k.id, 48, st.tunic));
        cd.add(text(this, 46, 60, k.name, 18, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
        c.add(cd);
      });
      fy += 106;
      c.add(text(this, fx, fy, 'Colours', 18, C.ink, { fontStyle: 'bold' }));
      fy += 26;
      Object.entries(TUNICS).forEach(([id, [col]], i) => {
        const sw = this.add.graphics();
        const sx = fx + i * 50;
        sw.fillStyle(0x2b1a12).fillRect(sx - 3, fy - 3, 42, 42);
        if (st.tunic === id) sw.lineStyle(4, 0xffd66b).strokeRect(sx - 6, fy - 6, 48, 48);
        sw.fillStyle(N(col)).fillRect(sx, fy, 36, 36);
        const z = this.add.zone(sx, fy, 36, 36).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', pick(() => { st.tunic = id; }));
        c.add([sw, z]);
        UI.reg(this, 'create.tunic.' + id, z, id);
      });
      y = Math.max(y + 210, fy + 50);
    }
    sv.setContentHeight(y + 20);

    const isLast = st.step === steps.length - 1;
    const next = () => {
      if (!steps[st.step].ok && !(isLast && st.name.trim())) return;
      if (!isLast) { st.step++; play('click'); this.rebuild(); return; }
      const s = useGame.getState();
      s.createProfile({ name: st.name.trim().slice(0, 20), avatar: st.avatar, tunic: st.tunic });
      s.setPath(st.path ?? 'explore');
      s.setDailyGoal(st.goal);
      s.updateSettings({ sageNotes: !!st.detail });
      play('levelup');
      sessionStorage.setItem('roc-welcome', '1');
      go('world');
    };
    const cont = new Button(this, 0, 0, isLast ? 'Start learning' : 'Continue', next, { variant: 'green', id: 'create.next', w: Math.min(280, W - 40) });
    cont.setPosition(Math.round((W - cont.bw) / 2), Math.round(footY + ((H - footY) - cont.bh) / 2) + 3);
    cont.setEnabled(cur.ok);
    this.input.keyboard?.on('keydown-ENTER', () => { if (cur.ok) next(); });
    void Phaser;
  }
}
