// Your homestead: a small farm you walk around (WASD / arrows), with a vegetable garden
// that grows in real time and an animal pen. Space acts on the plot you stand on or the
// animal next to you; clicking a plot or an animal opens its menu (in the HomeHud scene).
import Phaser from 'phaser';
import { spriteTex, tileTex } from '../../engine/textures';
import { useGame } from '../../game/store';
import { ANIMAL_BY_ID, CROP_BY_ID, tickHome, updatePlot, plotStage, updateAnimal, plant, water, harvest, clearPlot, collect, feedAnimal, petAnimal, itemSprite } from '../../game/home';
import { activePet, petSprite } from '../../game/pets';
import { UI } from '../../ui/widgets';
import { play } from '../../audio/sound';
import { go } from '../../lib/route';
import { t } from '../../i18n';
import { setHelpContext, maybeTour } from '../help/helpers';
import type { Animal } from '../../game/types07';
import { now } from '../../game/clock';

const T = 16, MW = 30, MH = 22;
/** Garden plots: 6 columns x 2 rows, with paths between them. */
export const PLOT_XY: [number, number][] = Array.from({ length: 12 }, (_, i) => [4 + (i % 6) * 2, 7 + Math.floor(i / 6) * 3]);
const PEN = { x0: 18, y0: 5, x1: 27, y1: 15 };
const STALL: [number, number] = [6, 15];
const EXIT: [number, number] = [14, 20];

export class Homestead extends Phaser.Scene {
  private solid: boolean[][] = [];
  private hero!: Phaser.GameObjects.Image;
  private pos = { x: 10, y: 13 };
  private moving = false;
  private path: { x: number; y: number }[] = [];
  private after: (() => void) | null = null;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private plots: { soil: Phaser.GameObjects.Image; crop: Phaser.GameObjects.Image; bar: Phaser.GameObjects.Graphics; lock: Phaser.GameObjects.Image }[] = [];
  private animals = new Map<string, { img: Phaser.GameObjects.Image; badge: Phaser.GameObjects.Image; x: number; y: number }>();
  private pet: Phaser.GameObjects.Image | null = null;
  private petPos = { x: 9, y: 13 };


  constructor() { super('Homestead'); }

  create() {
    tickHome();
    useGame.setState((s) => ({ home: { ...s.home, visited: true } }));
    this.solid = Array.from({ length: MH }, () => Array(MW).fill(false));
    // ground
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const path = (y === 18 && x >= 3 && x <= 26) || (x === 14 && y >= 16) || (y >= 6 && y <= 12 && x >= 3 && x <= 15 && !PLOT_XY.some(([px, py]) => px === x && py === y));
      this.add.image(x * T + 8, y * T + 8, tileTex(this, path ? 'path' : 'grass', (x * 7 + y * 13) % 4)).setDepth(0);
    }
    // trees around, fence of the pen
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const edge = x < 1 || y < 2 || x >= MW - 1 || y >= MH - 1;
      if (edge) { this.solid[y][x] = true; if ((x + y) % 2 === 0 && !(x === EXIT[0] && y >= MH - 2)) this.add.image(x * T + 8, y * T + 4, spriteTex(this, (x + y) % 4 ? 'tree' : 'pine')).setDepth(y * T + 14).setScale(1.15); }
    }
    this.solid[MH - 1][EXIT[0]] = false;
    for (let x = PEN.x0; x <= PEN.x1; x++) for (const y of [PEN.y0, PEN.y1]) if (!(y === PEN.y1 && x === 22)) { this.add.image(x * T + 8, y * T + 6, spriteTex(this, 'fence')).setDepth(y * T + 12); this.solid[y][x] = true; }
    for (let y = PEN.y0; y <= PEN.y1; y++) for (const x of [PEN.x0, PEN.x1]) { this.add.image(x * T + 8, y * T + 6, spriteTex(this, 'fence')).setDepth(y * T + 12).setAngle(0); this.solid[y][x] = true; }
    // the farmhouse, the well, a scarecrow, the market stall and the exit sign
    this.add.image(3 * T, 5 * T, spriteTex(this, 'house')).setOrigin(0, 1).setScale(3).setDepth(5 * T);
    for (let y = 2; y <= 4; y++) for (let x = 3; x <= 5; x++) this.solid[y][x] = true;
    this.add.image(16 * T + 8, 4 * T + 8, spriteTex(this, 'well')).setDepth(4 * T + 14); this.solid[4][16] = true;
    this.add.image(2 * T + 8, 10 * T + 8, spriteTex(this, 'scarecrow')).setDepth(10 * T + 14); this.solid[10][2] = true;
    const stall = this.add.image(STALL[0] * T + 8, STALL[1] * T + 6, spriteTex(this, 'npc-farm')).setDepth(STALL[1] * T + 14).setInteractive({ useHandCursor: true });
    this.add.image(STALL[0] * T + 24, STALL[1] * T + 4, spriteTex(this, 'barrel')).setDepth(STALL[1] * T + 13);
    this.add.image(STALL[0] * T - 8, STALL[1] * T + 4, spriteTex(this, 'basket')).setDepth(STALL[1] * T + 13);
    this.solid[STALL[1]][STALL[0]] = true; this.solid[STALL[1]][STALL[0] + 1] = true; this.solid[STALL[1]][STALL[0] - 1] = true;
    stall.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.walkNear(STALL[0], STALL[1] + 1, () => this.game.events.emit('home:shop')); });
    UI.reg(this, 'home.stall', stall, t('Market stall'), () => this.game.events.emit('home:shop'));
    this.label(STALL[0], STALL[1] - 1, t('Market'));
    this.add.image(EXIT[0] * T + 8, (MH - 2) * T + 6, spriteTex(this, 'sign')).setDepth(MH * T);
    this.label(EXIT[0], MH - 3, t('To the village'));

    // garden plots
    const s = useGame.getState();
    PLOT_XY.forEach(([x, y], i) => {
      const soil = this.add.image(x * T + 8, y * T + 8, tileTex(this, 'soil')).setDepth(1);
      const crop = this.add.image(x * T + 8, y * T + 10, spriteTex(this, 'sprout')).setOrigin(0.5, 0.6).setDepth(y * T + 10);
      const bar = this.add.graphics().setDepth(y * T + 30);
      const lock = this.add.image(x * T + 8, y * T + 8, spriteTex(this, 'sign')).setDepth(y * T + 11).setAlpha(0.8);
      soil.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.walkNear(x, y, () => this.game.events.emit('home:plot', i), true); });
      UI.reg(this, 'plot.' + i, soil, t('Garden plot {n}', { n: i + 1 }), () => this.game.events.emit('home:plot', i));
      this.plots.push({ soil, crop, bar, lock });
      if (i >= s.home.size) this.solid[y][x] = false;
    });

    // animals
    for (const a of s.home.animals) this.addAnimal(a);

    // hero and pet
    const prof = useGame.getState().profile!;
    this.hero = this.add.image(0, 0, spriteTex(this, prof.avatar, prof.tunic)).setOrigin(0.5, 1);
    this.placeHero();
    UI.reg(this, 'home.hero', this.hero, t('You'));
    const p = activePet();
    if (p) {
      const key = petSprite(p);
      this.pet = this.add.image(this.petPos.x * T + 8, this.petPos.y * T + 14, spriteTex(this, key)).setOrigin(0.5, 1).setScale(0.85).setDepth(this.petPos.y * T + 14);
      let k = 0;
      this.time.addEvent({ delay: 380, loop: true, callback: () => { k++; this.pet?.setTexture(spriteTex(this, key + (k % 2 ? '@bob' : ''))); } });
    }

    // input
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ENTER,ESC', false) as Record<string, Phaser.Input.Keyboard.Key>;
    this.keys.SPACE.on('down', () => this.act());
    this.keys.E.on('down', () => this.act());
    this.keys.ESC.on('down', () => { if (this.sys.isActive() && !this.panelOpen()) go('world'); });
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      this.after = null;
      this.walkTo(Math.floor(ptr.worldX / T), Math.floor(ptr.worldY / T));
    });
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MW * T, MH * T);
    cam.startFollow(this.hero, true, 0.15, 0.15);
    const fit = () => cam.setZoom(Math.max(2, Math.min(4, Math.round(Math.min(this.scale.width / (27 * T), this.scale.height / (17 * T))))));
    fit();
    this.scale.on('resize', fit);
    this.refresh();
    const tick = this.time.addEvent({ delay: 2000, loop: true, callback: () => { tickHome(); this.refresh(); } });
    const unsub = useGame.subscribe((a, b) => { if (a.home !== b.home) this.refresh(); });
    this.events.once('shutdown', () => { unsub(); tick.remove(); this.scale.off('resize', fit); this.animals.clear(); this.plots = []; this.scene.stop('HomeHud'); });
    this.scene.launch('HomeHud');
    setHelpContext(this, { screen: 'Homestead', item: 'home', watch: false, button: 'home.help' });
    maybeTour(this, 'Homestead');
    (window as unknown as { __homeDebug: unknown }).__homeDebug = { pos: () => ({ ...this.pos }), goTo: (x: number, y: number) => this.walkTo(x, y), act: () => this.act() };
  }

  private label(x: number, y: number, s: string) {
    this.add.text(x * T + 8, y * T + 10, s, { fontFamily: "'Jersey 15'", fontSize: '40px', color: '#fff4dc', backgroundColor: '#2b1a12cc', padding: { x: 10, y: 2 } }).setOrigin(0.5, 1).setScale(0.25).setDepth(9000);
  }

  private addAnimal(a: Animal) {
    const def = ANIMAL_BY_ID[a.kind];
    let x = PEN.x0 + 1 + Math.floor(Math.random() * (PEN.x1 - PEN.x0 - 1)), y = PEN.y0 + 1 + Math.floor(Math.random() * (PEN.y1 - PEN.y0 - 1));
    for (let tries = 0; tries < 20 && [...this.animals.values()].some((v) => v.x === x && v.y === y); tries++) { x = PEN.x0 + 1 + ((x - PEN.x0) % (PEN.x1 - PEN.x0 - 1)); y = PEN.y0 + 1 + ((y + 1 - PEN.y0) % (PEN.y1 - PEN.y0 - 1)); }
    const img = this.add.image(x * T + 8, y * T + 14, spriteTex(this, def.sprite)).setOrigin(0.5, 1).setDepth(y * T + 14);
    const badge = this.add.image(x * T + 8, y * T - 6, spriteTex(this, def.product ? itemSprite(def.product) : 'heart')).setScale(0.6).setDepth(9000).setVisible(false);
    img.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); const v = this.animals.get(a.uid)!; this.walkNear(v.x, v.y, () => this.game.events.emit('home:animal', a.uid)); });
    UI.reg(this, 'animal.' + a.uid, img, a.name, () => this.game.events.emit('home:animal', a.uid));
    this.solid[y][x] = true;
    const entry = { img, badge, x, y };
    this.animals.set(a.uid, entry);
    // wander inside the pen
    this.time.addEvent({ delay: 2500 + Math.random() * 2500, loop: true, callback: () => {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
      const nx = entry.x + dx, ny = entry.y + dy;
      if (nx <= PEN.x0 || nx >= PEN.x1 || ny <= PEN.y0 || ny >= PEN.y1 || this.solid[ny][nx] || (nx === this.pos.x && ny === this.pos.y)) return;
      this.solid[entry.y][entry.x] = false; this.solid[ny][nx] = true;
      entry.x = nx; entry.y = ny;
      img.setFlipX(dx < 0);
      this.tweens.add({ targets: img, x: nx * T + 8, y: ny * T + 14, duration: 400, onComplete: () => img.setDepth(ny * T + 14) });
      this.tweens.add({ targets: badge, x: nx * T + 8, y: ny * T - 6, duration: 400 });
    } });
  }

  /** Updates crops, plot bars and animal badges from the saved state. */
  refresh() {
    if (!this.plots.length || !this.sys.displayList) return;
    const s = useGame.getState();
    PLOT_XY.forEach(([x, y], i) => {
      const v = this.plots[i];
      if (!v) return;
      const open = i < s.home.size;
      const p = updatePlot(s.home.plots[i]);
      const st = plotStage(p);
      v.lock.setVisible(!open);
      v.soil.setAlpha(open ? 1 : 0.35);
      v.soil.setTexture(tileTex(this, p.crop && st !== 'ripe' && st !== 'withered' && p.water > now() ? 'soilWet' : 'soil'));
      const crop = p.crop ? CROP_BY_ID[p.crop] : null;
      const sprite = !open ? null : st === 'weeds' ? 'weed' : st === 'seed' ? 'seed' : st === 'sprout' ? 'sprout' : st === 'growing' ? (crop && ['wheat', 'carrot', 'pumpkin'].includes(crop.id) ? crop.id + '2' : 'crop-plant') : st === 'ripe' || st === 'withered' ? crop!.sprite : null;
      v.crop.setVisible(!!sprite);
      if (sprite) v.crop.setTexture(spriteTex(this, sprite));
      v.crop.setTint(st === 'withered' ? 0x8a6a3a : 0xffffff).setAlpha(st === 'withered' ? 0.8 : 1);
      v.bar.clear();
      if (open && (st === 'seed' || st === 'sprout' || st === 'growing')) {
        const k = Math.min(1, p.growth / (crop!.grow * 60000));
        v.bar.fillStyle(0x1c110a).fillRect(x * T + 1, y * T - 3, 14, 4).fillStyle(0x6cc04a).fillRect(x * T + 2, y * T - 2, Math.round(12 * k), 2);
      }
      if (st === 'ripe' && !v.crop.getData('bounce')) { v.crop.setData('bounce', 1); this.tweens.add({ targets: v.crop, scale: 1.12, duration: 400, yoyo: true, repeat: -1 }); }
      if (st !== 'ripe' && v.crop.getData('bounce')) { v.crop.setData('bounce', 0); this.tweens.killTweensOf(v.crop); v.crop.setScale(1); }
    });
    const ids = new Set(s.home.animals.map((a) => a.uid));
    for (const a of s.home.animals) {
      if (!this.animals.has(a.uid)) this.addAnimal(a);
      const v = this.animals.get(a.uid)!;
      const u = updateAnimal(a);
      const def = ANIMAL_BY_ID[a.kind];
      const show = u.ready > 0 || u.full < 25;
      v.badge.setVisible(show).setTexture(spriteTex(this, u.ready > 0 && def.product ? itemSprite(def.product) : 'item-hay'));
    }
    for (const [uid, v] of this.animals) if (!ids.has(uid)) { v.img.destroy(); v.badge.destroy(); this.solid[v.y][v.x] = false; this.animals.delete(uid); }
  }

  private placeHero() { this.hero.setPosition(this.pos.x * T + 8, this.pos.y * T + 14).setDepth(this.pos.y * T + 15); }
  private free(x: number, y: number) { return x >= 0 && y >= 0 && x < MW && y < MH && !this.solid[y][x]; }

  private findPath(tx: number, ty: number) {
    const key = (x: number, y: number) => y * MW + x;
    const prev = new Map<number, number>();
    const q = [key(this.pos.x, this.pos.y)];
    prev.set(q[0], -1);
    while (q.length) {
      const k = q.shift()!;
      const x = k % MW, y = Math.floor(k / MW);
      if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, nk = key(nx, ny);
        if (this.free(nx, ny) && !prev.has(nk)) { prev.set(nk, k); q.push(nk); }
      }
    }
    if (!prev.has(key(tx, ty))) return [];
    const out: { x: number; y: number }[] = [];
    for (let k = key(tx, ty); k !== key(this.pos.x, this.pos.y); k = prev.get(k)!) out.unshift({ x: k % MW, y: Math.floor(k / MW) });
    return out;
  }
  private walkTo(x: number, y: number) { this.path = this.free(x, y) ? this.findPath(x, y) : []; }
  /** Walk onto (plots) or next to (animals, the stall) a tile, then do something. */
  private walkNear(x: number, y: number, then: () => void, onto = false) {
    const targets = onto ? [[x, y]] : [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]];
    for (const [tx, ty] of targets) {
      if (this.pos.x === tx && this.pos.y === ty) { then(); return; }
    }
    for (const [tx, ty] of targets) {
      if (!this.free(tx, ty)) continue;
      const p = this.findPath(tx, ty);
      if (p.length) { this.path = p; this.after = then; return; }
    }
    then();
  }

  private step(nx: number, ny: number) {
    if (!this.free(nx, ny)) return false;
    const prev = { ...this.pos };
    if (nx !== this.pos.x) this.hero.setFlipX(nx < this.pos.x);

    this.moving = true;
    this.pos = { x: nx, y: ny };
    const prof = useGame.getState().profile!;
    this.hero.setTexture(spriteTex(this, prof.avatar + (nx % 2 ? '@walk1' : '@walk2'), prof.tunic));
    if (this.pet) { this.petPos = prev; this.pet.setFlipX(prev.x < (this.pet.x - 8) / T); this.tweens.add({ targets: this.pet, x: prev.x * T + 8, y: prev.y * T + 14, duration: 150, onComplete: () => this.pet?.setDepth(prev.y * T + 14) }); }
    this.tweens.add({ targets: this.hero, x: nx * T + 8, y: ny * T + 14, duration: 140, onComplete: () => {
      this.moving = false;
      this.hero.setTexture(spriteTex(this, prof.avatar, prof.tunic)).setDepth(ny * T + 15);
      if (nx === EXIT[0] && ny === MH - 1) { play('door'); go('world'); return; }
      if (!this.path.length && this.after) { const f = this.after; this.after = null; f(); }
    } });
    return true;
  }

  private panelOpen() { return !!(this.game.registry.get('debug:HomeHud') as (() => { open: boolean }) | undefined)?.().open; }

  /** Space: harvest, water, plant, clear... whatever makes sense here. */
  act() {
    if (!this.sys.isActive() || this.panelOpen()) return;
    const s = useGame.getState();
    const i = PLOT_XY.findIndex(([x, y]) => x === this.pos.x && y === this.pos.y);
    if (i >= 0) {
      if (i >= s.home.size) { this.game.events.emit('home:shop', 'plots'); return; }
      const st = plotStage(updatePlot(s.home.plots[i]));
      if (st === 'ripe') { const got = harvest(i); if (got) { play('coin'); this.float(this.pos.x, this.pos.y, CROP_BY_ID[got].sprite); } return; }
      if (st === 'weeds' || st === 'withered') { clearPlot(i); play('click'); return; }
      if (st === 'empty') {
        const seed = Object.keys(s.home.inv).find((k) => k.startsWith('seed-') && (s.home.inv[k] ?? 0) > 0);
        if (seed && plant(i, seed.slice(5))) { play('click'); this.float(this.pos.x, this.pos.y, 'seed'); } else this.game.events.emit('home:plot', i);
        return;
      }
      if (water(i)) { play('splash'); this.float(this.pos.x, this.pos.y, 'wateringCan'); }
      else this.game.events.emit('home:plot', i);
      return;
    }
    // an animal in front of (or next to) the hero
    for (const [uid, v] of this.animals) {
      if (Math.abs(v.x - this.pos.x) + Math.abs(v.y - this.pos.y) !== 1) continue;
      const got = collect(uid);
      if (got) { play('coin'); this.float(v.x, v.y, itemSprite(got.item)); return; }
      const food = feedAnimal(uid);
      if (food) { play('coin'); this.float(v.x, v.y, itemSprite(food)); return; }
      if (petAnimal(uid)) { play('say'); this.float(v.x, v.y, 'heart'); return; }
      this.game.events.emit('home:animal', uid);
      return;
    }
    if (Math.abs(this.pos.x - STALL[0]) <= 1 && this.pos.y === STALL[1] + 1) { this.game.events.emit('home:shop'); return; }
  }

  private float(x: number, y: number, spr: string) {
    const img = this.add.image(x * T + 8, y * T, spriteTex(this, spr)).setDepth(9500);
    this.tweens.add({ targets: img, y: img.y - 14, alpha: 0, duration: 800, onComplete: () => img.destroy() });
  }

  update() {
    if (this.moving || !this.sys.isActive()) return;
    const k = this.keys;
    let dx = 0, dy = 0;
    if (k.LEFT.isDown || k.A.isDown) dx = -1; else if (k.RIGHT.isDown || k.D.isDown) dx = 1;
    else if (k.UP.isDown || k.W.isDown) dy = -1; else if (k.DOWN.isDown || k.S.isDown) dy = 1;
    if (dx || dy) { this.path = []; this.after = null; this.step(this.pos.x + dx, this.pos.y + dy); return; }
    const n = this.path.shift();
    if (n && !this.step(n.x, n.y)) this.path = [];
  }
}
