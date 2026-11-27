// Life in the village: your pet follows you, monsters wander in after a long absence,
// weeds and gloom grow when nobody learns for days, and Space does things.
import Phaser from 'phaser';
import { spriteTex } from '../engine/textures';
import { useGame } from '../game/store';
import { activePet, petSprite, mood, playWithPet } from '../game/pets';
import { MOBS, mobName } from '../game/battle';
import { go } from '../lib/route';
import { play } from '../audio/sound';
import { t } from '../i18n';
import { UI } from '../ui/widgets';

export interface WorldHost {
  scene: Phaser.Scene;
  T: number;
  MW: number;
  MH: number;
  solid: boolean[][];
  ground: string[][];
  hero: () => Phaser.GameObjects.Image;
  pos: () => { x: number; y: number };
  speak: (target: Phaser.GameObjects.Image, text: string) => void;
}

export class WorldExtras {
  private pet: Phaser.GameObjects.Image | null = null;
  private petPos = { x: 0, y: 0 };
  private invaders = new Map<string, { img: Phaser.GameObjects.Image; x: number; y: number }>();

  constructor(private h: WorldHost) {
    this.decay();
    this.spawnPet();
    this.spawnInvaders();
  }

  // ---------------- the pet ----------------
  private spawnPet() {
    const p = activePet();
    if (!p) return;
    const { scene, T } = this.h;
    const hp = this.h.pos();
    this.petPos = { x: hp.x - 1, y: hp.y };
    if (this.h.solid[this.petPos.y]?.[this.petPos.x]) this.petPos = { x: hp.x, y: hp.y + 1 };
    const key = petSprite(p);
    this.pet = scene.add.image(this.petPos.x * T + 8, this.petPos.y * T + 14, spriteTex(scene, key)).setOrigin(0.5, 1).setScale(0.85);
    this.pet.setDepth(this.petPos.y * T + 14);
    let k = 0;
    scene.time.addEvent({ delay: 380, loop: true, callback: () => { k++; this.pet?.setTexture(spriteTex(scene, key + (k % 2 ? '@bob' : k % 9 === 4 ? '@blink' : ''))); } });
    const m = mood(p);
    if (m === 'hungry' || m === 'sad') {
      scene.time.addEvent({ delay: 4000, loop: true, callback: () => this.emote(m === 'hungry' ? '...' : ':(') });
    } else if (p.shiny) {
      scene.time.addEvent({ delay: 700, loop: true, callback: () => this.sparkle() });
    }
    this.pet.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.petThePet(); });
    UI.reg(scene, 'world.pet', this.pet, p.name, () => this.petThePet());
  }

  private emote(s: string) {
    if (!this.pet) return;
    const tx = this.h.scene.add.text(this.pet.x, this.pet.y - 16, s, { fontFamily: "'Jersey 15'", fontSize: '40px', color: '#2b1a12', backgroundColor: '#fdf6e3', padding: { x: 8, y: 0 } }).setOrigin(0.5, 1).setScale(0.25).setDepth(9500);
    this.h.scene.tweens.add({ targets: tx, y: tx.y - 6, alpha: 0, delay: 900, duration: 500, onComplete: () => tx.destroy() });
  }
  private sparkle() {
    if (!this.pet) return;
    const s = this.h.scene.add.image(this.pet.x + (Math.random() - 0.5) * 14, this.pet.y - 4 - Math.random() * 12, spriteTex(this.h.scene, 'starIcon')).setScale(0.25).setDepth(9400);
    this.h.scene.tweens.add({ targets: s, alpha: 0, y: s.y - 5, duration: 600, onComplete: () => s.destroy() });
  }
  private hearts() {
    if (!this.pet) return;
    for (let i = 0; i < 3; i++) {
      const hh = this.h.scene.add.image(this.pet.x + (i - 1) * 5, this.pet.y - 12, spriteTex(this.h.scene, 'heart')).setScale(0.35).setDepth(9400);
      this.h.scene.tweens.add({ targets: hh, y: hh.y - 12, alpha: 0, delay: i * 120, duration: 700, onComplete: () => hh.destroy() });
    }
  }
  petThePet() {
    const p = activePet();
    if (!p) return;
    playWithPet(p.uid);
    play('coin');
    this.hearts();
  }

  /** After every hero step the pet walks to where the hero just was. */
  follow(prev: { x: number; y: number }) {
    if (!this.pet) return;
    const { T, scene } = this.h;
    if (prev.x === this.petPos.x && prev.y === this.petPos.y) return;
    this.petPos = { ...prev };
    if (prev.x !== (this.pet.x - 8) / T) this.pet.setFlipX(prev.x * T + 8 < this.pet.x);
    scene.tweens.add({ targets: this.pet, x: prev.x * T + 8, y: prev.y * T + 14, duration: 160, onComplete: () => this.pet?.setDepth(prev.y * T + 14) });
  }
  nearPet() { const p = this.h.pos(); return !!this.pet && Math.abs(p.x - this.petPos.x) + Math.abs(p.y - this.petPos.y) <= 1; }

  // ---------------- invaders ----------------
  private spawnInvaders() {
    const { scene, T, solid } = this.h;
    for (const inv of useGame.getState().battle.invaders) {
      let { x, y } = inv;
      for (let r = 0; r < 4 && solid[y]?.[x]; r++) { x = inv.x + r; y = inv.y + (r % 2); }
      if (solid[y]?.[x]) continue;
      const mob = MOBS[inv.mob];
      if (!mob) continue;
      const img = scene.add.image(x * T + 8, y * T + 14, spriteTex(scene, mob.sprite)).setOrigin(0.5, 1).setDepth(y * T + 14);
      scene.tweens.add({ targets: img, y: img.y - 2, duration: 500 + Math.random() * 300, yoyo: true, repeat: -1 });
      solid[y][x] = true;
      img.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.fight(inv.uid); });
      UI.reg(scene, 'invader.' + inv.uid, img, mobName(inv.mob), () => this.fight(inv.uid));
      this.invaders.set(inv.uid, { img, x, y });
      scene.time.addEvent({ delay: 5000 + Math.random() * 4000, loop: true, callback: () => { if (Math.random() < 0.4) this.h.speak(img, t(mob.taunt)); } });
    }
  }
  private fight(uid: string) { play('door'); go('battle/invader/' + uid); }
  /** The hero tried to step onto a tile: is there a monster? */
  bump(x: number, y: number): boolean {
    for (const [uid, v] of this.invaders) if (v.x === x && v.y === y) { this.fight(uid); return true; }
    return false;
  }
  adjacentInvader(): string | null {
    const p = this.h.pos();
    for (const [uid, v] of this.invaders) if (Math.abs(v.x - p.x) + Math.abs(v.y - p.y) === 1) return uid;
    return null;
  }

  /** Space: fight a monster next to you, or play with your pet. Returns true if something happened. */
  action(): boolean {
    const inv = this.adjacentInvader();
    if (inv) { this.fight(inv); return true; }
    if (this.nearPet()) { this.petThePet(); return true; }
    return false;
  }

  // ---------------- decay ----------------
  private decay() {
    const d = useGame.getState().decay;
    if (d <= 0) return;
    const { scene, T, MW, MH, solid, ground } = this.h;
    let seed = 99;
    const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const n = Math.round(d * 90);
    for (let i = 0; i < n * 3 && i < 400; i++) {
      const x = 2 + Math.floor(r() * (MW - 4)), y = 2 + Math.floor(r() * (MH - 4));
      if (solid[y]?.[x] || !['grass', 'path', 'stone'].includes(ground[y]?.[x])) continue;
      scene.add.image(x * T + 8, y * T + 10, spriteTex(scene, r() < 0.7 ? 'weed' : 'mushroom')).setDepth(y * T + 2).setAlpha(0.9);
    }
    // gloom: a dark veil, and rain when it is bad
    const veil = scene.add.rectangle(0, 0, MW * T, MH * T, 0x2a2440, Math.min(0.35, d * 0.4)).setOrigin(0, 0).setDepth(8800);
    void veil;
    if (d >= 0.4) {
      scene.time.addEvent({ delay: 60, loop: true, callback: () => {
        const cam = scene.cameras.main;
        const x = cam.worldView.x + Math.random() * cam.worldView.width, y = cam.worldView.y - 10;
        const drop = scene.add.rectangle(x, y, 1, 5, 0x9fb8e8, 0.7).setOrigin(0, 0).setDepth(8900);
        scene.tweens.add({ targets: drop, y: y + cam.worldView.height + 20, x: x - 20, duration: 700, onComplete: () => drop.destroy() });
      } });
    }
  }
}
