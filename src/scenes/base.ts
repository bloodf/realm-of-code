// Base classes for the game's screens (all drawn by Phaser).
import Phaser from 'phaser';
import { C, isNarrow, TITLE_FONT } from '../ui/theme';
import { drawFrame } from '../ui/draw';
import { FRAMES } from '../ui/theme';
import { ScrollView, iconTex, parchmentBg, woodBg, UI } from '../ui/widgets';
import { go } from '../lib/route';
import { play } from '../audio/sound';
import { maybeTour } from './help/helpers';

/** A screen that rebuilds itself when the window is resized. State that must survive a
 *  rebuild lives in `this.p` (the scene data object), which is passed back on restart. */
export class UIScene extends Phaser.Scene {
  p: Record<string, unknown> & { st?: Record<string, unknown> } = {};
  private rt = 0;
  init(data: Record<string, unknown>) { this.p = data ?? {}; if (!this.p.st) this.p.st = {}; }
  /** True while the screen is being rebuilt (so shutdown handlers can keep DOM pieces). */
  get rebuilding() { return this.p.__rebuilding === true; }
  create() {
    this.p.__rebuilding = false;
    this.build();
    this.scale.on('resize', this.resized, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.resized, this); clearTimeout(this.rt); });
  }
  build() { /* override */ }
  /** Runs fn after ms even if the screen rebuilds meanwhile (scene timers end on rebuild);
   *  dropped if the screen closes, delayed while it is paused. */
  after(ms: number, fn: () => void) {
    const p = this.p;
    const wait = (left: number) => window.setTimeout(() => {
      if (this.p !== p || !(this.sys.isActive() || this.sys.isPaused())) return;
      if (this.sys.isPaused()) { wait(200); return; }
      fn();
    }, left);
    wait(ms);
  }
  /** Rebuild the whole screen (keeps this.p). */
  rebuild() {
    // several rebuilds asked in the same frame are done once (a second restart would look like
    // the screen closing, and throw away its editors)
    if (this.p.__rebuilding) return;
    if (this.sys.isActive() || this.sys.isPaused()) { this.p.__rebuilding = true; this.scene.restart(this.p); }
  }
  private resized() { clearTimeout(this.rt); this.rt = window.setTimeout(() => this.rebuild(), 160); }
  get W() { return this.scale.width; }
  get H() { return this.scale.height; }
  get narrow() { return isNarrow(this); }
}

/** A building window over the (paused) village. Subclasses fill the body. */
export abstract class WindowScene extends UIScene {
  abstract winTitle: string;
  winIcon = 'castle';
  wide = false;
  sv!: ScrollView;
  bodyW = 0;
  winRect = { x: 0, y: 0, w: 0, h: 0 };

  build() {
    const { W, H } = this;
    const narrow = this.narrow;
    const top = narrow ? 64 : 86, bottom = narrow ? 76 : 96;
    const w = narrow ? W : Math.min(this.wide ? 1200 : 900, W - 32);
    const x = Math.round((W - w) / 2), h = H - top - bottom;
    this.winRect = { x, y: top, w, h };
    // dim the village, click outside to close
    this.add.rectangle(0, 0, W, H, 0x1c110a, 0.45).setOrigin(0, 0).setInteractive().on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.x < x || p.x > x + w || p.y < top || p.y > top + h) this.close();
    });
    // window frame
    const g = this.add.graphics();
    g.fillStyle(0x1c110a).fillRect(x - 6, top - 6, w + 12, h + 12);
    g.fillStyle(0x000000, 0.35).fillRect(x - 6, top + h + 6, w + 12, 10);
    parchmentBg(this, x, top, w, h);
    const titleH = narrow ? 46 : 54;
    woodBg(this, x, top, w, titleH);
    this.add.rectangle(x, top + titleH, w, 6, 0x1c110a).setOrigin(0, 0);
    this.add.image(x + 14, top + titleH / 2, iconTex(this, this.winIcon, '#ffd66b', 2)).setOrigin(0, 0.5);
    this.add.text(x + 48, top + titleH / 2, this.winTitle, { fontFamily: TITLE_FONT, fontSize: narrow ? '30px' : '38px', color: '#ffd66b', stroke: '#1c110a', strokeThickness: 6 }).setOrigin(0, 0.5);
    // close button
    const cb = this.add.container(x + w - titleH + 4, top + 6);
    const cg = this.add.graphics();
    drawFrame(cg, 0, 0, titleH - 12, titleH - 12, FRAMES.red);
    const cx = this.add.image((titleH - 12) / 2, (titleH - 12) / 2, iconTex(this, 'x', '#ffffff', 2));
    const zone = this.add.zone(0, 0, titleH - 12, titleH - 12).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => { play('click'); this.close(); });
    cb.add([cg, cx, zone]);
    cb.setSize(titleH - 12, titleH - 12);
    UI.reg(this, 'window.close', zone, 'Close');
    // body
    const pad = narrow ? 10 : 20;
    this.bodyW = w - pad * 2 - 10;
    this.sv = new ScrollView(this, x + pad, top + titleH + 6 + 10, w - pad * 2, h - titleH - 6 - 14);
    const contentH = this.body(this.sv.content, this.bodyW, this.sv);
    this.sv.setContentHeight(contentH + 30);
    const st = this.p.st as { scroll?: number };
    if (st.scroll) this.sv.scrollTo(st.scroll);
    this.events.once('shutdown', () => { st.scroll = this.sv.scrollY; });
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    maybeTour(this, this.scene.key);
  }

  abstract body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView): number;

  close() { go('world'); }
}

export { C };
