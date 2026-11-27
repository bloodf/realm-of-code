// Lumi's help panel, opened from the fairy button on every screen. Three tabs:
// "This screen" (what it is for + a step-by-step tour), "I'm stuck" (advice for what is
// on screen, with buttons that do things for you) and "Questions" (the FAQ).
import { up } from '../../i18n';
import Phaser from 'phaser';
import { UIScene } from '../base';
import { SCREEN_HELP, TYPE_TIPS, GAME_TIPS, FAQ_BY_ID, type StuckTip } from './content';
import { helpScreen, startTour, pauseUnder, domElements } from './helpers';
import { accordion, faqCats, faqSearch, type AccItem } from './accordion';
import { useGame } from '../../game/store';
import { ANIMS } from '../../components/anims';
import { anim, Button, ScrollView, text, UI, woodBg, parchmentBg, iconTex, domInput } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { drawFrame } from '../../ui/draw';
import { C, FRAMES, TITLE_FONT } from '../../ui/theme';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { checkbox } from '../winkit';

type Tab = 'about' | 'stuck' | 'faq';
/** The first of these buttons that is on screen now. */
const firstUi = (ids: string | string[]) => ([] as string[]).concat(ids).find((id) => !!UI.rect(id)) ?? null;
interface St { tab: Tab; open: string | null; q: string; cat: string | null; all: boolean; scroll?: number }

export class HelpPanel extends UIScene {
  constructor() { super('HelpPanel'); }

  build() {
    const st = this.p.st as unknown as St;
    if (!st.tab) Object.assign(st, { tab: (this.p.topic as Tab) || 'about', open: null, q: '', cat: null, all: false });
    const { key, ctx, base } = helpScreen();
    const help = SCREEN_HELP[key];
    if (!this.p.__resume) {
      this.p.__resume = pauseUnder(this.game, []);
      // DOM pieces of the screen below would cover the panel: hide them while it is open
      const doms = domElements(this.game, ['HelpPanel']);
      doms.forEach((d) => d.setVisible(false));
      this.p.__doms = doms;
    }
    this.events.once('shutdown', () => {
      if (this.rebuilding) return;
      (this.p.__doms as Phaser.GameObjects.DOMElement[]).forEach((d) => d.active && d.setVisible(true));
      (this.p.__resume as () => void)();
    });
    this.game.registry.set('debug:HelpPanel', () => ({ screen: key, tab: st.tab, open: st.open }));

    const { W, H } = this;
    const narrow = this.narrow;
    const pw = narrow ? W : Math.min(580, W - 40);
    const px = narrow ? 0 : W - pw - 16, py = narrow ? 0 : 16, ph = narrow ? H : H - 32;
    this.add.rectangle(0, 0, W, H, 0x1c110a, 0.55).setOrigin(0, 0).setInteractive().on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.x < px || p.x > px + pw || p.y < py || p.y > py + ph) this.close();
    });
    const g = this.add.graphics();
    g.fillStyle(0x1c110a).fillRect(px - 6, py - 6, pw + 12, ph + 12);
    parchmentBg(this, px, py, pw, ph);
    // header: Lumi and the screen's name
    const headH = narrow ? 86 : 100;
    woodBg(this, px, py, pw, headH);
    this.add.rectangle(px, py + headH, pw, 6, 0x1c110a).setOrigin(0, 0);
    anim(this, px + 12, py + (headH - (narrow ? 64 : 80)) / 2, ANIMS.fairy, 4, narrow ? 64 : 80);
    const hx = px + (narrow ? 86 : 104);
    text(this, hx, py + (narrow ? 12 : 16), 'LUMI · YOUR GUIDE', 15, '#ffd66b', { fontStyle: 'bold' });
    this.add.text(hx, py + (narrow ? 32 : 38), help.title, { fontFamily: TITLE_FONT, fontSize: narrow ? '30px' : '38px', color: '#fff3d6', stroke: '#1c110a', strokeThickness: 5 });
    new Button(this, px + pw - 56, py + 10, '', () => this.close(), { variant: 'red', icon: 'x', w: 46, h: 44, id: 'help.close' });

    // tabs
    const ty = py + headH + 14;
    const tabs: [Tab, string, string][] = [['about', 'This screen', 'eye'], ['stuck', "I'm stuck", 'hint'], ['faq', 'Questions', 'book']];
    const tw = (pw - 24 - 16) / 3;
    tabs.forEach(([id, label, ic], i) => {
      new Button(this, px + 12 + i * (tw + 8), ty, label, () => { st.tab = id; st.open = null; st.scroll = 0; this.rebuild(); }, { variant: st.tab === id ? 'gold' : 'paper', icon: ic, w: tw, h: 46, size: narrow ? 14 : 17, id: 'help.tab.' + id });
    });

    // body
    let by = ty + 60;
    const w = pw - 46;
    if (st.tab === 'faq' && (st.all || !help.faq.length)) {
      // search box (a real text field, so it stays outside the scrolling list)
      const inp = domInput(this, px + 16, by, w, 46, { value: st.q, placeholder: 'Search: hearts, save, error...', size: 20, id: 'help.search', onInput: (v) => { st.q = v; clearTimeout(this.p.__qt as number); this.p.__qt = window.setTimeout(() => this.rebuild(), 400); } });
      if (st.q) { inp.el.focus(); inp.el.setSelectionRange(st.q.length, st.q.length); }
      by += 58;
    }
    const sv = new ScrollView(this, px + 16, by, pw - 26, py + ph - by - 12);
    const c = sv.content;
    let y = 4;
    if (st.tab === 'about') y = this.about(c, w, y, key, ctx, base, sv);
    else if (st.tab === 'stuck') y = this.stuck(c, w, y, key, ctx, sv);
    else y = this.faq(c, w, y, key, sv);
    sv.setContentHeight(y + 20);
    if (st.scroll) sv.scrollTo(st.scroll);
    this.events.once('shutdown', () => { st.scroll = sv.scrollY; });

    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private about(c: Phaser.GameObjects.Container, w: number, y: number, key: string, ctx: ReturnType<typeof helpScreen>['ctx'], base: string, sv: ScrollView) {
    const help = SCREEN_HELP[key];
    const add = (md: string, size = 20, color: string = C.ink) => { const t = richTexture(this, md, { width: w, size, color }); c.add(this.add.image(0, y, t.key).setOrigin(0, 0)); y += t.h + 12; };
    add(help.about);
    const tip = this.contextTip(key, ctx);
    if (tip) {
      const t = richTexture(this, tip.text, { width: w - 32, size: 18 });
      const g = this.add.graphics(); drawFrame(g, 0, y, w, t.h + 52, FRAMES.sel); c.add(g);
      c.add(this.add.image(14, y + 12, iconTex(this, 'hint', C.blueDark, 2)).setOrigin(0, 0));
      c.add(text(this, 46, y + 12, up(tip.title), 15, C.blueDark, { fontStyle: 'bold' }));
      c.add(this.add.image(16, y + 38, t.key).setOrigin(0, 0));
      y += t.h + 64;
    }
    if (help.steps.length) {
      c.add(new Button(this, 0, y, 'Show me step by step', () => { this.close(); startTour(this.game, key); }, { variant: 'green', icon: 'play', w, h: 58, size: 21, id: 'help.tour', clip: sv }));
      y += 72;
    }
    c.add(new Button(this, 0, y, "I'm stuck: help me", () => { const st = this.p.st as unknown as St; st.tab = 'stuck'; st.open = null; this.rebuild(); }, { variant: 'blue', icon: 'hint', w, h: 52, size: 19, id: 'help.gostuck', clip: sv }));
    y += 66;
    const inWorld = base === 'World' || base.startsWith('W:');
    if (inWorld) {
      c.add(new Button(this, 0, y, 'Replay the welcome tour', () => { this.close(); startTour(this.game, 'World'); if (base !== 'World') go('world'); }, { variant: 'paper', icon: 'map', w, h: 48, size: 17, id: 'help.welcome', clip: sv }));
      y += 60;
      c.add(new Button(this, 0, y, 'All questions & answers', () => { this.close(); go('help'); }, { variant: 'paper', icon: 'book', w, h: 48, size: 17, id: 'help.faqpage', clip: sv }));
      y += 60;
    }
    // tips toggle
    const s = useGame.getState();
    const cb = checkbox(this, 0, y + 4, s.settings.tips !== false, (v) => useGame.getState().updateSettings({ tips: v }), 'help.tips', sv);
    c.add(cb);
    c.add(text(this, 46, y + 8, 'Offer a tour the first time I open a screen', 17, C.inkSoft, { fontStyle: 'bold', wordWrap: { width: w - 50 } }));
    y += 52;
    return y;
  }

  /** Extra advice for exactly what is on screen (this kind of question, this game...). */
  private contextTip(key: string, ctx: ReturnType<typeof helpScreen>['ctx']): { title: string; text: string } | null {
    if (key.startsWith('Lesson') && ctx.type && TYPE_TIPS[ctx.type]) return { title: 'This question', text: TYPE_TIPS[ctx.type] };
    if (key === 'Minigame' && ctx.game && GAME_TIPS[ctx.game]) return { title: 'How to play', text: GAME_TIPS[ctx.game] };
    return null;
  }

  private stuck(c: Phaser.GameObjects.Container, w: number, y: number, key: string, ctx: ReturnType<typeof helpScreen>['ctx'], sv: ScrollView) {
    const st = this.p.st as unknown as St;
    const help = SCREEN_HELP[key];
    const intro = richTexture(this, 'No worries, everybody gets stuck. **Pick what is happening:**', { width: w, size: 19 });
    c.add(this.add.image(0, y, intro.key).setOrigin(0, 0));
    y += intro.h + 14;
    const tips: StuckTip[] = [];
    const ct = this.contextTip(key, ctx);
    if (ct) tips.push({ q: key === 'Minigame' ? 'How does this game work?' : 'How do I answer this question?', a: ct.text });
    tips.push(...help.stuck);
    if (!tips.length) tips.push({ q: 'Nothing to do here?', a: 'This screen only shows information. Close it to go back to the village, or open the Academy to keep learning.', action: { label: 'Open the Academy', go: 'learn' } });
    const items: AccItem[] = tips.map((t, i) => ({
      id: String(i), q: t.q, a: t.a,
      action: t.action ? {
        label: t.action.label,
        disabled: t.action.ui && !firstUi(t.action.ui) ? 'not available right now' : undefined,
        run: () => this.act(t.action!),
      } : undefined,
    }));
    const open = st.open ?? (ct ? '0' : null);
    y += accordion(this, c, 0, y, w, items, open, (id) => { st.open = st.open === id ? '' : id; play('page'); this.rebuild(); }, sv, 'stuck');
    y += 6;
    const more = richTexture(this, 'Still stuck? Check the **Questions** tab, or take a break: your progress is saved.', { width: w, size: 17, color: C.inkSoft });
    c.add(this.add.image(0, y, more.key).setOrigin(0, 0));
    return y + more.h + 10;
  }

  private act(a: NonNullable<StuckTip['action']>) {
    this.close();
    if (a.go) { go(a.go); return; }
    const id = a.ui ? firstUi(a.ui) : null;
    if (id) { const e = UI.get(id); setTimeout(() => e?.click?.(), 0); }
  }

  private faq(c: Phaser.GameObjects.Container, w: number, y: number, key: string, sv: ScrollView) {
    const st = this.p.st as unknown as St;
    const help = SCREEN_HELP[key];
    const toggle = (id: string) => { st.open = st.open === id ? '' : id; play('page'); this.rebuild(); };
    if (!st.all && help.faq.length) {
      c.add(text(this, 0, y, 'ABOUT THIS SCREEN', 16, C.inkSoft, { fontStyle: 'bold' }));
      y += 26;
      const list = help.faq.map((id) => FAQ_BY_ID[id]).filter(Boolean);
      y += accordion(this, c, 0, y, w, list.map((f) => ({ id: f.id, q: f.q, a: f.a })), st.open, toggle, sv, 'faq');
      c.add(new Button(this, 0, y + 4, 'See all questions', () => { st.all = true; st.open = null; this.rebuild(); }, { variant: 'blue', icon: 'book', w, h: 50, size: 18, id: 'help.allfaq', clip: sv }));
      return y + 64;
    }
    y += faqCats(this, c, 0, y, w, st.cat, (id) => { st.cat = id; st.open = null; this.rebuild(); }, sv);
    y += 6;
    const list = faqSearch(st.q, st.cat);
    if (!list.length) { c.add(text(this, 0, y, 'No answer found. Try other words.', 18, C.inkSoft)); y += 30; }
    y += accordion(this, c, 0, y, w, list.map((f) => ({ id: f.id, q: f.q, a: f.a })), st.open, toggle, sv, 'faq');
    return y;
  }

  close() { play('click'); this.scene.stop(); }
}
