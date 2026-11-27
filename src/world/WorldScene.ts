// The village of Codehaven: the game's home screen, drawn with Phaser.
// Walk with the arrow keys / WASD, or tap where you want to go. Each building opens
// a part of the game (lessons, the farm, the tavern...).
import Phaser from 'phaser';
import { spriteTex, tileTex, dotTex, canvasTex } from '../engine/textures';
import { BUILDING_ART } from './buildings';
import { NPC_BY_COURSE } from '../pixel/art';
import { rng } from '../pixel/scenes';
import { play } from '../audio/sound';
import { useGame } from '../game/store';
import { go } from '../lib/route';
import { currentTarget } from '../game/director';
import { UI } from '../ui/widgets';
import { maybeTour, setHelpContext } from '../scenes/help/helpers';
import { t } from '../i18n';
import { WorldExtras } from './extras';
import { horseBonus } from '../game/home';

const POS_KEY = 'roc-world-pos';

const T = 16;
const MW = 62;
const MH = 44;
const FONT = "'Jersey 15', monospace";

export interface Place { id: string; name: string; art: string; bx: number; by: number; npc?: string; say?: string }

/** Buildings: bx/by = tile of the bottom-left corner. */
export const PLACES: Place[] = [
  { id: 'learn', name: 'The Academy', art: 'castle', bx: 20, by: 10, npc: 'web', say: 'The Academy! Lessons for every path are inside. Come in!' },
  { id: 'skills', name: 'Library Tower', art: 'libraryTower', bx: 11, by: 11, npc: 'ts', say: 'All your skills are recorded in the Library.' },
  { id: 'trophies', name: 'Hall of Trophies', art: 'trophyHall', bx: 31, by: 11, npc: 'css', say: 'Hear ye! Trophies and achievements are on display here.' },
  { id: 'farm', name: 'Greenhollow Farm', art: 'barn', bx: 4, by: 20, npc: 'farm', say: 'Want to farm with code? Start with blocks, end with JavaScript!' },
  { id: 'practice', name: 'The Tavern', art: 'tavern', bx: 36, by: 20, npc: 'node', say: 'Games, practice and a merchant. Step inside, friend!' },
  { id: 'quests', name: 'Guild Hall', art: 'guild', bx: 31, by: 29, npc: 'career', say: 'New quests are posted every day at the guild.' },
  { id: 'profile', name: 'Your Cottage', art: 'cottage', bx: 10, by: 29, say: '' },
  { id: 'paths', name: 'Path Board', art: 'board', bx: 21, by: 19, say: '' },
  { id: 'pets', name: 'Pet Sanctuary', art: 'petHouse', bx: 40, by: 12, say: '' },
  { id: 'home', name: 'Your Homestead', art: 'homestead', bx: 13, by: 40, say: '' },
  { id: 'battle', name: 'Monster Gate', art: 'monsterGate', bx: 52, by: 30, say: '' },
];

export interface WorldSceneData {
  avatar: string;
  tunic: string;
  name: string;
  start?: { x: number; y: number };
  onNear: (place: Place | null) => void;
  onEnter: (place: Place) => void;
  onMove: (x: number, y: number) => void;
}

interface Built { place: Place; img: Phaser.GameObjects.Image; door: { x: number; y: number }; tiles: { x0: number; y0: number; x1: number; y1: number } }

export class WorldScene extends Phaser.Scene {
  private d!: WorldSceneData;
  private solid: boolean[][] = [];
  private hero!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private pos = { x: 23, y: 15 };
  private moving = false;
  private path: { x: number; y: number }[] = [];
  private goal: Place | null = null;
  private built: Built[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private near: Place | null = null;
  private walkFrame = 0;
  private bubble?: Phaser.GameObjects.Container;
  private facingLeft = false;
  private ground: string[][] = [];
  private extras: WorldExtras | null = null;
  private fast = false;

  constructor() { super('World'); }
  init() {
    const prof = useGame.getState().profile!;
    let start: { x: number; y: number } | undefined;
    try { start = JSON.parse(sessionStorage.getItem(POS_KEY) || 'null') ?? undefined; } catch { start = undefined; }
    this.d = {
      avatar: prof.avatar, tunic: prof.tunic, name: prof.name, start,
      onNear: (p) => this.game.events.emit('world:near', p),
      onEnter: (p) => go(p.id),
      onMove: (x, y) => sessionStorage.setItem(POS_KEY, JSON.stringify({ x, y })),
    };
  }

  create() {
    const r = rng(7);
    this.solid = Array.from({ length: MH }, () => Array(MW).fill(false));
    const ground: string[][] = Array.from({ length: MH }, () => Array(MW).fill('grass'));
    this.ground = ground;

    // plaza, roads and the pond
    const road = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (ground[y]?.[x] === 'grass') ground[y][x] = 'path';
    };
    for (let y = 13; y <= 19; y++) for (let x = 18; x <= 28; x++) ground[y][x] = 'stone';
    const pond = (cx: number, cy: number, rx: number, ry: number) => {
      for (let y = cy - ry - 1; y <= cy + ry + 1; y++) for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
        const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (e <= 1) { ground[y][x] = 'pond'; this.solid[y][x] = true; }
        else if (e <= 1.9 && ground[y][x] === 'grass') ground[y][x] = 'path';
      }
    };
    pond(11, 16, 4, 3);

    // buildings
    this.built = PLACES.map((place) => {
      const art = BUILDING_ART[place.art]();
      const wT = Math.ceil(art.w / T), hT = Math.ceil(art.h / T);
      const x0 = place.bx, y1 = place.by - 1, y0 = place.by - hT, x1 = place.bx + wT - 1;
      const door = { x: place.bx + Math.floor(art.door[0] / T), y: place.by };
      return { place, door, tiles: { x0, y0, x1, y1 }, img: null as unknown as Phaser.GameObjects.Image, art };
    }).map((b) => {
      const { x0, y0, x1, y1 } = b.tiles;
      for (let y = Math.max(y0 + 1, 0); y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.solid[y]) this.solid[y][x] = true;
      return b;
    }) as Built[];
    // roads from the plaza to every door
    for (const b of this.built) {
      const { x, y } = b.door;
      road(x, y, x, y + 1);
      const midY = y + 1;
      road(x, midY, 23, midY);
      road(23, midY, 23, 16);
      ground[y][x] = 'path';
    }

    // forest border and fields by the farm
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const edge = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2;
      if (edge) this.solid[y][x] = true;
    }
    const fields: [number, number][] = [];
    for (let y = 22; y <= 25; y++) for (let x = 3; x <= 9; x++) if (ground[y][x] === 'grass') { ground[y][x] = 'soil'; fields.push([x, y]); }

    // draw ground
    const tileKey: Record<string, 'grass' | 'path' | 'stone' | 'pond' | 'soil'> = { grass: 'grass', path: 'path', stone: 'stone', pond: 'pond', soil: 'soil' };
    const ponds: Phaser.GameObjects.Image[] = [];
    // the static ground is baked into one texture (thousands of tile images were slow to
    // draw every frame); only the animated pond tiles stay separate images
    const groundRt = this.add.renderTexture(0, 0, MW * T, MH * T).setOrigin(0, 0).setDepth(0);
    groundRt.beginDraw();
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const k = tileKey[ground[y][x]];
      if (k === 'pond') { ponds.push(this.add.image(x * T + 8, y * T + 8, tileTex(this, k, 0)).setDepth(0.5)); continue; }
      groundRt.batchDraw(tileTex(this, k, (x * 7 + y * 13) % 4), x * T, y * T);
    }
    groundRt.endDraw();
    this.time.addEvent({ delay: 650, loop: true, callback: () => ponds.forEach((p) => p.setTexture(tileTex(this, p.texture.key.includes('pond2') ? 'pond' : 'pond2'))) });
    for (const [x, y] of fields) this.add.image(x * T + 8, y * T + 8, spriteTex(this, ['wheat3', 'wheat2', 'carrot3', 'pumpkin3', 'sprout'][(x * 3 + y) % 5])).setDepth(y * T + 10);
    for (let x = 2; x <= 9; x++) { this.add.image(x * T + 8, 26 * T + 6, spriteTex(this, 'fence')).setDepth(26 * T + 12); this.solid[26][x] = true; }

    // forest
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const edge = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2;
      if (edge && (x + y) % 2 === 0) this.add.image(x * T + 8 + (r() - 0.5) * 6, y * T + 4, spriteTex(this, r() < 0.5 ? 'pine' : 'tree')).setDepth(y * T + 14).setScale(1.2);
    }
    // scattered decor on free grass
    for (let i = 0; i < 70; i++) {
      const x = 2 + Math.floor(r() * (MW - 4)), y = 2 + Math.floor(r() * (MH - 4));
      if (ground[y][x] !== 'grass' || this.solid[y][x] || this.nearDoor(x, y)) continue;
      const big = r() < 0.35;
      this.add.image(x * T + 8, y * T + 8, spriteTex(this, big ? (r() < 0.5 ? 'tree' : 'pine') : ['bush', 'rock', 'mushroom', 'stump', 'bush'][Math.floor(r() * 5)])).setDepth(y * T + 12);
      this.solid[y][x] = true;
    }
    // flowers
    groundRt.beginDraw();
    for (let i = 0; i < 160; i++) {
      const x = 2 + r() * (MW - 4), y = 2 + r() * (MH - 4);
      if (ground[Math.floor(y)][Math.floor(x)] !== 'grass') continue;
      const tk = dotTex(this, ['#fff4dc', '#f7f0a8', '#e06a6a', '#b58be0'][i % 4], 2);
      const fr = this.textures.getFrame(tk);
      groundRt.batchDraw(tk, Math.round(x * T - fr.width / 2), Math.round(y * T - fr.height / 2));
    }
    groundRt.endDraw();

    // buildings, labels, NPCs
    for (const b of this.built) {
      const art = (b as unknown as { art: { w: number; h: number; data: Uint8ClampedArray } }).art;
      const key = canvasTex(this, 'bld:' + b.place.art, art.w, art.h, art.data);
      b.img = this.add.image(b.place.bx * T, b.place.by * T, key).setOrigin(0, 1).setDepth(b.place.by * T);
      b.img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.goTo(b.place));
      const label = this.add.text(b.place.bx * T + art.w / 2, b.place.by * T - art.h - 2, t(b.place.name), { fontFamily: FONT, fontSize: '44px', color: '#fff4dc', backgroundColor: '#2b1a12cc', padding: { x: 14, y: 2 } }).setOrigin(0.5, 1).setScale(0.25).setDepth(5000);
      label.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.goTo(b.place));
      UI.reg(this, 'place.' + b.place.id, b.img, t(b.place.name), () => this.goTo(b.place));
      UI.onReveal('place.' + b.place.id, () => { const cam = this.cameras.main; cam.stopFollow(); cam.centerOn(b.place.bx * T + art.w / 2, b.place.by * T - art.h / 2); });
      if (b.place.npc) {
        const nx = b.door.x + 1, ny = b.door.y;
        const npc = this.add.image(nx * T + 8, ny * T + 4, spriteTex(this, 'npc-' + b.place.npc)).setDepth(ny * T + 16);
        this.solid[ny][nx] = true;
        let k = 0;
        this.time.addEvent({ delay: 420, loop: true, callback: () => { k++; npc.setTexture(spriteTex(this, 'npc-' + b.place.npc + (k % 7 === 3 ? '@blink' : k % 5 === 0 ? '@bob' : ''))); } });
        npc.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
          ev.stopPropagation();
          const def = NPC_BY_COURSE[b.place.npc!];
          this.speak(npc, `${def?.name ?? ''}: ${t(b.place.say ?? '')}`);
          play('say');
        });
      }
    }
    // plaza: a well and lamp torches
    this.add.image(26 * T + 8, 15 * T + 8, spriteTex(this, 'well')).setDepth(15 * T + 14);
    this.solid[15][26] = true;
    for (const [lx, ly] of [[18, 13], [28, 13], [18, 19], [28, 19]]) {
      const t = this.add.image(lx * T + 8, ly * T + 6, spriteTex(this, 'torch1')).setDepth(ly * T + 14);
      this.solid[ly][lx] = true;
      let k = lx;
      this.time.addEvent({ delay: 170, loop: true, callback: () => t.setTexture(spriteTex(this, ++k % 2 ? 'torch2' : 'torch1')) });
    }
    // torches at the Academy gate, smoke from chimneys
    const castle = this.built.find((b) => b.place.id === 'learn')!;
    for (const dx of [-2, 2]) {
      const t = this.add.image((castle.door.x + dx) * T + 8, (castle.door.y - 1) * T + 8, spriteTex(this, 'torch1')).setDepth(castle.door.y * T + 20);
      let k = 0;
      this.time.addEvent({ delay: 160, loop: true, callback: () => t.setTexture(spriteTex(this, ++k % 2 ? 'torch2' : 'torch1')) });
    }
    for (const [id, cx, cy] of [['practice', 57, 0], ['profile', 38, 2]] as [string, number, number][]) {
      const b = this.built.find((x) => x.place.id === id)!;
      const sx = b.place.bx * T + cx, sy = b.place.by * T - b.img.height + cy;
      this.time.addEvent({ delay: 380, loop: true, callback: () => {
        const p = this.add.image(sx + Math.random() * 3, sy, dotTex(this, Math.random() < 0.5 ? '#d8d0c8' : '#b8b0a8', 3)).setDepth(6000).setAlpha(0.8);
        this.tweens.add({ targets: p, y: sy - 22, x: p.x + 6, alpha: 0, duration: 2200, onComplete: () => p.destroy() });
      } });
    }
    // birds
    this.time.addEvent({ delay: 7000, loop: true, startAt: 5000, callback: () => {
      const y = (3 + Math.random() * (MH - 8)) * T;
      const bird = this.add.image(-20, y, spriteTex(this, 'bird1')).setDepth(7000);
      let k = 0;
      const flap = this.time.addEvent({ delay: 150, loop: true, callback: () => bird.setTexture(spriteTex(this, ++k % 2 ? 'bird2' : 'bird1')) });
      this.tweens.add({ targets: bird, x: MW * T + 20, y: y - 40, duration: 9000, onComplete: () => { flap.remove(); bird.destroy(); } });
    } });

    // the hero
    const start = this.d.start && !this.solid[this.d.start.y]?.[this.d.start.x] ? this.d.start : { x: 23, y: 14 };
    this.pos = { ...start };
    this.shadow = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.25);
    this.hero = this.add.image(0, 0, this.heroKey('')).setOrigin(0.5, 1);
    UI.reg(this, 'world.hero', this.hero, 'You');
    UI.onReveal('world.hero', () => this.cameras.main.startFollow(this.hero, true, 0.12, 0.12));
    // guided tours may move the camera to a building: follow the hero again afterwards
    this.events.on('resume', () => this.cameras.main.startFollow(this.hero, true, 0.12, 0.12));
    this.placeHero();
    this.fast = horseBonus();
    this.extras = new WorldExtras({ scene: this, T, MW, MH, solid: this.solid, ground: this.ground, hero: () => this.hero, pos: () => this.pos, speak: (i, txt) => this.speak(i, txt) });
    const name = this.add.text(0, 0, this.d.name, { fontFamily: FONT, fontSize: '36px', color: '#ffd66b', stroke: '#2b1a12', strokeThickness: 8 }).setOrigin(0.5, 1).setScale(0.25).setDepth(9000);
    this.events.on('update', () => { name.setPosition(this.hero.x, this.hero.y - 16); this.bubble?.setPosition(this.hero.x, this.hero.y - 20); });
    this.time.addEvent({ delay: 480, loop: true, callback: () => { if (!this.moving) this.hero.setTexture(this.heroKey(this.hero.texture.key.includes('@bob') ? '' : '@bob')); } });

    // input
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ENTER,E,SPACE', false) as Record<string, Phaser.Input.Keyboard.Key>;
    // Enter, E or Space: go in at a door; Space/E also fights a monster next to you or pets your pet
    for (const k of ['ENTER', 'E', 'SPACE']) this.keys[k].on('down', () => {
      if (!this.sys.isActive()) return;
      if (this.near) this.enter(this.near);
      else if (k !== 'ENTER') this.extras?.action();
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length) return;
      const tx = Math.floor(p.worldX / T), ty = Math.floor(p.worldY / T);
      this.goal = null;
      this.walkTo(tx, ty);
      this.marker(tx, ty);
    });

    // camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MW * T, MH * T);
    cam.startFollow(this.hero, true, 0.12, 0.12);
    const fit = () => cam.setZoom(Math.max(2, Math.min(4, Math.round(Math.min(this.scale.width / (30 * T), this.scale.height / (18 * T))))));
    fit();
    this.scale.on('resize', fit);
    this.checkNear();
    const onWorld = (active: boolean) => { if (!this.sys) return; if (active) { this.scene.resume(); this.checkNear(true); maybeTour(this, 'World'); } else { this.scene.pause(); this.game.events.emit('world:near', null); } };
    setHelpContext(this, { screen: 'World', item: 'world', watch: false, button: 'hud.help' });
    if (currentTarget()?.kind === 'world') maybeTour(this, 'World');
    // back after a long time: show what happened (once)
    const away = useGame.getState().away;
    if (away && !away.seen && useGame.getState().tours.World) setTimeout(() => { if (currentTarget()?.scene === 'World') go('welcome-back'); }, 500);
    this.game.events.on('director:world', onWorld);
    const unsub = useGame.subscribe((s, prev) => { if (s.profile && prev.profile && (s.profile.avatar !== prev.profile.avatar || s.profile.tunic !== prev.profile.tunic || s.profile.name !== prev.profile.name)) this.scene.restart(); });
    // the village changes with your pet, monsters and the overgrowth: redraw when they changed
    const sig = () => { const st = useGame.getState(); return [st.pets.active, st.pets.list.find((p) => p.uid === st.pets.active)?.species, st.battle.invaders.map((i) => i.uid).join(','), st.decay.toFixed(1), horseBonus()].join('|'); };
    const mine = sig();
    const onWake = () => { if (sig() !== mine) this.scene.restart(); };
    this.events.on('wake', onWake);
    this.events.on('resume', onWake);
    this.events.once('shutdown', () => { this.game.events.off('director:world', onWorld); unsub(); this.scale.off('resize', fit); this.events.off('wake', onWake); this.events.off('resume', onWake); });
    if (currentTarget()?.kind !== 'world') this.scene.pause();
    (window as unknown as { __worldDebug: unknown }).__worldDebug = {
      goTo: (id: string) => { const p = PLACES.find((x) => x.id === id); if (p) this.goTo(p); },
      pos: () => this.heroPos(),
    };
  }

  private nearDoor(x: number, y: number) { return this.built.some((b) => Math.abs(b.door.x - x) <= 1 && Math.abs(b.door.y - y) <= 2); }
  private heroKey(f: string) { return spriteTex(this, this.d.avatar + f, this.d.tunic); }
  private placeHero() {
    this.hero.setPosition(this.pos.x * T + 8, this.pos.y * T + 14).setDepth(this.pos.y * T + 15);
    this.shadow.setPosition(this.hero.x, this.hero.y - 1).setDepth(this.hero.depth - 1);
  }

  private marker(x: number, y: number) {
    const m = this.add.rectangle(x * T + 8, y * T + 8, 14, 14).setStrokeStyle(1, 0xffd66b).setDepth(2);
    this.tweens.add({ targets: m, alpha: 0, scale: 0.5, duration: 500, onComplete: () => m.destroy() });
  }

  speak(target: Phaser.GameObjects.Image, text: string) {
    const t = this.add.text(target.x, target.y - 14, text, { fontFamily: FONT, fontSize: '36px', color: '#2b1a12', backgroundColor: '#fdf6e3', padding: { x: 12, y: 4 }, wordWrap: { width: 720 } }).setOrigin(0.5, 1).setScale(0.25).setDepth(9500);
    this.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 400, onComplete: () => t.destroy() });
  }

  private free(x: number, y: number) { return x >= 0 && y >= 0 && x < MW && y < MH && !this.solid[y][x]; }

  /** Breadth-first search on the tile grid. */
  private findPath(tx: number, ty: number): { x: number; y: number }[] {
    if (!this.free(tx, ty)) {
      // walk to the nearest free tile instead
      let best: [number, number] | null = null;
      for (let rad = 1; rad < 4 && !best; rad++) for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (!best && this.free(tx + dx, ty + dy)) best = [tx + dx, ty + dy];
      if (!best) return [];
      [tx, ty] = best;
    }
    const prev = new Map<number, number>();
    const key = (x: number, y: number) => y * MW + x;
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

  walkTo(x: number, y: number) { this.path = this.findPath(x, y); }
  heroPos() { return { ...this.pos }; }

  /** Walk to a building's door and go in. */
  goTo(place: Place) {
    const b = this.built.find((x) => x.place.id === place.id);
    if (!b) return;
    if (this.pos.x === b.door.x && this.pos.y === b.door.y) { this.enter(place); return; }
    this.goal = place;
    this.walkTo(b.door.x, b.door.y);
    play('click');
  }

  private enter(place: Place) {
    play('door');
    this.goal = null;
    this.path = [];
    this.d.onEnter(place);
  }

  private stepTo(nx: number, ny: number) {
    if (!this.free(nx, ny)) { this.extras?.bump(nx, ny); return false; }
    const prev = { ...this.pos };
    const dx = nx - this.pos.x;
    if (dx < 0) this.facingLeft = true; else if (dx > 0) this.facingLeft = false;
    this.hero.setFlipX(this.facingLeft);
    this.moving = true;
    this.pos = { x: nx, y: ny };
    this.walkFrame++;
    this.hero.setTexture(this.heroKey(['@walk1', '', '@walk2', ''][this.walkFrame % 4]));
    if (this.walkFrame % 2) play('step');
    this.extras?.follow(prev);
    this.tweens.add({
      targets: this.hero, x: nx * T + 8, y: ny * T + 14, duration: this.fast ? 105 : 150,
      onUpdate: () => { this.shadow.setPosition(this.hero.x, this.hero.y - 1); },
      onComplete: () => {
        this.moving = false;
        this.hero.setDepth(ny * T + 15); this.shadow.setDepth(this.hero.depth - 1);
        this.hero.setTexture(this.heroKey(''));
        this.d.onMove(nx, ny);
        this.checkNear();
        if (!this.path.length && this.goal) {
          const b = this.built.find((x) => x.place.id === this.goal!.id);
          if (b && b.door.x === this.pos.x && b.door.y === this.pos.y) this.enter(this.goal);
          this.goal = null;
        }
      },
    });
    return true;
  }

  private checkNear(force = false) {
    const b = this.built.find((x) => x.door.x === this.pos.x && Math.abs(x.door.y - this.pos.y) <= 0);
    const place = b?.place ?? null;
    if (force || place?.id !== this.near?.id) { this.near = place; this.d.onNear(place); }
  }
  /** Enter the building at the door the hero stands on (used by the HUD prompt). */
  enterNear() { if (this.near) this.enter(this.near); }

  update() {
    if (this.moving || !this.sys.isActive()) return;
    const k = this.keys;
    let dx = 0, dy = 0;
    if (k.LEFT.isDown || k.A.isDown) dx = -1; else if (k.RIGHT.isDown || k.D.isDown) dx = 1;
    else if (k.UP.isDown || k.W.isDown) dy = -1; else if (k.DOWN.isDown || k.S.isDown) dy = 1;
    if (dx || dy) { this.path = []; this.goal = null; if (!this.stepTo(this.pos.x + dx, this.pos.y + dy)) { this.hero.setFlipX(dx < 0 || (dx === 0 && this.facingLeft)); } return; }
    const next = this.path.shift();
    if (next && !this.stepTo(next.x, next.y)) this.path = [];
  }
}
