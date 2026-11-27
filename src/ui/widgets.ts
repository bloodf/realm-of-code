// Game UI widgets drawn by Phaser: buttons, panels, bubbles, bars, scroll views,
// animated sprites, icons, modals and text inputs. Every interactive widget can be
// registered with an id, so guided tours and automated tests can find it.
import Phaser from 'phaser';
import { ICONS } from '../pixel/icons';
import { spriteTex } from '../engine/textures';
import { play } from '../audio/sound';
import { drawFrame, drawTail, drawBar } from './draw';
import { C, FONT, TITLE_FONT, N, frameColors, colorFrame, type FrameKind, textStyle, fs } from './theme';
import { richTexture, type RichOpts } from './rich';
import { tr, up } from '../i18n';
import { hex } from '../pixel/scenes';

type GO = Phaser.GameObjects.GameObject & { getBounds?: () => Phaser.Geom.Rectangle; visible?: boolean };

// ---------------- registry ----------------
export interface UiEntry { id: string; label: string; obj: GO; scene: Phaser.Scene; click?: () => void; clip?: Clip; reveal?: () => void }
const REG = new Map<string, UiEntry>();

function visibleInTree(o: GO): boolean {
  let cur: GO | null = o;
  while (cur) {
    if (cur.visible === false) return false;
    cur = (cur.parentContainer as GO | null) ?? null;
  }
  return true;
}

export const UI = {
  reg(scene: Phaser.Scene, id: string, obj: GO, label: string, click?: () => void, clip?: Clip) {
    // inside a scrolling list: tours can scroll it into view
    const sv = clip as unknown as { content?: Phaser.GameObjects.Container; scrollTo?: (y: number) => void; y?: number } | undefined;
    const reveal = sv?.scrollTo && sv.content ? () => { const b = obj.getBounds?.(); if (b) sv.scrollTo!(b.y - sv.content!.y - 40); } : undefined;
    REG.set(id, { id, label, obj, scene, click, clip, reveal });
    obj.once(Phaser.GameObjects.Events.DESTROY, () => { if (REG.get(id)?.obj === obj) REG.delete(id); });
  },
  get: (id: string) => REG.get(id),
  /** How to bring a widget into view (scroll a list, move the camera) for guided tours. */
  onReveal(id: string, fn: () => void) { const e = REG.get(id); if (e) e.reveal = fn; },
  /** Page rectangle of a registered widget (null if hidden). */
  rect(id: string): { x: number; y: number; w: number; h: number } | null {
    const e = REG.get(id);
    if (!e || !e.obj.active || !(e.scene.sys.isActive() || e.scene.sys.isPaused()) || !e.scene.sys.isVisible() || !visibleInTree(e.obj) || !e.obj.getBounds) return null;
    const b = e.obj.getBounds();
    const cam = e.scene.cameras.main;
    const x = (b.x - cam.worldView.x) * cam.zoom, y = (b.y - cam.worldView.y) * cam.zoom;
    const r = { x, y, w: b.width * cam.zoom, h: b.height * cam.zoom };
    if (e.clip) {
      const c = e.clip.rect();
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (cx < c.x || cx > c.x + c.w || cy < c.y || cy > c.y + c.h) return null;
    }
    if (r.x + r.w < 0 || r.y + r.h < 0 || r.x > e.scene.scale.width || r.y > e.scene.scale.height) return null;
    return r;
  },
  /** Registers an invisible area (for guided tours pointing at regions or DOM pieces). */
  area(scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number, label = id, parent?: Phaser.GameObjects.Container) {
    const z = scene.add.zone(Math.round(x), Math.round(y), Math.round(w), Math.round(h)).setOrigin(0, 0);
    parent?.add(z);
    UI.reg(scene, id, z as unknown as GO, label);
    return z;
  },
  all() { return [...REG.values()].filter((e) => e.obj.active && (e.scene.sys.isActive() || e.scene.sys.isPaused())).map((e) => ({ id: e.id, label: e.label, rect: UI.rect(e.id), scene: e.scene.sys.settings.key })); },
  list() {
    return [...REG.values()].map((e) => ({ id: e.id, label: e.label, rect: UI.rect(e.id), scene: e.scene.sys.settings.key })).filter((e) => e.rect);
  },
};

// ---------------- small helpers ----------------
export function text(scene: Phaser.Scene, x: number, y: number, s: string, size = 22, color: string = C.ink, extra: Phaser.Types.GameObjects.Text.TextStyle = {}) {
  return scene.add.text(Math.round(x), Math.round(y), s, textStyle(size, color, extra)).setOrigin(0, 0);
}
export function title(scene: Phaser.Scene, x: number, y: number, s: string, size = 44, color: string = C.ink) {
  return scene.add.text(Math.round(x), Math.round(y), s, { fontFamily: TITLE_FONT, fontSize: `${size}px`, color }).setOrigin(0, 0);
}
export function rich(scene: Phaser.Scene, x: number, y: number, md: string, o: RichOpts) {
  const t = richTexture(scene, md, o);
  return scene.add.image(Math.round(x), Math.round(y), t.key).setOrigin(0, 0);
}

/** Pixel icon (12x12 mask) as a texture in a colour. */
export function iconTex(scene: Phaser.Scene, name: string, color = '#2b1a12', px = 2): string {
  const key = `icon:${name}:${color}:${px}`;
  if (!scene.textures.exists(key)) {
    const rows = ICONS[name] ?? ICONS.star;
    const c = document.createElement('canvas');
    c.width = 12 * px; c.height = 12 * px;
    const g = c.getContext('2d')!;
    g.fillStyle = color;
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g.fillRect(x * px, y * px, px, px); }));
    scene.textures.addCanvas(key, c);
  }
  return key;
}
export function icon(scene: Phaser.Scene, x: number, y: number, name: string, color = '#2b1a12', size = 24) {
  return scene.add.image(Math.round(x), Math.round(y), iconTex(scene, name, color, Math.max(1, Math.round(size / 12)))).setOrigin(0, 0);
}

export function sprite(scene: Phaser.Scene, x: number, y: number, name: string, size = 32, tunic?: string) {
  return scene.add.image(Math.round(x), Math.round(y), spriteTex(scene, name, tunic)).setOrigin(0, 0).setScale(size / 16);
}

/** An animated sprite cycling through frames. */
export function anim(scene: Phaser.Scene, x: number, y: number, frames: string[], fps = 4, size = 48, tunic?: string) {
  const img = sprite(scene, x, y, frames[0], size, tunic);
  let i = 0;
  const ev = scene.time.addEvent({ delay: 1000 / fps, loop: true, callback: () => { i = (i + 1) % frames.length; if (img.active) img.setTexture(spriteTex(scene, frames[i], tunic)); } });
  img.once(Phaser.GameObjects.Events.DESTROY, () => ev.remove());
  return img;
}

/** A framed panel (Graphics) at x, y. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, kind: FrameKind = 'panel', opts: { base?: number; u?: number } = {}) {
  const g = scene.add.graphics();
  drawFrame(g, 0, 0, w, h, frameColors(kind), opts);
  g.setPosition(Math.round(x), Math.round(y));
  return g;
}
export function colorPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color: string, base = 0) {
  return panel(scene, x, y, w, h, colorFrame(color), { base });
}

export function bar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, pct: number, color = '#e7a72c', dark?: string) {
  const g = scene.add.graphics().setPosition(Math.round(x), Math.round(y));
  drawBar(g, 0, 0, w, h, pct, color, dark ?? shadeDark(color));
  return g;
}
const shadeDark = (c: string) => { const [r, g, b] = hex(c); return '#' + [r, g, b].map((v) => Math.round(v * 0.8).toString(16).padStart(2, '0')).join(''); };

// ---------------- clipping (scroll views) ----------------
export interface Clip { rect(): { x: number; y: number; w: number; h: number }; contains(px: number, py: number): boolean }

// ---------------- buttons ----------------
export type Variant = 'green' | 'blue' | 'red' | 'gold' | 'purple' | 'ghost' | 'stone' | 'wood' | 'paper';
const VARIANT: Record<Variant, { frame: FrameKind; text: string; shadow: boolean }> = {
  green: { frame: 'green', text: '#ffffff', shadow: true }, blue: { frame: 'blue', text: '#ffffff', shadow: true },
  red: { frame: 'red', text: '#ffffff', shadow: true }, gold: { frame: 'gold', text: '#ffffff', shadow: true },
  purple: { frame: 'purple', text: '#ffffff', shadow: true }, wood: { frame: 'wood', text: C.cream, shadow: true },
  ghost: { frame: 'paper', text: C.ink, shadow: false }, paper: { frame: 'paper', text: C.ink, shadow: false },
  stone: { frame: 'stone', text: '#6e6250', shadow: false },
};

export interface BtnOpts {
  w?: number; h?: number; size?: number; icon?: string; sprite?: string; variant?: Variant; id?: string; disabled?: boolean;
  upper?: boolean; clip?: Clip; silent?: boolean; align?: 'center' | 'left'; iconSize?: number;
}

export class Button extends Phaser.GameObjects.Container {
  bw: number;
  bh: number;
  private bg: Phaser.GameObjects.Graphics;
  private content: Phaser.GameObjects.Container;
  private label?: Phaser.GameObjects.Text;
  private zone: Phaser.GameObjects.Zone;
  private variant: Variant;
  private enabled = true;
  private hover = false;
  private down = false;
  private downAt: { x: number; y: number } | null = null;
  onClick: () => void;
  private opts: BtnOpts;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, opts: BtnOpts = {}) {
    super(scene, Math.round(x), Math.round(y));
    scene.add.existing(this);
    this.opts = opts;
    this.onClick = onClick;
    this.variant = opts.variant ?? 'green';
    const size = opts.size ?? fs(scene, 22);
    const v = VARIANT[this.variant];
    this.content = scene.add.container(0, 0);
    let cw = 0;
    const iconSize = opts.iconSize ?? (opts.sprite ? 32 : 24);
    let iconObj: Phaser.GameObjects.Image | null = null;
    if (opts.sprite) { iconObj = scene.add.image(0, 0, spriteTex(scene, opts.sprite)).setOrigin(0, 0.5).setScale(iconSize / 16); cw += iconSize; }
    else if (opts.icon) { iconObj = scene.add.image(0, 0, iconTex(scene, opts.icon, v.text, Math.max(1, Math.round(iconSize / 12)))).setOrigin(0, 0.5); cw += iconObj.width; }
    if (iconObj) this.content.add(iconObj);
    if (label) {
      this.label = scene.add.text(cw + (iconObj ? 8 : 0), 0, opts.upper === false ? label : up(label), {
        fontFamily: FONT, fontSize: `${size}px`, color: v.text, fontStyle: 'bold',
        shadow: v.shadow ? { offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,0.35)', fill: true } : undefined,
      }).setOrigin(0, 0.5);
      this.content.add(this.label);
      cw = this.label.x + this.label.width;
    }
    this.bw = Math.round(opts.w ?? cw + 40);
    this.bh = Math.round(opts.h ?? Math.max(48, size + 28));
    this.bg = scene.add.graphics();
    this.zone = scene.add.zone(0, 0, this.bw, this.bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.add([this.bg, this.content, this.zone]);
    this.content.setPosition(opts.align === 'left' ? 16 : Math.round((this.bw - cw) / 2), Math.round(this.bh / 2) - 3);
    this.setSize(this.bw, this.bh);
    this.zone.on('pointerover', () => { this.hover = true; this.draw(); });
    this.zone.on('pointerout', () => { this.hover = false; this.down = false; this.draw(); });
    this.zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.enabled || !this.inClip(p)) return;
      this.down = true; this.downAt = { x: p.x, y: p.y }; this.draw();
    });
    this.zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      const was = this.down;
      this.down = false; this.draw();
      if (!was || !this.enabled || !this.inClip(p)) return;
      if (this.downAt && Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y) > 10) return;
      if (!opts.silent) play('click');
      this.onClick();
    });
    if (opts.disabled) this.enabled = false;
    this.draw();
    if (opts.id) UI.reg(scene, opts.id, this as unknown as GO, label || opts.id, () => this.enabled && this.onClick(), opts.clip);
  }

  private inClip(p: Phaser.Input.Pointer) { return !this.opts.clip || this.opts.clip.contains(p.x, p.y); }

  getBounds(out?: Phaser.Geom.Rectangle) {
    const m = this.getWorldTransformMatrix();
    const r = out ?? new Phaser.Geom.Rectangle();
    r.setTo(m.tx, m.ty, this.bw * m.scaleX, this.bh * m.scaleY);
    return r;
  }

  private draw() {
    const v = VARIANT[this.enabled ? this.variant : 'stone'];
    let c = frameColors(v.frame);
    if (this.hover && this.enabled && !this.down) c = { ...c, fill: lighten(c.fill), light: lighten(c.light) };
    const press = this.down ? 3 : 0;
    this.bg.clear();
    drawFrame(this.bg, 0, press, this.bw, this.bh - press, c, { base: this.down ? 0 : 1 });
    this.content.setY(Math.round(this.bh / 2) - 3 + press);
    this.label?.setColor(this.enabled ? VARIANT[this.variant].text : '#6e6250');
  }

  setEnabled(on: boolean) { this.enabled = on; this.zone.input!.cursor = on ? 'pointer' : 'default'; this.draw(); return this; }
  isEnabled() { return this.enabled; }
  setVariant(v: Variant) { this.variant = v; this.draw(); return this; }
  setLabel(s: string) { this.label?.setText(this.opts.upper === false ? s : up(s)); return this; }
}

const lighten = (h: string) => { const [r, g, b] = hex(h); return '#' + [r, g, b].map((v) => Math.min(255, Math.round(v + (255 - v) * 0.12)).toString(16).padStart(2, '0')).join(''); };

export function button(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, opts: BtnOpts = {}) {
  return new Button(scene, x, y, label, onClick, opts);
}

/** A card-like button (quiz options, list items): any content inside a paper frame. */
export type CardState = 'normal' | 'sel' | 'right' | 'wrong' | 'off';
const CARD_FRAMES: Record<CardState, FrameKind> = { normal: 'paper', sel: 'sel', right: 'right', wrong: 'wrong', off: 'stone' };

export class Card extends Phaser.GameObjects.Container {
  bw: number;
  bh: number;
  state: CardState = 'normal';
  private bg: Phaser.GameObjects.Graphics;
  private zone: Phaser.GameObjects.Zone;
  private hover = false;
  private downAt: { x: number; y: number } | null = null;
  enabled = true;
  frame: FrameKind | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, onClick: (() => void) | null, opts: { id?: string; label?: string; clip?: Clip; frame?: FrameKind } = {}) {
    super(scene, Math.round(x), Math.round(y));
    scene.add.existing(this);
    this.bw = Math.round(w); this.bh = Math.round(h);
    this.frame = opts.frame ?? null;
    this.bg = scene.add.graphics();
    this.zone = scene.add.zone(0, 0, this.bw, this.bh).setOrigin(0, 0);
    this.add([this.bg, this.zone]);
    this.setSize(this.bw, this.bh);
    if (onClick) {
      this.zone.setInteractive({ useHandCursor: true });
      this.zone.on('pointerover', () => { this.hover = true; this.draw(); });
      this.zone.on('pointerout', () => { this.hover = false; this.draw(); });
      this.zone.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.enabled && (!opts.clip || opts.clip.contains(p.x, p.y))) this.downAt = { x: p.x, y: p.y }; });
      this.zone.on('pointerup', (p: Phaser.Input.Pointer) => {
        const d = this.downAt; this.downAt = null;
        if (!d || !this.enabled || (opts.clip && !opts.clip.contains(p.x, p.y)) || Math.hypot(p.x - d.x, p.y - d.y) > 10) return;
        onClick();
      });
      if (opts.id) UI.reg(scene, opts.id, this as unknown as GO, opts.label ?? opts.id, () => this.enabled && onClick(), opts.clip);
    }
    this.draw();
  }
  getBounds(out?: Phaser.Geom.Rectangle) {
    const m = this.getWorldTransformMatrix();
    const r = out ?? new Phaser.Geom.Rectangle();
    r.setTo(m.tx, m.ty, this.bw * m.scaleX, this.bh * m.scaleY);
    return r;
  }
  setState2(s: CardState) { this.state = s; this.draw(); return this; }
  setEnabled(on: boolean) { this.enabled = on; if (this.zone.input) this.zone.input.cursor = on ? 'pointer' : 'default'; return this; }
  private draw() {
    let c = frameColors(this.state === 'normal' && this.frame ? this.frame : CARD_FRAMES[this.state]);
    if (this.hover && this.enabled && this.state === 'normal') c = { ...c, fill: lighten(c.fill) };
    this.bg.clear();
    drawFrame(this.bg, 0, 0, this.bw, this.bh, c, { base: 1 });
    this.bg.setAlpha(this.state === 'off' ? 0.6 : 1);
  }
}

// ---------------- speech bubble ----------------
/** A paper bubble with a tail on the left. Returns the container and its height. */
export function bubble(scene: Phaser.Scene, x: number, y: number, w: number, md: string, who?: string, size = 22) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const pad = 18;
  let yy = pad - 4;
  const parts: Phaser.GameObjects.GameObject[] = [];
  if (who) { parts.push(text(scene, pad, yy, up(who), Math.round(size * 0.72), C.inkSoft, { fontStyle: 'bold' })); yy += Math.round(size * 0.9); }
  const t = richTexture(scene, md, { width: w - pad * 2, size });
  parts.push(scene.add.image(pad, yy, t.key).setOrigin(0, 0));
  const h = yy + t.h + pad - 6;
  const g = scene.add.graphics();
  drawFrame(g, 0, 0, w, h, frameColors('bubble'));
  drawTail(g, 3, Math.min(h - 24, Math.max(12, h - 36)), '#fdf6e3', '#2b1a12');
  c.add([g, ...parts]);
  return { c, h };
}

// ---------------- scroll view ----------------
export class ScrollView implements Clip {
  scene: Phaser.Scene;
  x: number; y: number; w: number; h: number;
  content: Phaser.GameObjects.Container;
  private maskG: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private contentH = 0;
  scrollY = 0;
  private drag: { y: number; s: number; moved: boolean } | null = null;
  private handlers: [string, (...a: never[]) => void][] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    this.scene = scene;
    this.x = Math.round(x); this.y = Math.round(y); this.w = Math.round(w); this.h = Math.round(h);
    this.content = scene.add.container(this.x, this.y);
    this.maskG = scene.make.graphics({}, false);
    this.maskG.fillStyle(0xffffff).fillRect(this.x, this.y, this.w, this.h);
    this.content.setMask(this.maskG.createGeometryMask());
    this.bar = scene.add.graphics().setDepth(50);
    const on = (ev: string, fn: (...a: never[]) => void) => { scene.input.on(ev, fn); this.handlers.push([ev, fn]); };
    on('wheel', ((p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => { if (this.contains(p.x, p.y)) this.scrollTo(this.scrollY + dy * 0.8); }) as never);
    on('pointerdown', ((p: Phaser.Input.Pointer) => { if (this.contains(p.x, p.y)) this.drag = { y: p.y, s: this.scrollY, moved: false }; }) as never);
    on('pointermove', ((p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dy = p.y - this.drag.y;
      if (Math.abs(dy) > 8) this.drag.moved = true;
      if (this.drag.moved) this.scrollTo(this.drag.s - dy);
    }) as never);
    on('pointerup', (() => { this.drag = null; }) as never);
  }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  contains(px: number, py: number) { return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h; }
  setContentHeight(h: number) { this.contentH = h; this.scrollTo(this.scrollY); }
  get maxScroll() { return Math.max(0, this.contentH - this.h); }
  scrollTo(y: number) {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, y));
    this.content.y = this.y - Math.round(this.scrollY);
    this.bar.clear();
    if (this.maxScroll > 0) {
      const th = Math.max(30, (this.h * this.h) / this.contentH);
      const ty = this.y + (this.h - th) * (this.scrollY / this.maxScroll);
      this.bar.fillStyle(N('#2b1a12'), 0.25).fillRect(this.x + this.w - 8, this.y, 6, this.h);
      this.bar.fillStyle(N('#8a5a34'), 0.9).fillRect(this.x + this.w - 8, ty, 6, th);
    }
  }
  /** Scroll so that a content-space y is near the middle. */
  center(y: number) { this.scrollTo(y - this.h / 2); }
  destroy() {
    for (const [ev, fn] of this.handlers) this.scene.input.off(ev, fn);
    this.content.destroy(); this.maskG.destroy(); this.bar.destroy();
  }
}

// ---------------- modal ----------------
export interface ModalHandle { c: Phaser.GameObjects.Container; close: () => void; x: number; y: number; w: number; h: number }
/** A centred panel over a dark backdrop. `build` fills it and returns its height. */
export function modal(scene: Phaser.Scene, w: number, build: (c: Phaser.GameObjects.Container, w: number, close: () => void) => number, opts: { closable?: boolean; depth?: number; kind?: FrameKind } = {}): ModalHandle {
  const W = scene.scale.width, H = scene.scale.height;
  w = Math.min(w, W - 16);
  const root = scene.add.container(0, 0).setDepth(opts.depth ?? 1000);
  const dim = scene.add.rectangle(0, 0, W, H, 0x1c110a, 0.65).setOrigin(0, 0).setInteractive();
  root.add(dim);
  const c = scene.add.container(0, 0);
  // DOM elements (editors, inputs) sit above the canvas: hide them while the modal is open
  const doms = scene.children.list.filter((o) => o instanceof Phaser.GameObjects.DOMElement && o.visible) as Phaser.GameObjects.DOMElement[];
  doms.forEach((d) => d.setVisible(false));
  const close = () => { if (root.active) { root.destroy(); doms.forEach((d) => d.active && d.setVisible(true)); } };
  const h = build(c, w, close);
  const x = Math.round((W - w) / 2), y = Math.max(8, Math.round((H - h) / 2));
  const bg = panel(scene, 0, 0, w, h, opts.kind ?? 'panel');
  c.addAt(bg, 0);
  c.setPosition(x, y);
  root.add(c);
  if (opts.closable !== false) dim.on('pointerup', close);
  c.setScale(0.92);
  scene.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Back.easeOut' });
  c.setPosition(x, y);
  return { c, close, x, y, w, h };
}

// ---------------- DOM text input ----------------
export function domInput(scene: Phaser.Scene, x: number, y: number, w: number, h: number, opts: { value?: string; placeholder?: string; size?: number; code?: boolean; maxLength?: number; onEnter?: () => void; onInput?: (v: string) => void; id?: string } = {}) {
  const el = document.createElement('input');
  el.type = 'text';
  el.value = opts.value ?? '';
  el.placeholder = tr(opts.placeholder ?? '');
  if (opts.maxLength) el.maxLength = opts.maxLength;
  el.autocomplete = 'off'; el.spellcheck = false; el.setAttribute('autocapitalize', 'off');
  el.className = 'game-input' + (opts.code ? ' code' : '');
  if (opts.id) el.dataset.ui = opts.id;
  Object.assign(el.style, { width: `${w}px`, height: `${h}px`, fontSize: `${opts.size ?? 24}px` });
  el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') opts.onEnter?.(); });
  el.addEventListener('input', () => opts.onInput?.(el.value));
  const dom = scene.add.dom(Math.round(x), Math.round(y), el).setOrigin(0, 0);
  return { dom, el };
}

/** A large title with a dark outline (for results, intros). */
export function bigTitle(scene: Phaser.Scene, x: number, y: number, s: string, size = 56, color = '#ffd66b') {
  return scene.add.text(Math.round(x), Math.round(y), s, { fontFamily: TITLE_FONT, fontSize: `${size}px`, color, stroke: '#2b1a12', strokeThickness: 8 }).setOrigin(0.5, 0);
}

/** Background: tiled parchment. */
export function parchmentBg(scene: Phaser.Scene, x = 0, y = 0, w = scene.scale.width, h = scene.scale.height) {
  const key = 'bg:parchment';
  if (!scene.textures.exists(key)) {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const g = cv.getContext('2d')!;
    let s = 7;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let yy = 0; yy < 64; yy++) for (let xx = 0; xx < 64; xx++) { const v = r(); g.fillStyle = v < 0.06 ? '#ead7ab' : v > 0.97 ? '#fbf0d4' : '#f3e4bf'; g.fillRect(xx, yy, 1, 1); }
    scene.textures.addCanvas(key, cv);
  }
  return scene.add.tileSprite(x, y, w, h, key).setOrigin(0, 0).setTileScale(3);
}
export function woodBg(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
  const key = 'bg:wood';
  if (!scene.textures.exists(key)) {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const g = cv.getContext('2d')!;
    let s = 11;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let yy = 0; yy < 32; yy++) for (let xx = 0; xx < 32; xx++) {
      let c = '#684228';
      if (yy % 8 === 7) c = '#2e1c10';
      else if ((xx + (Math.floor(yy / 8) % 2) * 16) % 32 === 0) c = '#3a2414';
      else { const v = r(); c = v < 0.15 ? '#5c3a22' : v > 0.92 ? '#7a4e2e' : '#684228'; }
      g.fillStyle = c; g.fillRect(xx, yy, 1, 1);
    }
    scene.textures.addCanvas(key, cv);
  }
  return scene.add.tileSprite(x, y, w, h, key).setOrigin(0, 0).setTileScale(3);
}

export { C, N };
