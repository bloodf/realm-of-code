// The Help & FAQ window: how the game works in six steps, tours, and searchable answers.
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { accordion, faqCats, faqSearch } from './accordion';
import { goAndTour, resetTips } from './helpers';
import { useGame } from '../../game/store';
import { ANIMS } from '../../components/anims';
import { Button, ScrollView, text, domInput } from '../../ui/widgets';
import { C } from '../../ui/theme';
import { say } from '../kit';
import { h2, note, emblem, box, checkbox } from '../winkit';
import { play } from '../../audio/sound';

const QUICK: [string, string, string, string][] = [
  ['map', '#3f8fd6', 'Walk the village', 'Arrow keys, WASD, or click where to go. Click a building to go in, or use the travel bar at the bottom.'],
  ['castle', '#8a56c9', 'Learn at the Academy', 'Follow your path on the map. Each stop is a short lesson (2-5 minutes) that starts from zero.'],
  ['check', '#5aa83c', 'Answer and check', 'Tap or type an answer, then press **Check**. Wrong answers come back later, so you really learn them.'],
  ['code', '#2f7a46', 'Write real code', 'Coding challenges run your code right in the browser: web pages, JavaScript, TypeScript, React, SQL and more.'],
  ['coin', '#e7a72c', 'Play and earn', 'Minigames, the Code Farm and daily quests give XP, gold and items that help you in lessons.'],
  ['hint', '#d9782a', 'Ask Lumi', 'Tap the little fairy on any screen: what the screen does, a step-by-step tour, or help when you are stuck.'],
];

interface St { q?: string; cat?: string | null; open?: string | null }

export class HelpWindow extends WindowScene {
  winTitle = 'Help & FAQ';
  winIcon = 'hint';
  wide = true;
  constructor() { super('W:help'); }

  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const st = this.p.st as St;
    st.q ??= ''; st.cat ??= null; st.open ??= null;
    let y = say(this, c, 0, 0, w, ANIMS.fairy, 'Hi, I am **Lumi**! Here is how the game works, and answers to the questions adventurers ask me most.', 'Lumi · your guide').h + 18;

    // ---- quick start ----
    y = h2(this, c, y, 'How to play');
    const cols = w > 760 ? 3 : w > 480 ? 2 : 1;
    const cw = (w - (cols - 1) * 14) / cols;
    const cardH = cols === 1 ? 118 : 150;
    QUICK.forEach(([ic, col, title, desc], i) => {
      const cx = (i % cols) * (cw + 14), cy = y + Math.floor(i / cols) * (cardH + 14);
      box(this, c, cx, cy, cw, cardH);
      c.add(emblem(this, cx + 16, cy + 16, col, ic, 44));
      c.add(text(this, cx + 72, cy + 12, `${i + 1}. ${title}`, 21, C.ink, { fontStyle: 'bold', wordWrap: { width: cw - 84 } }));
      note(this, c, cx + 72, cy + 42, cw - 88, desc, 16);
    });
    y += Math.ceil(QUICK.length / cols) * (cardH + 14) + 6;

    // ---- tours ----
    c.add(new Button(this, 0, y, 'Take the welcome tour', () => goAndTour(this.game, 'world', 'World'), { variant: 'green', icon: 'play', id: 'help.welcome', clip: sv, size: 19 }));
    const rb = new Button(this, 0, y, 'Show screen tips again', () => { resetTips(); play('unlock'); this.rebuild(); }, { variant: 'ghost', icon: 'reset', id: 'help.resettips', clip: sv, size: 17 });
    rb.x = w > 640 ? 300 : 0;
    if (w <= 640) rb.y = y + 62;
    c.add(rb);
    y += w > 640 ? 72 : 134;
    const s = useGame.getState();
    c.add(checkbox(this, 0, y, s.settings.tips !== false, (v) => useGame.getState().updateSettings({ tips: v }), 'help.tips', sv));
    c.add(text(this, 46, y + 6, 'Offer a short tour the first time I open a screen', 18, C.inkSoft, { fontStyle: 'bold', wordWrap: { width: w - 50 } }));
    y += 56;

    // ---- FAQ ----
    y = h2(this, c, y, 'Questions & answers');
    // the search box is a real text field: it follows the scrolling list and hides outside it
    const boxY = y;
    const inp = domInput(this, sv.x, sv.y + boxY, Math.min(w, 560), 46, { value: st.q, placeholder: 'Search: hearts, save, error...', size: 20, id: 'help.search', onInput: (v) => { st.q = v; st.open = null; clearTimeout(this.p.__qt as number); this.p.__qt = window.setTimeout(() => this.rebuild(), 400); } });
    if (st.q) { inp.el.focus(); inp.el.setSelectionRange(st.q.length, st.q.length); }
    const follow = () => { const yy = sv.y + boxY - sv.scrollY; inp.dom.setY(yy); inp.dom.setVisible(yy >= sv.y - 2 && yy + 46 <= sv.y + sv.h + 2); };
    follow();
    this.events.on('update', follow);
    y += 58;
    y += faqCats(this, c, 0, y, w, st.cat, (id) => { st.cat = id; st.open = null; this.rebuild(); }, sv) + 6;
    const list = faqSearch(st.q, st.cat);
    if (!list.length) { c.add(text(this, 0, y, 'No answer found. Try other words, or ask Lumi with the fairy button.', 18, C.inkSoft)); y += 30; }
    y += accordion(this, c, 0, y, w, list.map((f) => ({ id: f.id, q: f.q, a: f.a })), st.open, (id) => { st.open = st.open === id ? null : id; play('page'); this.rebuild(); }, sv, 'faq', 20);
    return y;
  }
}
