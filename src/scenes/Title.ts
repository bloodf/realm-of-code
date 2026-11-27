// Title screen: a castle at night, drifting clouds, the game's name and the first buttons.
import { UIScene } from './base';
import { useGame } from '../game/store';
import { paintTitleScene } from '../pixel/scenes';
import { paintedTex, spriteTex } from '../engine/textures';
import { ANIMS } from '../components/anims';
import { anim, Button, text, panel } from '../ui/widgets';
import { TITLE_FONT, C } from '../ui/theme';
import { go } from '../lib/route';
import { openHelp } from './help/helpers';
import { LANGS, getLang, setLang } from '../i18n';

export class Title extends UIScene {
  constructor() { super('Title'); }

  build() {
    const { W, H } = this;
    const profile = useGame.getState().profile;
    const bg = this.add.image(W / 2, H, paintedTex(this, paintTitleScene())).setOrigin(0.5, 1);
    bg.setScale(Math.max(W / bg.width, H / bg.height));
    const clouds = [0, 1, 2, 3].map((i) => this.add.image((i * W) / 4, 40 + i * 70, spriteTex(this, 'cloud')).setScale(6 + i).setAlpha(0.25 + i * 0.08));
    this.events.on('update', (_t: number, dt: number) => clouds.forEach((c, i) => { c.x += dt * (0.012 + i * 0.004); if (c.x > W + 200) c.x = -200; }));
    const bird = this.add.image(-40, H * 0.25, spriteTex(this, 'bird1')).setScale(3);
    let k = 0;
    this.time.addEvent({ delay: 160, loop: true, callback: () => bird.setTexture(spriteTex(this, ++k % 2 ? 'bird2' : 'bird1')) });
    this.tweens.add({ targets: bird, x: W + 40, y: H * 0.18, duration: 14000, repeat: -1 });

    const cw = Math.min(620, W - 24);
    const ch = profile ? 330 : 380;
    const cx = (W - cw) / 2, cy = Math.max(16, (H - ch) / 2 - 20);
    panel(this, cx, cy, cw, ch, 'wood');
    const size = W < 600 ? 64 : 96;
    this.add.text(W / 2, cy + 18, 'Realm of Code', { fontFamily: TITLE_FONT, fontSize: `${size}px`, color: '#ffd66b', stroke: '#1c110a', strokeThickness: 10 }).setOrigin(0.5, 0);
    text(this, W / 2, cy + 24 + size, 'A pixel RPG where you learn to code: blocks first, then real code.', W < 600 ? 18 : 22, C.cream, { align: 'center', wordWrap: { width: cw - 40 } }).setOrigin(0.5, 0);
    const heroes = ['knight', 'mage', 'ranger'];
    heroes.forEach((h, i) => anim(this, W / 2 - 150 + i * 70, cy + size + 80, ANIMS.heroWalk(h), 8, 56));
    anim(this, W / 2 + 70, cy + size + 70, ANIMS.fairy, 4, 72);
    let by = cy + size + 160;
    if (profile) {
      const b = new Button(this, 0, by, `Continue as ${profile.name}`, () => go('world'), { variant: 'green', id: 'title.continue', icon: 'play' });
      b.x = Math.round((W - b.bw) / 2);
      by += b.bh + 12;
      const n = new Button(this, 0, by, 'Help & FAQ', () => go('help'), { variant: 'ghost', id: 'title.help', icon: 'hint' });
      n.x = Math.round((W - n.bw) / 2);
    } else {
      const b = new Button(this, 0, by, 'Get started', () => go('welcome'), { variant: 'green', id: 'title.start', icon: 'play' });
      b.x = Math.round((W - b.bw) / 2);
      by += b.bh + 12;
      const n = new Button(this, 0, by, 'I already know some code', () => go('welcome'), { variant: 'ghost', id: 'title.know' });
      n.x = Math.round((W - n.bw) / 2);
    }
    this.input.keyboard?.on('keydown-ENTER', () => go(profile ? 'world' : 'welcome'));
    // Lumi: what is this game? (works before you even have a hero)
    // language
    let lx = 12;
    for (const l of LANGS) {
      const lb = new Button(this, lx, 12, l.flag, () => { if (l.id === getLang()) return; useGame.getState().updateSettings({ lang: l.id }); setLang(l.id); location.reload(); }, { variant: getLang() === l.id ? 'gold' : 'wood', h: 44, w: 56, size: 16, id: 'title.lang.' + l.id });
      lx += lb.bw + 6;
    }
    const hb = new Button(this, 0, 12, 'Help', () => openHelp(this, 'about'), { variant: 'gold', sprite: 'fairy', h: 52, size: 18, id: 'title.fairy' });
    hb.x = W - 12 - hb.bw;
  }
}
