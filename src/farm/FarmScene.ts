// The Code Farm stage, drawn with Phaser. It shows the level's field and replays the
// events recorded by the simulation (sim.ts) as animation.
import Phaser from 'phaser';
import { parseFarm, DIRS, type Cell, type FarmDef, type FarmEvent, type Crop } from './sim';
import { spriteTex, tileTex, dotTex } from '../engine/textures';
import { play } from '../audio/sound';
import { rng, hashStr } from '../pixel/scenes';

const T = 16;
const PAD = 2;
const FONT = "'Jersey 15', monospace";

export interface FarmSceneData {
  view?: { x: number; y: number; w: number; h: number };   // where on screen to draw the farm
  def: FarmDef;
  seed: string;
  avatar: string;
  tunic: string;
  onReady: (scene: FarmScene) => void;
}

type Img = Phaser.GameObjects.Image;

const cropKey = (crop: Crop, stage: number) => (stage <= 0 ? 'seed' : stage === 1 ? 'sprout' : `${crop}${stage}`);

export class FarmScene extends Phaser.Scene {
  private d!: FarmSceneData;
  private cells: Cell[][] = [];
  private ground: Img[][] = [];
  private crops: (Img | null)[][] = [];
  private weeds: (Img | null)[][] = [];
  private ponds: Img[] = [];
  private farmer!: Img;
  private pos = { x: 0, y: 0 };
  private walkTimer?: Phaser.Time.TimerEvent;
  private night!: Phaser.GameObjects.Rectangle;
  private bubble?: Phaser.GameObjects.Container;
  private speed: () => number = () => 1;
  private W = 0;
  private H = 0;

  constructor() { super('FarmStage'); }

  init(data: FarmSceneData) { this.d = data; }

  create() {
    const { def } = this.d;
    this.cells = parseFarm(def.rows);
    const w = Math.max(...def.rows.map((r) => r.length));
    const h = def.rows.length;
    this.W = (w + PAD * 2) * T;
    this.H = (h + PAD * 2) * T;
    const r = rng(hashStr(this.d.seed));

    // surroundings: darker grass, trees, bushes, flowers, a scarecrow and a well
    for (let y = 0; y < h + PAD * 2; y++) for (let x = 0; x < w + PAD * 2; x++) {
      this.add.image(x * T + 8, y * T + 8, tileTex(this, 'grassDark', Math.floor(r() * 4))).setDepth(0);
    }
    const deco: [string, number][] = [['tree', 3], ['bush', 3], ['pine', 1], ['rock', 1], ['mushroom', 0.5], ['stump', 0.5]];
    const total = deco.reduce((a, d) => a + d[1], 0);
    const pick = () => { let v = r() * total; for (const [n, wt] of deco) { v -= wt; if (v <= 0) return n; } return 'bush'; };
    const border: [number, number][] = [];
    for (let y = 0; y < h + PAD * 2; y++) for (let x = 0; x < w + PAD * 2; x++) {
      if (x >= PAD && x < w + PAD && y >= PAD && y < h + PAD) continue;
      border.push([x, y]);
    }
    const special = [border[Math.floor(r() * border.length)], border[Math.floor(r() * border.length)]];
    const nearSpecial = (x: number, y: number) => special.some((s) => Math.abs(s[0] - x) <= 1 && Math.abs(s[1] - y) <= 1);
    border.forEach(([x, y], i) => {
      const isSpecial = special.findIndex((s) => s[0] === x && s[1] === y);
      if (isSpecial >= 0) { this.add.image(x * T + 8, y * T + 8, spriteTex(this, isSpecial === 0 ? 'scarecrow' : 'well')).setDepth(5 + y); return; }
      if (r() < 0.45 && i % 2 === 0 && !nearSpecial(x, y)) this.add.image(x * T + 8 + (r() - 0.5) * 4, y * T + 8, spriteTex(this, pick())).setDepth(5 + y);
    });

    // the farm itself
    this.ground = []; this.crops = []; this.weeds = []; this.ponds = [];
    this.cells.forEach((row, y) => {
      this.ground.push([]); this.crops.push([]); this.weeds.push([]);
      row.forEach((c, x) => {
        const [px, py] = this.px(x, y);
        const g = this.add.image(px, py, this.groundKey(c, x, y)).setDepth(1);
        this.ground[y].push(g);
        if (c.g === 'pond') this.ponds.push(g);
        if (c.g === 'fence') this.add.image(px, py, spriteTex(this, 'fence')).setDepth(6 + y);
        if (c.g === 'rock') this.add.image(px, py, spriteTex(this, 'rock')).setDepth(6 + y);
        this.crops[y].push(c.crop ? this.add.image(px, py, spriteTex(this, cropKey(c.crop, c.stage))).setDepth(10 + y) : null);
        this.weeds[y].push(c.weed ? this.add.image(px, py, spriteTex(this, 'weed')).setDepth(10 + y) : null);
      });
    });
    // a soft shadow line between the farm and the surroundings
    const frame = this.add.graphics().setDepth(2);
    frame.lineStyle(1, 0x2b1a12, 0.5).strokeRect(PAD * T - 0.5, PAD * T - 0.5, w * T + 1, h * T + 1);

    // the farmer
    this.pos = { x: def.start[0], y: def.start[1] };
    const [fx, fy] = this.px(this.pos.x, this.pos.y);
    this.farmer = this.add.image(fx, fy - 4, this.heroKey('')).setDepth(40);
    this.time.addEvent({ delay: 500, loop: true, callback: () => { if (!this.walkTimer) this.farmer.setTexture(this.heroKey(this.farmer.texture.key.includes('@bob') ? '' : '@bob')); } });
    if (this.ponds.length) this.time.addEvent({ delay: 600, loop: true, callback: () => this.ponds.forEach((p) => p.setTexture(tileTex(this, p.texture.key.includes('pond2') ? 'pond' : 'pond2'))) });

    this.night = this.add.rectangle(this.W / 2, this.H / 2, this.W * 3, this.H * 3, 0x141033, 0).setDepth(90);

    this.cameras.main.setBackgroundColor('#4a8a32');
    this.fit();
    this.d.onReady(this);
  }

  /** Moves the farm to a new screen rectangle. */
  setView(v: { x: number; y: number; w: number; h: number }) { this.d.view = v; this.fit(); }

  private fit() {
    const cam = this.cameras.main;
    const v = this.d.view ?? { x: 0, y: 0, w: this.scale.width, h: this.scale.height };
    cam.setViewport(Math.round(v.x), Math.round(v.y), Math.max(1, Math.round(v.w)), Math.max(1, Math.round(v.h)));
    const vw = v.w, vh = v.h;
    let z = Math.min(vw / this.W, vh / this.H);
    z = z >= 2 ? Math.floor(z * 2) / 2 : Math.max(0.5, z);
    cam.setZoom(z);
    cam.centerOn(this.W / 2, this.H / 2);
  }

  private px(x: number, y: number): [number, number] { return [(x + PAD) * T + 8, (y + PAD) * T + 8]; }
  private heroKey(frame: string) { return spriteTex(this, this.d.avatar + frame, this.d.tunic); }
  private groundKey(c: Cell, x: number, y: number) {
    const v = (x * 7 + y * 13) % 4;
    switch (c.g) {
      case 'soil': return tileTex(this, c.wet ? 'soilWet' : 'soil', v);
      case 'path': return tileTex(this, 'path', v);
      case 'pond': return tileTex(this, 'pond');
      default: return tileTex(this, 'grass', v);
    }
  }

  private ms(n: number) { return Math.max(16, n / this.speed()); }
  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((res) => { this.tweens.add({ ...cfg, onComplete: () => res() }); });
  }
  private wait(n: number): Promise<void> { return new Promise((res) => { this.time.delayedCall(this.ms(n), () => res()); }); }

  private setCrop(x: number, y: number, crop: Crop | null, stage: number) {
    const old = this.crops[y][x];
    if (!crop) { old?.destroy(); this.crops[y][x] = null; return null; }
    const key = spriteTex(this, cropKey(crop, stage));
    if (old) { old.setTexture(key); return old; }
    const [px, py] = this.px(x, y);
    const img = this.add.image(px, py, key).setDepth(10 + y);
    this.crops[y][x] = img;
    return img;
  }

  private burst(x: number, y: number, color: string, n: number, spread = 8, up = 10) {
    const [px, py] = this.px(x, y);
    for (let i = 0; i < n; i++) {
      const p = this.add.image(px + (Math.random() - 0.5) * 6, py + (Math.random() - 0.5) * 6, dotTex(this, color, Math.random() < 0.3 ? 2 : 1)).setDepth(60);
      void this.tween({ targets: p, x: p.x + (Math.random() - 0.5) * spread * 2, y: p.y - up * Math.random() - 2, alpha: 0, duration: this.ms(450 + Math.random() * 200), onComplete: () => p.destroy() });
    }
  }

  private say(text: string, color = '#fff4dc', bg = '#2b1a12', ms = 1100) {
    this.bubble?.destroy();
    const t = this.add.text(0, 0, text.length > 46 ? text.slice(0, 45) + '…' : text, { fontFamily: FONT, fontSize: '40px', color, backgroundColor: bg, padding: { x: 12, y: 4 } }).setScale(0.25).setOrigin(0.5, 1);
    const c = this.add.container(this.farmer.x, this.farmer.y - 10, [t]).setDepth(95);
    this.bubble = c;
    this.time.delayedCall(this.ms(ms), () => { if (this.bubble === c) { c.destroy(); this.bubble = undefined; } });
  }

  private walkAnim(on: boolean) {
    if (on && !this.walkTimer) {
      let k = 0;
      this.walkTimer = this.time.addEvent({ delay: 110, loop: true, callback: () => { k++; this.farmer.setTexture(this.heroKey(['@walk1', '', '@walk2', ''][k % 4])); } });
    } else if (!on && this.walkTimer) {
      this.walkTimer.remove(); this.walkTimer = undefined;
      this.farmer.setTexture(this.heroKey(''));
    }
  }

  /** Plays one recorded event. */
  async step(e: FarmEvent) {
    switch (e.t) {
      case 'move': {
        const [px, py] = this.px(e.x, e.y);
        if (e.dir === 'left') this.farmer.setFlipX(true); else if (e.dir === 'right') this.farmer.setFlipX(false);
        this.walkAnim(true);
        if (this.speed() <= 2) play('step');
        await this.tween({ targets: this.farmer, x: px, y: py - 4, duration: this.ms(220) });
        this.farmer.setDepth(40 + e.y);
        this.pos = { x: e.x, y: e.y };
        this.walkAnim(false);
        break;
      }
      case 'bump': {
        const [dx, dy] = DIRS[e.dir];
        play('bump');
        this.farmer.setTint(0xff8080);
        await this.tween({ targets: this.farmer, x: this.farmer.x + dx * 5, y: this.farmer.y + dy * 5, duration: this.ms(90), yoyo: true });
        this.farmer.clearTint();
        this.say('Ouch! Something is in the way.', '#fff4dc', '#8e2a23', 900);
        await this.wait(350);
        break;
      }
      case 'till': {
        play('swing');
        this.cells[e.y][e.x].g = 'soil';
        this.ground[e.y][e.x].setTexture(this.groundKey(this.cells[e.y][e.x], e.x, e.y));
        this.burst(e.x, e.y, '#8a5a34', 10);
        await this.wait(200);
        break;
      }
      case 'plant': {
        if (this.speed() <= 2) play('click');
        const c = this.cells[e.y][e.x];
        c.crop = e.crop; c.stage = 0;
        const img = this.setCrop(e.x, e.y, e.crop, 0)!;
        img.setScale(0);
        await this.tween({ targets: img, scale: 1, duration: this.ms(180), ease: 'Back.easeOut' });
        break;
      }
      case 'water': {
        if (this.speed() <= 2) play('splash');
        const c = this.cells[e.y][e.x];
        c.wet = true;
        const [px, py] = this.px(e.x, e.y);
        for (let i = 0; i < 6; i++) {
          const drop = this.add.image(px - 5 + i * 2, py - 14, dotTex(this, i % 2 ? '#9fd8f5' : '#3f7fc9')).setDepth(60);
          void this.tween({ targets: drop, y: py + 2, alpha: 0.3, duration: this.ms(260 + i * 30), onComplete: () => drop.destroy() });
        }
        await this.wait(220);
        this.ground[e.y][e.x].setTexture(this.groundKey(c, e.x, e.y));
        break;
      }
      case 'harvest': case 'rot': {
        const img = this.crops[e.y][e.x];
        this.crops[e.y][e.x] = null;
        const c = this.cells[e.y][e.x];
        c.crop = null; c.stage = 0;
        if (e.t === 'harvest') {
          play('coin');
          this.burst(e.x, e.y, '#f2c14e', 8, 6, 14);
          if (img) await this.tween({ targets: img, y: img.y - 14, alpha: 0, duration: this.ms(300), onComplete: () => img.destroy() });
        } else {
          play('wrong');
          img?.setTint(0x7a6a50);
          this.say('Too early! That crop was not ripe.', '#fff4dc', '#8e2a23', 1000);
          if (img) await this.tween({ targets: img, alpha: 0, scaleY: 0.3, duration: this.ms(400), onComplete: () => img.destroy() });
        }
        break;
      }
      case 'weed': {
        play('swing');
        const img = this.weeds[e.y][e.x];
        this.weeds[e.y][e.x] = null;
        this.cells[e.y][e.x].weed = false;
        this.burst(e.x, e.y, '#24603a', 6);
        if (img) await this.tween({ targets: img, y: img.y - 16, angle: 90, alpha: 0, duration: this.ms(280), onComplete: () => img.destroy() });
        break;
      }
      case 'sleep': {
        play('page');
        this.farmer.setAlpha(0.35);
        await this.tween({ targets: this.night, fillAlpha: 0.7, duration: this.ms(350) });
        this.say(`Zzz... night ${e.day}`, '#d8d0ff', '#241f4a', 700);
        await this.wait(350);
        for (const [x, y, stage] of e.grew) {
          const c = this.cells[y][x];
          c.stage = stage;
          if (c.crop) { const img = this.setCrop(x, y, c.crop, stage); if (img) { img.setScale(0.6); void this.tween({ targets: img, scale: 1, duration: this.ms(200), ease: 'Back.easeOut' }); } }
        }
        this.cells.forEach((row, y) => row.forEach((c, x) => { if (c.wet) { c.wet = false; this.ground[y][x].setTexture(this.groundKey(c, x, y)); } }));
        if (e.grew.length) play('unlock');
        await this.wait(250);
        await this.tween({ targets: this.night, fillAlpha: 0, duration: this.ms(350) });
        this.farmer.setAlpha(1);
        break;
      }
      case 'refill': {
        play('splash');
        this.burst(this.pos.x, this.pos.y, '#9fd8f5', 14, 10, 12);
        this.say('Can refilled!', '#fff4dc', '#285c94', 700);
        await this.wait(300);
        break;
      }
      case 'say': {
        play('say');
        this.say(e.text, '#2b1a12', '#fdf6e3', 1300);
        await this.wait(700);
        break;
      }
      case 'oops': {
        play('bump');
        this.say(e.text, '#fff4dc', '#8e2a23', 1300);
        this.farmer.setTint(0xff8080);
        await this.wait(420);
        this.farmer.clearTint();
        break;
      }
    }
  }

  /** Replays events. `onEvent` runs before each one (for highlighting); `stopped` ends early. */
  async playEvents(events: FarmEvent[], opts: { speed: () => number; onEvent: (i: number, e: FarmEvent) => void; stopped: () => boolean }) {
    this.speed = opts.speed;
    for (let i = 0; i < events.length; i++) {
      if (opts.stopped() || !this.sys.isActive()) return;
      opts.onEvent(i, events[i]);
      await this.step(events[i]);
      if (this.speed() < 8) await this.wait(40);
    }
  }

  /** Celebrate (all goals met). */
  cheer() {
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 150, () => this.burst(this.pos.x, this.pos.y, ['#f2c14e', '#fff4dc', '#8fd14f', '#e06a6a'][i], 10, 14, 18));
    void this.tween({ targets: this.farmer, y: this.farmer.y - 6, duration: 160, yoyo: true, repeat: 2 });
  }
}
