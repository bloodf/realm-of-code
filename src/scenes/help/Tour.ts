// Step-by-step guided tour: the screen is dimmed except for one button or area, and
// Lumi explains it in a speech bubble. Back / Next / Skip, or the arrow keys and Esc.
import { UIScene } from '../base';
import { SCREEN_HELP, type TourStep } from './content';
import { pauseUnder, domRects, overlaps, cutOut, type Rect } from './helpers';
import { useGame } from '../../game/store';
import { ANIMS } from '../../components/anims';
import { anim, Button, text, UI } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { drawFrame } from '../../ui/draw';
import { C, FRAMES } from '../../ui/theme';
import { play } from '../../audio/sound';

interface St { i: number; dir: number; revealed?: number }

export class Tour extends UIScene {
  constructor() { super('Tour'); }

  private get screen() { return String(this.p.screen ?? 'World'); }
  private get steps(): TourStep[] { return SCREEN_HELP[this.screen]?.steps ?? []; }

  private find(s: TourStep): Rect | null {
    if (!s.target) return null;
    for (const id of ([] as string[]).concat(s.target)) {
      const r = UI.rect(id);
      if (r && r.w > 2 && r.h > 2) return r;
    }
    return null;
  }
  private usable(s: TourStep) { return !s.target || !!this.find(s) || this.revealable(s); }
  /** A target that exists but is out of view (another part of the village, a scrolled list). */
  private revealable(s: TourStep) { return !!s.target && ([] as string[]).concat(s.target).some((id) => !!UI.get(id)?.reveal); }

  build() {
    const st = this.p.st as unknown as St;
    st.i ??= 0; st.dir ??= 1;
    if (!this.p.__resume) this.p.__resume = pauseUnder(this.game, []);
    this.events.once('shutdown', () => {
      this.undim();
      if (!this.rebuilding) (this.p.__resume as () => void)();
    });
    const steps = this.steps;
    // skip steps whose button is not on screen right now
    let i = st.i;
    while (i >= 0 && i < steps.length && !this.usable(steps[i])) i += st.dir;
    if (i < 0) { i = 0; while (i < steps.length && !this.usable(steps[i])) i++; }
    if (i >= steps.length) { this.finish(); return; }
    st.i = i;
    const usable = steps.map((s) => this.usable(s));
    const n = usable.filter(Boolean).length;
    const k = usable.slice(0, i + 1).filter(Boolean).length;
    const step = steps[i];
    const { W, H } = this;
    let target = this.find(step);
    const inView = (r: Rect | null) => !!r && r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;
    if (step.target && st.revealed !== i && !inView(target)) {
      // bring it into view first (e.g. move the village camera), then draw this step
      const id = ([] as string[]).concat(step.target).find((t) => UI.get(t)?.reveal);
      if (id) {
        st.revealed = i;
        UI.get(id)!.reveal!();
        this.add.rectangle(0, 0, W, H, 0x1c110a, 0.62).setOrigin(0, 0).setInteractive();
        this.time.delayedCall(80, () => this.rebuild());
        return;
      }
    }
    target = target ?? this.find(step);
    if (step.target && !target) { st.i += st.dir; this.time.delayedCall(0, () => this.rebuild()); return; }

    // ----- dim everything but the hole -----
    const hole = target ? { x: Math.max(0, target.x - 8), y: Math.max(0, target.y - 8), w: Math.min(W, target.w + 16), h: Math.min(H, target.h + 16) } : null;
    const dim = (x: number, y: number, w: number, h: number) => { if (w > 0 && h > 0) this.add.rectangle(x, y, w, h, 0x1c110a, 0.62).setOrigin(0, 0).setInteractive(); };
    if (hole) {
      dim(0, 0, W, hole.y);
      dim(0, hole.y + hole.h, W, H - hole.y - hole.h);
      dim(0, hole.y, hole.x, hole.h);
      dim(hole.x + hole.w, hole.y, W - hole.x - hole.w, hole.h);
      this.add.zone(hole.x, hole.y, hole.w, hole.h).setOrigin(0, 0).setInteractive();
      const ring = this.add.graphics();
      ring.lineStyle(4, 0x1c110a).strokeRect(hole.x - 2, hole.y - 2, hole.w + 4, hole.h + 4);
      ring.lineStyle(4, 0xffd66b).strokeRect(hole.x + 2, hole.y + 2, hole.w - 4, hole.h - 4);
      this.tweens.add({ targets: ring, alpha: 0.35, duration: 520, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
    } else dim(0, 0, W, H);
    this.dimDom(hole);

    // ----- Lumi's bubble -----
    const bw = Math.min(440, W - 24);
    const pad = 16, fairyS = this.narrow ? 52 : 64;
    const tw = bw - pad * 2 - fairyS - 10;
    const c = this.add.container(0, 0);
    const titleT = text(this, pad + fairyS + 10, pad - 2, step.title, this.narrow ? 22 : 25, C.ink, { fontStyle: 'bold', wordWrap: { width: tw } });
    const body = richTexture(this, step.text, { width: tw, size: this.narrow ? 17 : 19 });
    let y = pad - 2 + titleT.height + 6;
    const bodyImg = this.add.image(pad + fairyS + 10, y, body.key).setOrigin(0, 0);
    y += body.h + 14;
    const btnY = y;
    const bh = btnY + 46 + pad;
    const g = this.add.graphics();
    drawFrame(g, 0, 0, bw, bh, FRAMES.bubble);
    c.add([g, anim(this, pad - 4, pad, k === n ? ANIMS.fairyCheer : ANIMS.fairy, 4, fairyS), titleT, bodyImg]);
    c.add(text(this, pad, btnY + 14, `${k} / ${n}`, 17, C.inkSoft, { fontStyle: 'bold' }));
    const next = new Button(this, 0, btnY, k === n ? 'Got it!' : 'Next', () => this.go(1), { variant: 'green', h: 46, size: 18, id: 'tour.next', icon: k === n ? 'check' : 'next' });
    next.x = bw - pad - next.bw;
    c.add(next);
    let bx = next.x - 8;
    if (k > 1) { const back = new Button(this, 0, btnY, '', () => this.go(-1), { variant: 'paper', icon: 'back', w: 50, h: 46, id: 'tour.back' }); bx -= back.bw; back.x = bx; bx -= 8; c.add(back); }
    if (k < n) { const skip = new Button(this, 0, btnY, 'Skip', () => this.finish(), { variant: 'ghost', h: 46, size: 16, id: 'tour.skip' }); bx -= skip.bw; skip.x = bx; c.add(skip); }

    // place it next to the hole, away from DOM pieces (they would cover it)
    const doms = domRects(this.game).filter((d) => !hole || !overlaps(d, hole));
    const fits = (r: Rect) => r.x >= 8 && r.y >= 8 && r.x + r.w <= W - 8 && r.y + r.h <= H - 8;
    const clampX = (x: number) => Math.max(8, Math.min(W - bw - 8, x));
    const clampY = (y: number) => Math.max(8, Math.min(H - bh - 8, y));
    let pos: { x: number; y: number; side: string } | null = null;
    if (hole) {
      const cx = hole.x + hole.w / 2, cy = hole.y + hole.h / 2;
      const xs = [clampX(cx - bw / 2), clampX(hole.x), clampX(hole.x + hole.w - bw)];
      const cands = [
        ...xs.map((x) => ({ x, y: hole.y + hole.h + 18, side: 'below' })),
        ...xs.map((x) => ({ x, y: hole.y - bh - 18, side: 'above' })),
        { x: hole.x + hole.w + 18, y: clampY(cy - bh / 2), side: 'right' },
        { x: hole.x - bw - 18, y: clampY(cy - bh / 2), side: 'left' },
      ];
      const ok = (p: { x: number; y: number }, strict: boolean) => { const r = { x: p.x, y: p.y, w: bw, h: bh }; return fits(r) && !overlaps(r, hole) && (!strict || !doms.some((d) => overlaps(r, d, 4))); };
      pos = cands.find((p) => ok(p, true)) ?? cands.find((p) => ok(p, false)) ?? null;
      if (!pos) pos = { x: clampX(cx - bw / 2), y: hole.y + hole.h / 2 > H / 2 ? 12 : H - bh - 12, side: 'none' };
      // a bouncing arrow pointing at the hole
      const a = this.add.graphics();
      a.fillStyle(0xffd66b).lineStyle(3, 0x1c110a);
      const tri = (pts: number[]) => { a.fillTriangle(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]); a.strokeTriangle(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]); };
      const ax = Math.max(pos.x + 24, Math.min(pos.x + bw - 24, cx));
      const ay = Math.max(pos.y + 24, Math.min(pos.y + bh - 24, cy));
      if (pos.side === 'below') tri([ax - 14, pos.y - 2, ax + 14, pos.y - 2, ax, pos.y - 16]);
      else if (pos.side === 'above') tri([ax - 14, pos.y + bh + 2, ax + 14, pos.y + bh + 2, ax, pos.y + bh + 16]);
      else if (pos.side === 'right') tri([pos.x - 2, ay - 14, pos.x - 2, ay + 14, pos.x - 16, ay]);
      else if (pos.side === 'left') tri([pos.x + bw + 2, ay - 14, pos.x + bw + 2, ay + 14, pos.x + bw + 16, ay]);
      this.tweens.add({ targets: a, x: pos.side === 'right' ? -5 : pos.side === 'left' ? 5 : 0, y: pos.side === 'below' ? -5 : pos.side === 'above' ? 5 : 0, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    } else {
      pos = { x: Math.round((W - bw) / 2), y: Math.round((H - bh) / 2), side: 'none' };
      const strict = domRects(this.game);
      if (strict.some((d) => overlaps({ x: pos!.x, y: pos!.y, w: bw, h: bh }, d))) pos.y = 12;
    }
    c.setPosition(Math.round(pos.x), Math.round(pos.y));
    // DOM pieces (editors) would cover the bubble: cut a window out of them for this step
    const undo: (() => void)[] = [];
    for (const d of domRects(this.game)) if (overlaps(d, { x: pos.x, y: pos.y, w: bw, h: bh })) undo.push(cutOut(d.el.node as HTMLElement, { x: pos.x - 4, y: pos.y - 4, w: bw + 8, h: bh + 8 }));
    this.events.once('shutdown', () => undo.forEach((f) => f()));
    c.setScale(0.94); this.tweens.add({ targets: c, scale: 1, duration: 120, ease: 'Back.easeOut' });

    this.input.keyboard?.on('keydown-ESC', () => this.finish());
    this.input.keyboard?.on('keydown-RIGHT', () => this.go(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.go(1));
    this.input.keyboard?.on('keydown-LEFT', () => { if (k > 1) this.go(-1); });
    this.game.registry.set('debug:Tour', () => ({ screen: this.screen, step: k, of: n, title: step.title, target: !!target }));
  }

  private go(d: number) {
    const st = this.p.st as unknown as St;
    st.dir = d; st.i += d;
    play('page');
    if (st.i >= this.steps.length) { this.finish(); return; }
    this.rebuild();
  }

  private finish() {
    useGame.getState().markTour(this.screen);
    this.scene.stop();
  }

  // DOM pieces (code editors...) sit above the canvas, so the dimming is done with CSS.
  private dimDom(hole: Rect | null) {
    this.undim();
    const list: HTMLElement[] = [];
    for (const d of domRects(this.game)) {
      const el = d.el.node as HTMLElement;
      if (hole && overlaps(d, hole, -20)) continue;
      el.classList.add('tour-dim');
      list.push(el);
    }
    this.p.__dimmed = list;
  }
  private undim() { for (const el of (this.p.__dimmed as HTMLElement[] | undefined) ?? []) el.classList.remove('tour-dim'); this.p.__dimmed = []; }
}
