// Lumi's little pop-ups next to the help button: "First time here? Want a tour?" and
// "Stuck? I can help!" (after a long pause or a few failed tries). Always on top.
import Phaser from 'phaser';
import { SCREEN_HELP } from './content';
import { helpScreen, helpButtonId, openHelp, startTour, domRects, overlaps, cutOut, type Rect } from './helpers';
import { ANIMS } from '../../components/anims';
import { anim, Button, UI } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { drawFrame } from '../../ui/draw';
import { FRAMES } from '../../ui/theme';
import { play } from '../../audio/sound';

const IDLE_MS = 45_000;

export class Coach extends Phaser.Scene {
  private card: Phaser.GameObjects.Container | null = null;
  private hideAt = 0;
  private last = Date.now();
  private peeked = new Set<string>();
  private current: { kind: string; arg: string } | null = null;
  constructor() { super({ key: 'Coach' }); }

  create() {
    const touch = () => { this.last = Date.now(); };
    const evs = ['pointerdown', 'keydown', 'wheel'];
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true, capture: true }));
    const onOffer = (id: string) => this.show('offer', id);
    const onStuck = (why: string) => { const { ctx } = helpScreen(); const key = (ctx.item ?? '?') + ':' + why; if (why === 'struggle' || !this.peeked.has(key)) { this.peeked.add(key); this.show('stuck', why); } };
    const onHide = () => this.hide();
    const onItem = () => { if (this.current?.kind === 'stuck') this.hide(); };
    this.game.events.on('coach:offer', onOffer);
    this.game.events.on('coach:stuck', onStuck);
    this.game.events.on('coach:hide', onHide);
    this.game.events.on('director:show', onHide);
    this.game.events.on('help:item', onItem);
    const tick = this.time.addEvent({ delay: 2000, loop: true, callback: () => this.check() });
    const onResize = () => { if (this.current) { const c = this.current; this.hide(); this.show(c.kind, c.arg, true); } };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => {
      evs.forEach((e) => window.removeEventListener(e, touch, { capture: true }));
      this.game.events.off('coach:offer', onOffer); this.game.events.off('coach:stuck', onStuck); this.game.events.off('coach:hide', onHide);
      this.game.events.off('director:show', onHide); this.game.events.off('help:item', onItem);
      this.scale.off('resize', onResize); tick.remove();
    });
    (window as unknown as { __coach: unknown }).__coach = { idle: (ms: number) => { this.last = Date.now() - ms; this.check(); }, state: () => this.current };
  }

  private check() {
    if (this.card && this.hideAt && Date.now() > this.hideAt) this.hide();
    if (this.card || this.game.scene.isActive('HelpPanel') || this.game.scene.isActive('Tour')) return;
    const { ctx } = helpScreen();
    if (!ctx.watch || Date.now() - this.last < IDLE_MS) return;
    const key = (ctx.item ?? '?') + ':idle';
    if (this.peeked.has(key)) return;
    this.peeked.add(key);
    this.show('stuck', 'idle');
  }

  private undo: (() => void)[] = [];

  hide() {
    this.undo.forEach((f) => f());
    this.undo = [];
    this.card?.destroy();
    this.card = null;
    this.current = null;
    this.hideAt = 0;
  }

  private show(kind: string, arg: string, silent = false) {
    if (this.game.scene.isActive('HelpPanel') || this.game.scene.isActive('Tour')) return;
    this.hide();
    this.current = { kind, arg };
    const W = this.scale.width, H = this.scale.height;
    const w = Math.min(340, W - 16);
    const c = this.add.container(0, 0).setDepth(10);
    const pad = 12, es = 48;
    const tw = w - pad * 2 - es - 8;
    const screen = SCREEN_HELP[arg];
    const msg = kind === 'offer'
      ? `**First time in ${screen ? screen.title.replace(/^(The|A|An|Your) /, (m) => m.toLowerCase()) : 'here'}?** Want me to show you around? It takes 30 seconds.`
      : arg === 'struggle' ? '**That one is tricky!** Want a tip? I can explain how it works or give you a hint.'
        : '**Stuck?** Take your time. If you want, I can give you a tip.';
    const t = richTexture(this, msg, { width: tw, size: 18 });
    const btnY = pad + Math.max(es, t.h) + 10;
    const h = btnY + 42 + pad;
    const g = this.add.graphics();
    drawFrame(g, 0, 0, w, h, FRAMES.bubble);
    c.add([g, anim(this, pad - 2, pad, kind === 'offer' ? ANIMS.fairyCheer : ANIMS.fairy, 4, es), this.add.image(pad + es + 8, pad, t.key).setOrigin(0, 0)]);
    const yes = new Button(this, 0, btnY, kind === 'offer' ? 'Show me' : 'Help me', () => {
      this.hide();
      if (kind === 'offer') startTour(this.game, arg);
      else openHelp(this, 'stuck');
    }, { variant: 'green', h: 42, size: 17, id: 'coach.yes' });
    yes.x = w - pad - yes.bw;
    const no = new Button(this, 0, btnY, kind === 'offer' ? 'Not now' : 'No thanks', () => this.hide(), { variant: 'ghost', h: 42, size: 16, id: 'coach.no' });
    no.x = yes.x - 8 - no.bw;
    c.add([yes, no]);
    // next to the help button, away from code editors and other DOM pieces
    const btn = UI.rect(helpButtonId());
    const doms = domRects(this.game);
    const fits = (r: Rect) => r.x >= 6 && r.y >= 6 && r.x + r.w <= W - 6 && r.y + r.h <= H - 6;
    const free = (r: Rect) => fits(r) && !doms.some((d) => overlaps(r, d, 4)) && (!btn || !overlaps(r, btn));
    let pos: { x: number; y: number } | null = null;
    if (btn) {
      const cands = [
        { x: btn.x + btn.w - w, y: btn.y + btn.h + 14 }, { x: btn.x, y: btn.y + btn.h + 14 },
        { x: btn.x - w - 14, y: btn.y }, { x: btn.x + btn.w + 14, y: btn.y },
        { x: btn.x + btn.w - w, y: btn.y - h - 14 }, { x: btn.x, y: btn.y - h - 14 },
      ].map((p) => ({ x: Math.max(6, Math.min(W - w - 6, p.x)), y: p.y }));
      pos = cands.find((p) => free({ ...p, w, h })) ?? null;
    }
    if (!pos) {
      const cands = [{ x: 10, y: H - h - 90 }, { x: (W - w) / 2, y: 70 }, { x: W - w - 10, y: 80 }, { x: 10, y: 80 }];
      pos = cands.find((p) => free({ ...p, w, h })) ?? cands[1];
    }
    c.setPosition(Math.round(pos.x), Math.round(pos.y));
    // no free spot (a code editor fills the screen): cut a window out of the DOM pieces under the card
    for (const d of doms) if (overlaps(d, { x: pos.x, y: pos.y, w, h })) this.undo.push(cutOut(d.el.node as HTMLElement, { x: pos.x - 4, y: pos.y - 4, w: w + 8, h: h + 8 }));
    this.card = c;
    this.hideAt = Date.now() + (kind === 'offer' ? 20000 : 30000);
    this.scene.bringToTop();
    if (!silent) { play('say'); c.setAlpha(0); c.y += 10; this.tweens.add({ targets: c, alpha: 1, y: c.y - 10, duration: 200 }); }
  }
}
