// The lesson player, drawn by Phaser: one exercise at a time, Check -> feedback -> Continue.
// Wrong answers come back at the end. Items: Lightbulb (hint), Torch (try again), Potion (+1 heart).
import { up } from '../../i18n';
import { UIScene } from '../base';
import { useGame, MAX_HEARTS, type Reward } from '../../game/store';
import { NODE_BY_ID } from '../../course';
import type { Exercise } from '../../course/types';
import { linkStyle, teachBefore, type SessionItem } from '../../lesson/adapt';
import { NPC_BY_COURSE } from '../../pixel/art';
import { spriteTex } from '../../engine/textures';
import { ANIMS } from '../../components/anims';
import { ACHIEVEMENT_BY_ID } from '../../game/achievements';
import { anim, Button, sprite, text, iconTex, modal, ScrollView, UI, bigTitle, colorPanel, panel } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { drawBar, drawFrame } from '../../ui/draw';
import { C, N, FRAMES } from '../../ui/theme';
import { say, skyBackground } from '../kit';
import { buildSession, type SessionPlan, type Blocked } from './build';
import { choiceWidget, fillWidget, orderWidget, matchWidget, linkWidget, typeWidget, bugWidget, teachWidget, type ExWidget, type Verdict, type Status, type ExCtx } from './quiz';
import { codeExerciseWidget } from './code';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { openHelp, maybeTour, setHelpContext, noteStruggle } from '../help/helpers';

const PRAISE = ['Great job!', 'Excellent!', 'Nicely done!', 'Correct!', 'Well cast!', 'Splendid!', 'Huzzah!'];
const SELF_CHECKED = new Set(['code', 'sql', 'terminal']);
const QUIZ = new Set(['choice', 'fill', 'order', 'match', 'type', 'bug']);

interface QItem extends SessionItem { retry: number }
interface St {
  plan: SessionPlan | Blocked; queue: QItem[]; pos: number; status: Status; verdict: Verdict | null; doneCount: number; mistakes: number; combo: number;
  fails: number; showSolution: number; note: string | null; result: { reward: Reward | null; passed: boolean } | null; hintUsed: boolean; freeHints: number;
  wrongRun: number; refreshed: string[]; remark: string | null; missed: string[]; prevCombo: number; started: number; ws: Record<string, unknown>; checking: boolean;
  opened?: boolean; outShown?: boolean;
}

/** Destroys DOM pieces (editors, frames) kept by a code exercise. */
function cleanupDom(ws: Record<string, unknown>) {
  (ws.__editor as { destroy?: () => void } | undefined)?.destroy?.();
  (ws.__gridStop as (() => void) | undefined)?.();
  for (const k of ['__frame', '__grid', '__console', '__el']) (ws[k] as HTMLElement | undefined)?.remove();
}

function howTo(ex: Exercise, link: boolean): { icon: string; text: string } | null {
  switch (ex.t) {
    case 'choice':
      if (ex.options.length === 2 && ex.options[0] === 'True') return { icon: 'check', text: 'True or false? Tap one' };
      return { icon: 'target', text: ex.run ? 'Read the code, then tap what it prints' : 'Tap the right answer' };
    case 'fill': return { icon: 'hammer', text: ex.answers.length > 1 ? 'Tap tiles to fill the glowing gaps' : 'Tap the tile that fills the gap' };
    case 'order': return { icon: 'board', text: 'Tap the pieces in the right order' };
    case 'match': return link ? { icon: 'rune', text: 'Link each item to its partner: drag a rope, or tap both' } : { icon: 'swap', text: 'Tap an item on the left, then its partner on the right' };
    case 'type': return { icon: 'scroll', text: 'Type your answer, then press Check' };
    case 'bug': return { icon: 'bug', text: 'Tap the line with the bug' };
    default: return null;
  }
}

export class Lesson extends UIScene {
  private widget: ExWidget | null = null;
  private checkBtn: Button | null = null;
  constructor() { super('Lesson'); }
  /** Ctrl+Enter in a code editor. */
  checkNow = () => { void this.check(); };

  get st(): St {
    const s = this.p.st as unknown as St;
    if (!s.plan) {
      const plan = buildSession(this.p);
      Object.assign(s, {
        plan, queue: 'items' in plan ? plan.items.map((i) => ({ ...i, retry: 0 })) : [], pos: 0, status: 'answer', verdict: null, doneCount: 0, mistakes: 0, combo: 0,
        fails: 0, showSolution: 0, note: null, result: null, hintUsed: false, freeHints: 0, wrongRun: 0, refreshed: [], remark: 'items' in plan ? plan.note ?? null : null,
        missed: [], prevCombo: 0, started: Date.now(), ws: {}, checking: false,
      } satisfies St);
    }
    return s;
  }

  build() {
    this.widget?.destroy?.();
    this.widget = null;
    const st = this.st;
    this.events.once('shutdown', () => { if (!this.rebuilding) cleanupDom(st.ws); });
    const plan = st.plan;
    this.game.registry.set('debug:Lesson', () => ({ key: st.queue[st.pos]?.key ?? null, tag: st.queue[st.pos]?.tag ?? null, mode: 'mode' in plan ? plan.mode : null, note: 'note' in plan ? plan.note ?? null : null, review: !!st.result?.reward?.review, status: st.status, checking: !!st.checking, fails: st.fails, ready: this.widget?.ready() ?? false, result: !!st.result, passed: st.result?.passed, accuracy: st.result?.reward?.accuracy, blocked: 'blocked' in plan ? plan.blocked : null, link: this.isLink() }));
    if ('blocked' in plan || st.result) setHelpContext(this, { screen: 'Lesson', item: 'lesson-end', watch: false, button: 'lesson.help' });
    if ('blocked' in plan) return this.blocked(plan);
    if (st.result) return this.results();
    this.session(plan);
  }

  private isLink() {
    const st = this.st;
    const it = st.queue[st.pos];
    return !!it && it.ex.t === 'match' && linkStyle(it.key, it.ex.pairs.length);
  }

  // ---------------- blocked ----------------
  private blocked(b: Blocked) {
    const { W, H } = this;
    this.background('web');
    const w = Math.min(560, W - 24), h = 260;
    const x = (W - w) / 2, y = (H - h) / 2;
    panel(this, x, y, w, h);
    anim(this, W / 2 - 48, y + 14, b.action ? ANIMS.fairy : ANIMS.fairySad, 4, 96);
    text(this, W / 2, y + 120, b.blocked, 22, C.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0);
    let bx = x + 20;
    if (b.action) { const a = b.action; const btn = new Button(this, bx, y + h - 70, a.label, () => go(a.to), { variant: 'blue', id: 'blocked.action' }); bx += btn.bw + 10; }
    new Button(this, bx, y + h - 70, 'Back to the path', () => go('learn'), { variant: 'ghost', id: 'blocked.back' });
  }

  private background(courseId: string) { skyBackground(this, courseId, this.narrow ? 92 : 100); }

  // ---------------- the session ----------------
  private session(plan: SessionPlan) {
    const st = this.st;
    const { W, H } = this;
    const narrow = this.narrow;
    const item = st.queue[st.pos];
    if (!item) return;
    const ex = item.ex;
    const itemCourse = NODE_BY_ID[item.key.split('#')[0]]?.course.id ?? plan.courseId;
    this.background(itemCourse);
    const s = useGame.getState();
    const heartsOn = s.settings.hearts && plan.mode === 'lesson';
    const total = plan.items.filter((i) => i.tag !== 'refresher').length;
    const link = this.isLink();
    const self = SELF_CHECKED.has(ex.t);
    const quiz = QUIZ.has(ex.t);
    const wide = ex.t === 'code' || ex.t === 'sql' || ex.t === 'terminal';

    // ----- top bar -----
    const cw = wide ? Math.min(1400, W - 24) : Math.min(760, W - 24);
    const x0 = Math.round((W - cw) / 2);
    new Button(this, x0, 10, '', () => this.confirmQuit(), { variant: 'ghost', icon: 'x', w: 48, h: 46, id: 'lesson.quit' });
    const progress = Math.min(1, st.doneCount / total);
    const barG = this.add.graphics();
    const helpInBar = x0 - 66 < 0;
    const rightW = (heartsOn && s.hearts.n < MAX_HEARTS && s.items.potion > 0 ? 70 : 0) + 90 + (narrow ? 0 : 70) + (helpInBar ? 62 : 0);
    drawBar(barG, x0 + 60, 22, cw - 60 - rightW, 24, progress, '#6cc04a', '#4e9f35');
    let rx = x0 + cw - rightW + 10;
    if (!narrow) { text(this, rx, 18, `${Math.min(st.doneCount + (st.status === 'answer' && ex.t !== 'teach' ? 1 : 0), total)}/${total}`, 24, C.inkSoft); rx += 66; }
    if (heartsOn && s.hearts.n < MAX_HEARTS && s.items.potion > 0) {
      new Button(this, rx, 10, '', () => this.drinkPotion(), { variant: 'paper', sprite: 'potion', w: 60, h: 46, id: 'lesson.potion' });
      rx += 68;
    }
    sprite(this, rx, 16, 'heart', 32);
    text(this, rx + 36, 16, plan.mode === 'test' ? String(Math.max(0, (plan.maxMistakes ?? 3) + 1 - st.mistakes)) : heartsOn ? String(s.hearts.n) : '∞', 28, C.red, { fontStyle: 'bold' });
    if (st.combo >= 3) { sprite(this, x0 + cw / 2 - 40, 50, 'flameIcon', 24); text(this, x0 + cw / 2 - 12, 50, `${st.combo} in a row!`, 18, '#b8541a', { fontStyle: 'bold' }); }

    // ----- footer -----
    const footH = narrow ? (st.status === 'answer' ? 92 : 150) : 100;
    const fy = H - footH;
    const fg = this.add.graphics();
    fg.fillStyle(st.status === 'right' ? 0xcfe9b8 : st.status === 'wrong' ? 0xf6c9c2 : 0xe9d6a8).fillRect(0, fy, W, footH);
    fg.fillStyle(0x2b1a12).fillRect(0, fy, W, 6);
    fg.fillStyle(0xffffff, 0.5).fillRect(0, fy + 6, W, 3);

    // ----- body -----
    const sv = new ScrollView(this, 0, 66, W, fy - 70);
    const c = sv.content;
    const bx = x0;
    let y = 8;
    if (item.retry > 0) { c.add(this.add.image(bx, y + 2, iconTex(this, 'reset', C.redDark, 1))); c.add(text(this, bx + 18, y, 'PREVIOUS MISTAKE', 15, C.redDark, { fontStyle: 'bold' })); y += 24; }
    if (item.tag === 'warmup') { c.add(text(this, bx, y, 'WARM-UP: YOU MISSED THIS ONE BEFORE', 15, C.blueDark, { fontStyle: 'bold' })); y += 24; }
    if (st.remark) {
      const t = richTexture(this, st.remark, { width: cw - 90, size: 18, color: C.purple, bold: true });
      const g = this.add.graphics(); g.fillStyle(0xefe3ff, 0.95).fillRect(bx, y, cw, Math.max(52, t.h + 18)); g.lineStyle(3, N('#b58be0')).strokeRect(bx, y, cw, Math.max(52, t.h + 18));
      c.add(g);
      c.add(anim(this, bx + 6, y + 4, ANIMS.fairy, 4, 44));
      c.add(this.add.image(bx + 60, y + 10, t.key).setOrigin(0, 0));
      y += Math.max(52, t.h + 18) + 12;
    }
    const npc = NPC_BY_COURSE[itemCourse] ?? NPC_BY_COURSE.web;
    const asks = 'q' in ex && !self;
    if (asks && 'q' in ex) y += say(this, c, bx, y, cw, [...ANIMS.npcTalk(npc.id), ...ANIMS.npcTalk(npc.id), ...ANIMS.npcIdle(npc.id), ...ANIMS.npcIdle(npc.id)], ex.q, npc.name, { size: narrow ? 64 : 96, textSize: narrow ? 21 : 25 }).h + 14;
    if (ex.t === 'teach') y += say(this, c, bx, y, cw, [...ANIMS.npcTalk(npc.id), ...ANIMS.npcIdle(npc.id)], item.tag === 'refresher' ? 'Not to worry! Let us read this once more.' : 'Listen closely, adventurer! Here is something new.', `${npc.name} · ${npc.title}`, { size: narrow ? 64 : 96 }).h + 14;
    const how = howTo(ex, link);
    if (how && st.status === 'answer') {
      const t = text(this, 0, 0, up(how.text), narrow ? 15 : 17, C.inkSoft, { fontStyle: 'bold', wordWrap: { width: cw - 60 } });
      const hw = Math.min(cw, t.width + 56), hh = t.height + 14;
      const g = this.add.graphics(); g.fillStyle(0xfff6dc, 0.85).fillRect(bx, y, hw, hh); g.lineStyle(3, N('#b8955c')).strokeRect(bx, y, hw, hh);
      c.add([g, this.add.image(bx + 10, y + (hh - 24) / 2, iconTex(this, how.icon, C.inkSoft, 2)).setOrigin(0, 0)]);
      t.setPosition(bx + 44, y + 7);
      c.add(t);
      y += hh + 14;
    }
    const ctx: ExCtx = {
      scene: this, c, x: bx, y, w: cw, clip: sv, ws: st.ws, status: st.status,
      changed: () => this.updateCheck(), auto: (v) => this.judge(v), codeSize: Math.round((s.settings.classicCode ? 1 : 1.6) * Math.max(14, s.settings.fontSize)),
    };
    let w: ExWidget;
    switch (ex.t) {
      case 'teach': w = teachWidget(ctx, ex, item.tag === 'refresher'); break;
      case 'choice': w = choiceWidget(ctx, ex); break;
      case 'fill': w = fillWidget(ctx, ex); break;
      case 'order': w = orderWidget(ctx, ex); break;
      case 'match': w = link ? linkWidget(ctx, ex) : matchWidget(ctx, ex); break;
      case 'type': w = typeWidget(ctx, ex, () => { if (this.widget?.ready()) void this.check(); }); break;
      case 'bug': w = bugWidget(ctx, ex); break;
      default: w = codeExerciseWidget(ctx, ex, st.showSolution, fy - 70 - y - 10, (v) => this.judge(v)); break;
    }
    this.widget = w;
    y += w.h + 30;
    sv.setContentHeight(y);
    const sc = st as unknown as { scroll?: number };
    if (sc.scroll) sv.scrollTo(sc.scroll);
    this.events.once('shutdown', () => { sc.scroll = sv.scrollY; w.destroy?.(); });

    // ----- footer contents -----
    this.checkBtn = null;
    const inner = Math.min(1000, W - 24), ix = Math.round((W - inner) / 2);
    if (st.status === 'answer') {
      const bulbOk = plan.mode !== 'test' && quiz && !!w.hint && !st.hintUsed && (st.freeHints > 0 || s.items.bulb > 0);
      if (plan.mode !== 'test' && quiz) {
        const free = st.freeHints > 0 && !!w.hint && !st.hintUsed;
        const hb = new Button(this, ix, fy + (footH - 56) / 2 + 2, free ? 'Free hint' : `Hint · ${s.items.bulb}`, () => this.useBulb(), { variant: free ? 'blue' : 'paper', sprite: bulbOk ? 'bulbLit' : 'bulb', h: 54, size: 18, id: 'lesson.hint', disabled: !bulbOk });
        void hb;
      }
      if (self && st.fails >= 2 && !st.showSolution) new Button(this, ix + (quiz ? 200 : 0), fy + (footH - 56) / 2 + 2, 'Show solution', () => { st.showSolution++; play('page'); this.rebuild(); }, { variant: 'ghost', icon: 'eye', h: 54, size: 18, id: 'lesson.solution' });
      if (st.note) text(this, ix + (quiz ? 200 : self && st.fails >= 2 && !st.showSolution ? 230 : 0), fy + 14, st.note, 17, C.redDark, { fontStyle: 'bold', wordWrap: { width: inner - 480 } });
      if (!(ex.t === 'match' && !link)) {
        const label = ex.t === 'teach' ? 'Continue' : ex.t === 'code' || ex.t === 'sql' ? (st.checking ? 'Running…' : 'Run & check') : 'Check';
        const b = new Button(this, 0, 0, label, () => void this.check(), { variant: self ? 'blue' : 'green', w: narrow ? 170 : 220, h: 60, size: 24, id: ex.t === 'teach' ? 'lesson.continue' : 'lesson.check' });
        b.setPosition(ix + inner - b.bw, fy + (footH - 60) / 2 + 2);
        this.checkBtn = b;
        this.updateCheck();
      } else text(this, ix + inner, fy + footH / 2 - 12, 'Find all the pairs', 18, C.inkSoft).setOrigin(1, 0);
    } else {
      const right = st.status === 'right';
      anim(this, ix, fy + (narrow ? 12 : 14), right ? ANIMS.fairyCheer : ANIMS.fairySad, 4, narrow ? 48 : 72);
      const tx = ix + (narrow ? 56 : 84);
      const tw = inner - (narrow ? 56 : 84) - (narrow ? 0 : 280);
      text(this, tx, fy + 12, right ? PRAISE[(st.pos + st.doneCount) % PRAISE.length] : 'Not quite', narrow ? 24 : 28, right ? '#2f6a1e' : C.redDark, { fontStyle: 'bold' });
      let ty = fy + (narrow ? 40 : 46);
      const col = right ? '#2f6a1e' : C.redDark;
      const sol = !right && st.verdict?.solution ? richTexture(this, 'Correct answer: ' + st.verdict.solution, { width: tw, size: 16, color: col }) : null;
      const expl = 'explain' in ex && ex.explain ? richTexture(this, ex.explain, { width: tw, size: 15, color: col }) : null;
      const maxH = footH - (ty - fy) - 4;
      let used = 0;
      for (const t of [sol, expl]) { if (!t || used >= maxH) continue; const img = this.add.image(tx, ty, t.key).setOrigin(0, 0); if (used + t.h > maxH) img.setCrop(0, 0, t.w, maxH - used); ty += t.h + 2; used += t.h + 2; }
      if ((sol?.h ?? 0) + (expl?.h ?? 0) > maxH) {
        new Button(this, tx + tw - 130, fy + 8, 'Read more', () => this.showFeedback(sol?.key, expl?.key), { variant: 'paper', size: 14, w: 120, h: 34, id: 'lesson.more' });
      }
      const cont = new Button(this, 0, 0, 'Continue', () => this.next(), { variant: right ? 'green' : 'red', w: narrow ? 170 : 220, h: 60, size: 24, id: 'lesson.continue' });
      cont.setPosition(ix + inner - cont.bw, narrow ? fy + footH - 70 : fy + (footH - 60) / 2 + 2);
      if (!right && plan.mode !== 'test' && quiz && s.items.torch > 0) {
        const tb = new Button(this, 0, 0, `Retry · ${s.items.torch}`, () => this.useTorch(), { variant: 'paper', sprite: 'torchItem', h: 60, size: 18, id: 'lesson.torch' });
        tb.setPosition(cont.x - tb.bw - 10, cont.y);
      }
    }

    // keys: Enter = check/continue, H = hint
    this.input.keyboard?.on('keydown-ENTER', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('.cm-editor, .term-box') || this.children.getByName('modal')) return;
      if (st.status === 'answer') { if (ex.t === 'teach' || this.widget?.ready()) void this.check(); } else this.next();
    });
    this.input.keyboard?.on('keydown-H', (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName !== 'INPUT' && !(e.target as HTMLElement)?.closest?.('.cm-editor')) this.useBulb(); });
    // out of hearts
    if (heartsOn && s.hearts.n <= 0 && !st.result) this.outOfHearts();
    // help: Lumi's button, first-visit tour, "stuck" detection
    new Button(this, helpInBar ? x0 + cw - 56 : x0 - 66, 10, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 56, h: 46, id: 'lesson.help' });
    const screen = wide ? 'Lesson:code' : 'Lesson';
    setHelpContext(this, { screen, type: link ? 'link' : ex.t, item: item.key, watch: st.status === 'answer', button: 'lesson.help' });
    if (ex.t !== 'teach' || st.pos > 0) maybeTour(this, screen);
  }

  private updateCheck() {
    const st = this.st;
    const it = st.queue[st.pos];
    if (!this.checkBtn || !it) return;
    const self = SELF_CHECKED.has(it.ex.t);
    this.checkBtn.setEnabled(it.ex.t === 'teach' || self ? !st.checking : !!this.widget?.ready());
  }

  // ---------------- logic (ported from the React lesson player) ----------------
  private judge(v: Verdict) {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    const item = st.queue[st.pos];
    const s = useGame.getState();
    const heartsOn = s.settings.hearts && plan.mode === 'lesson';
    st.verdict = v;
    st.remark = null;
    if (v.correct) {
      st.status = 'right'; st.doneCount++; st.combo++; st.wrongRun = 0;
      s.clearMistake(item.key);
      play('correct');
      if (v.mistakes) st.mistakes += v.mistakes;
    } else {
      st.status = 'wrong';
      st.prevCombo = st.combo; st.combo = 0;
      st.mistakes++;
      st.missed.push(item.key);
      s.noteMistake(item.key);
      noteStruggle(this, item.key);
      play('wrong');
      if (heartsOn) s.loseHeart();
      if (plan.mode !== 'test') {
        const run = st.wrongRun + 1;
        const refresher = run >= 2 ? teachBefore(item.key) : null;
        const useRef = !!refresher && !st.refreshed.includes(refresher.key);
        st.wrongRun = useRef ? 0 : run;
        if (useRef && refresher) { st.refreshed.push(refresher.key); st.freeHints++; }
        if (item.retry < 2) st.queue.push({ ...item, retry: item.retry + 1, tag: undefined });
        if (useRef && refresher) st.queue.splice(st.pos + 1, 0, { ...refresher, retry: 0 });
      }
    }
    this.rebuild();
  }

  private async check() {
    const st = this.st;
    const item = st.queue[st.pos];
    if (!item || st.status !== 'answer' || st.checking) return;
    if (item.ex.t === 'teach') { this.next(); return; }
    if (!this.widget) return;
    st.checking = true;
    this.updateCheck();
    const v = await this.widget.check();
    st.checking = false;
    if (SELF_CHECKED.has(item.ex.t) && !v.correct) {
      st.fails++;
      noteStruggle(this, item.key);
      st.note = item.ex.t === 'terminal' ? 'Not there yet. Keep typing commands until the goal is reached.' : 'Not yet! Read the results, fix your code and try again.';
      this.rebuild();
      return;
    }
    st.note = null;
    this.judge(v);
  }

  private next() {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    const item = st.queue[st.pos];
    if (plan.mode === 'test' && st.mistakes > (plan.maxMistakes ?? 3)) { this.finish(false); return; }
    if (item?.ex.t === 'teach' && item.tag !== 'refresher') st.doneCount++;
    const n = st.pos + 1;
    if (n >= st.queue.length) { this.finish(true); return; }
    const prevWrong = st.status === 'wrong';
    cleanupDom(st.ws);
    st.pos = n; st.status = 'answer'; st.verdict = null; st.fails = 0; st.showSolution = 0; st.note = null; st.hintUsed = false; st.ws = {};
    (st as unknown as { scroll?: number }).scroll = 0;
    const up = st.queue[n];
    const g = useGame.getState();
    const coach = prevWrong && plan.mode !== 'test' && !g.stats.bulbsUsed && g.items.bulb > 0 && QUIZ.has(up.ex.t);
    st.remark = up.tag === 'refresher' ? 'Let us look at this again. Your next lightbulb is free!' : coach ? 'Stuck? Tap the lightbulb at the bottom (or press H) for a hint.' : null;
    this.rebuild();
  }

  private finish(passed: boolean) {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    const extra = plan.onFinish?.(passed, st.mistakes);
    let reward: Reward | null = null;
    const s = useGame.getState();
    if (passed) {
      const correct = plan.items.filter((i) => i.ex.t !== 'teach').length;
      reward = s.finishLesson({ nodeId: plan.nodeId, courseId: plan.courseId, correct, total: correct, mistakes: st.mistakes, kind: plan.kind, missed: st.missed, seconds: Math.round((Date.now() - st.started) / 1000), ...(extra || {}) });
      if (plan.mode === 'practice' || plan.mode === 'review') s.gainHeart();
      play('victory');
    } else play('fail');
    st.result = { reward, passed };
    this.rebuild();
  }

  private useBulb() {
    const st = this.st;
    const w = this.widget;
    const plan = st.plan as SessionPlan;
    if (!w?.hint || st.hintUsed || st.status !== 'answer' || plan.mode === 'test') return;
    const s = useGame.getState();
    const free = st.freeHints > 0;
    if (!free && s.items.bulb <= 0) { st.note = 'No lightbulbs left. Win minigames on the path to earn more!'; this.rebuild(); return; }
    if (!w.hint()) return;
    if (free) st.freeHints--; else s.useItem('bulb');
    st.hintUsed = true;
    play('hint');
    this.rebuild();
    this.after(60, () => this.fx('bulbLit'));
  }

  private useTorch() {
    const st = this.st;
    const s = useGame.getState();
    const plan = st.plan as SessionPlan;
    if (st.status !== 'wrong' || !s.useItem('torch')) return;
    play('whoosh');
    if (s.settings.hearts && plan.mode === 'lesson') s.gainHeart();
    const item = st.queue[st.pos];
    st.mistakes = Math.max(0, st.mistakes - 1);
    st.missed.pop();
    if (item.retry < 2) { const i = st.queue.map((q) => q.key).lastIndexOf(item.key); if (i > st.pos) st.queue.splice(i, 1); }
    st.combo = st.prevCombo;
    st.status = 'answer'; st.verdict = null; st.ws = {};
    st.remark = 'The torch lights the way: try again, no harm done.';
    this.rebuild();
    this.after(60, () => this.fx('torchItem'));
  }

  private drinkPotion() {
    if (!useGame.getState().useItem('potion')) return;
    play('drink');
    this.rebuild();
    this.after(60, () => this.fx('potion'));
  }

  private fx(name: string) {
    const img = this.add.image(this.W / 2, this.H * 0.45, spriteTex(this, name)).setScale(4).setDepth(2000).setAlpha(0);
    this.tweens.add({ targets: img, alpha: 1, scale: 6, y: img.y - 30, duration: 250, yoyo: true, hold: 300, onComplete: () => img.destroy() });
  }

  private showFeedback(sol?: string, expl?: string) {
    modal(this, 720, (c, w, close) => {
      let y = 24;
      for (const k of [sol, expl]) if (k) { const img = this.add.image(24, y, k).setOrigin(0, 0); c.add(img); y += img.height + 10; }
      c.add(new Button(this, w - 150, y + 6, 'Close', close, { variant: 'ghost', w: 126, id: 'feedback.close' }));
      return y + 70;
    });
  }

  private confirmQuit() {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    modal(this, 460, (c, w, close) => {
      c.add(anim(this, w / 2 - 48, 18, ANIMS.fairySad, 4, 96));
      c.add(text(this, w / 2, 124, "Wait, don't go!", 30, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      c.add(text(this, w / 2, 164, `You will lose your progress in this ${plan.mode === 'test' ? 'test' : 'lesson'}.`, 18, C.inkSoft, { align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0));
      c.add(new Button(this, 24, 210, 'Keep learning', close, { variant: 'blue', w: w - 48, id: 'quit.stay' }));
      c.add(new Button(this, 24, 272, 'End session', () => go(plan.exitTo), { variant: 'ghost', w: w - 48, id: 'quit.leave' }));
      return 344;
    }).c.setName('modal');
  }

  private outOfHearts() {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    const s = useGame.getState();
    const m = modal(this, 520, (c, w) => {
      c.add(anim(this, w / 2 - 48, 16, ANIMS.fairySad, 4, 96));
      c.add(text(this, w / 2, 118, 'You ran out of hearts', 28, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      c.add(text(this, w / 2, 156, 'Hearts come back over time (one every 20 minutes). Drink a potion, refill them with gold, or earn them back by practising.', 18, C.inkSoft, { align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0));
      let y = 236;
      if (s.items.potion > 0) { c.add(new Button(this, 24, y, `Drink a potion (${s.items.potion} left)`, () => this.drinkPotion(), { variant: 'purple', sprite: 'potion', w: w - 48, id: 'hearts.potion' })); y += 62; }
      c.add(new Button(this, 24, y, 'Refill for 50 gold', () => { if (useGame.getState().refillHearts(50)) { play('coin'); this.rebuild(); } }, { variant: 'gold', w: w - 48, id: 'hearts.refill', disabled: s.gold < 50 })); y += 62;
      c.add(new Button(this, 24, y, 'Practice to earn hearts', () => go('practice'), { variant: 'blue', w: w - 48, id: 'hearts.practice' })); y += 62;
      c.add(new Button(this, 24, y, 'Quit lesson', () => go(plan.exitTo), { variant: 'ghost', w: w - 48, id: 'hearts.quit' })); y += 62;
      c.add(text(this, w / 2, y, 'Tip: turn on Relaxed mode in Settings for unlimited hearts.', 15, C.muted).setOrigin(0.5, 0));
      return y + 40;
    }, { closable: false });
    m.c.setName('modal');
  }

  // ---------------- results ----------------
  private results() {
    const st = this.st;
    const plan = st.plan as SessionPlan;
    const { W, H } = this;
    this.background('career');
    const r = st.result!;
    const cw = Math.min(640, W - 24), x0 = (W - cw) / 2;
    const footH = 100;
    const fy = H - footH;
    const fg = this.add.graphics();
    fg.fillStyle(0xe9d6a8).fillRect(0, fy, W, footH); fg.fillStyle(0x2b1a12).fillRect(0, fy, W, 6);
    const sv = new ScrollView(this, 0, 10, W, fy - 14);
    const c = sv.content;
    let y = 10;
    if (!r.passed) {
      c.add(panel(this, x0, y + 40, cw, 260));
      c.add(anim(this, W / 2 - 60, y + 56, ANIMS.fairySad, 4, 120));
      c.add(bigTitle(this, W / 2, y + 180, 'Not this time', 44, C.ink));
      c.add(text(this, W / 2, y + 236, plan.mode === 'test' ? 'Too many mistakes to skip ahead. No problem: the lessons will teach you what you need, step by step.' : 'Try again when you are ready.', 18, C.inkSoft, { align: 'center', wordWrap: { width: cw - 40 } }).setOrigin(0.5, 0));
      y += 320;
    } else {
      const rw = r.reward;
      c.add(anim(this, W / 2 - 150, y + 20, ANIMS.fairyCheer, 4, 120));
      const chest = sprite(this, W / 2 + 20, y + 20, 'chest', 120);
      c.add(chest);
      this.tweens.add({ targets: chest, x: chest.x - 4, duration: 80, yoyo: true, repeat: 4, onComplete: () => {
        chest.setTexture(spriteTex(this, 'chestOpen'));
        play('coin');
        for (let i = 0; i < 10; i++) {
          const coin = sprite(this, W / 2 + 65, y + 60, i % 3 === 0 ? 'gem' : 'coin', 30);
          c.add(coin);
          this.tweens.add({ targets: coin, x: coin.x + (i - 4.5) * 24, y: coin.y - 110, duration: 500, ease: 'Quad.easeOut', onComplete: () => this.tweens.add({ targets: coin, y: coin.y + 70, alpha: 0, duration: 400 }) });
        }
      } });
      y += 150;
      const heading = plan.mode === 'test' ? 'Unit unlocked!' : plan.mode === 'practice' ? 'Practice complete!' : plan.mode === 'review' ? 'Review complete!' : 'Lesson complete!';
      c.add(bigTitle(this, W / 2, y, heading, this.narrow ? 44 : 60));
      y += this.narrow ? 60 : 76;
      c.add(text(this, W / 2, y, plan.title, 20, C.inkSoft, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      y += 40;
      if (rw) {
        const stats: [string, string, string, string][] = [['Total XP', `${rw.xp}`, '#e7a72c', 'starIcon'], [rw.accuracy === 100 ? 'Perfect!' : 'Accuracy', `${rw.accuracy}%`, '#5aa83c', ''], ['Gold', `+${rw.gold}`, '#a86e16', 'coin']];
        const pw = Math.min(150, (cw - 24) / 3);
        stats.forEach(([h, v, col, spr], i) => {
          const px = W / 2 - (pw * 3 + 24) / 2 + i * (pw + 12);
          c.add(colorPanel(this, px, y, pw, 100, col));
          c.add(text(this, px + pw / 2, y + 12, up(h), 14, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5, 0));
          const g = this.add.graphics(); g.fillStyle(0xfdf6e3).fillRect(px + 12, y + 36, pw - 24, 48); c.add(g);
          if (spr) c.add(sprite(this, px + 18, y + 44, spr, 30));
          c.add(text(this, px + pw / 2 + (spr ? 14 : 0), y + 44, v, 28, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
        });
        y += 116;
        const notes: [string, string][] = [];
        if (rw.review) notes.push(['fairy', '**Lumi added a review stop to your path.** A short refresher on this lesson before the next one. Reviews never cost hearts.']);
        if (plan.mode === 'review') notes.push(['check', '**The path ahead is open again!**']);
        if (rw.streakUp) notes.push(['flameIcon', `**${rw.streak}-day streak!**`]);
        if (rw.goalReached) notes.push(['starIcon', '**Daily goal reached!**']);
        if (rw.levelAfter > rw.levelBefore) notes.push(['crown', `**Level up!** You are now level ${rw.levelAfter}.`]);
        if (plan.mode === 'practice' || plan.mode === 'review') notes.push(['heart', '**+1 heart** for practising']);
        for (const id of rw.achievements) notes.push(['trophy', `**${ACHIEVEMENT_BY_ID[id]?.name}**: ${ACHIEVEMENT_BY_ID[id]?.desc}`]);
        for (const [spr, md] of notes) {
          const t = richTexture(this, md, { width: cw - 90, size: 18 });
          const nh = Math.max(56, t.h + 20);
          c.add(panel(this, x0, y, cw, nh));
          if (spr === 'check' || spr === 'crown' || spr === 'trophy') c.add(this.add.image(x0 + 22, y + nh / 2, iconTex(this, spr, C.goldDark, 2)).setOrigin(0, 0.5));
          else c.add(sprite(this, x0 + 14, y + (nh - 40) / 2, spr, 40));
          c.add(this.add.image(x0 + 68, y + (nh - t.h) / 2, t.key).setOrigin(0, 0));
          y += nh + 8;
        }
      }
    }
    sv.setContentHeight(y + 20);
    const b = new Button(this, 0, 0, 'Continue', () => go(plan.exitTo), { variant: 'green', w: 220, h: 60, size: 24, id: 'results.continue' });
    b.setPosition(Math.round((W - Math.min(1000, W - 24)) / 2 + Math.min(1000, W - 24) - b.bw), fy + 22);
    this.input.keyboard?.on('keydown-ENTER', () => go(plan.exitTo));
    void FRAMES; void drawFrame; void UI;
  }
}
