// Achievement, quest and level-up notifications, shown above every other scene.
import { up } from '../i18n';
import Phaser from 'phaser';
import { useGame, type Toast } from '../game/store';
import { drawFrame } from '../ui/draw';
import { FRAMES, C } from '../ui/theme';
import { iconTex, text } from '../ui/widgets';
import { richTexture } from '../ui/rich';
import { spriteTex } from '../engine/textures';
import { play } from '../audio/sound';

const KIND: Record<Toast['kind'], string> = { achievement: 'Achievement unlocked', level: 'Level up', trophy: 'Trophy', info: 'News', quest: 'Daily quest', pet: 'Pets', home: 'Homestead', battle: 'Battle' };

export class Toasts extends Phaser.Scene {
  private shown = new Map<number, Phaser.GameObjects.Container>();
  constructor() { super({ key: 'Toasts', active: false }); }

  create() {
    const unsub = useGame.subscribe((s) => this.sync(s.toasts));
    this.events.once('shutdown', unsub);
    this.sync(useGame.getState().toasts);
    this.scale.on('resize', () => this.layout());
  }

  private sync(list: Toast[]) {
    for (const t of list) if (!this.shown.has(t.id)) this.add1(t);
    for (const [id, c] of this.shown) if (!list.some((t) => t.id === id)) { this.shown.delete(id); this.tweens.add({ targets: c, alpha: 0, x: c.x + 40, duration: 200, onComplete: () => c.destroy() }); }
    this.layout();
  }

  private add1(t: Toast) {
    const w = Math.min(360, this.scale.width - 20);
    const c = this.add.container(this.scale.width + 10, 0);
    const body = richTexture(this, `**${t.title}**\n${t.text}`, { width: w - 80, size: 18 });
    const h = Math.max(64, body.h + 36);
    const g = this.add.graphics();
    drawFrame(g, 0, 0, w, h, FRAMES.panel);
    c.add(g);
    const badge = this.add.graphics();
    badge.fillStyle(0xe7a72c).fillRect(12, 12, 44, 44).lineStyle(3, 0x4a2e06).strokeRect(12, 12, 44, 44);
    c.add(badge);
    if (t.sprite) c.add(this.add.image(34, 34, spriteTex(this, t.sprite)).setScale(2.5));
    else c.add(this.add.image(34, 34, iconTex(this, t.icon ?? 'star', '#5a3a10', 2)));
    c.add(text(this, 66, 10, up(KIND[t.kind]), 13, C.goldDark, { fontStyle: 'bold' }));
    c.add(this.add.image(66, 28, body.key).setOrigin(0, 0));
    c.setSize(w, h);
    // (a zone, not container.setInteractive: a container's hit area is centred on its position)
    c.add(this.add.zone(0, 0, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => useGame.getState().dismissToast(t.id)));
    this.shown.set(t.id, c);
    play(t.kind === 'level' ? 'levelup' : 'achievement');
    this.time.delayedCall(4800, () => useGame.getState().dismissToast(t.id));
  }

  private layout() {
    const W = this.scale.width, H = this.scale.height;
    let y = H - (W < 760 ? 150 : 190);
    const list = [...this.shown.values()].reverse();
    for (const c of list) {
      const h = c.height;
      y -= h + 8;
      const x = W - c.width - 10;
      this.tweens.add({ targets: c, x, y, duration: 220, ease: 'Back.easeOut' });
    }
  }
}
