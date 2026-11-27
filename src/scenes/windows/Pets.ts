// The Pet Sanctuary: hatch eggs, care for your pets (feed, play, choose who follows you),
// the Petdex of all 20 species (normal and shiny) and the egg shop.
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame } from '../../game/store';
import type { Pet, Rarity } from '../../game/types07';
import { SPECIES, RARITY, RARITIES, SPECIES_BY_ID, petSprite, speciesName, rarityName, hatch, feedPet, playWithPet, setActivePet, renamePet, buyEgg, tickPets, updatePet, moodText, mood } from '../../game/pets';
import { itemName, itemSprite } from '../../game/home';
import { ANIMS } from '../../components/anims';
import { anim, Button, Card, sprite, text, ScrollView, bar, modal, domInput, bigTitle } from '../../ui/widgets';
import { spriteTex } from '../../engine/textures';
import { C, N } from '../../ui/theme';
import { say } from '../kit';
import { h2, box, pill } from '../winkit';
import { play } from '../../audio/sound';
import { go } from '../../lib/route';
import { t } from '../../i18n';

const FOODS = ['carrot', 'cabbage', 'strawberry', 'corn', 'potato', 'tomato', 'wheat', 'pumpkin', 'egg', 'milk', 'truffle'];

export class PetsWindow extends WindowScene {
  winTitle = t('Pet Sanctuary');
  winIcon = 'heart';
  wide = true;
  constructor() { super('W:pets'); }

  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    tickPets();
    const s = useGame.getState();
    const P = s.pets;
    let y = say(this, c, 0, 0, w, ANIMS.fairy, t('Eggs hatch while you learn: every XP you earn warms them. Pets follow you in the village, and a happy pet gives you bonus XP. Remember to feed them!'), t('Lumi · your guide')).h + 16;

    // ---- eggs ----
    y = h2(this, c, y, t('Eggs'));
    if (!P.eggs.length) { c.add(text(this, 0, y, t('No eggs right now. Win battles, finish quests or buy one below.'), 18, C.inkSoft, { wordWrap: { width: w } })); y += 34; }
    const ew = 150, eh = 196, ecols = Math.max(1, Math.floor((w + 10) / (ew + 10)));
    P.eggs.forEach((e, i) => {
      const ex = (i % ecols) * (ew + 10), ey = y + Math.floor(i / ecols) * (eh + 10);
      const ready = e.progress >= e.need;
      const card = new Card(this, ex, ey, ew, eh, ready ? () => this.hatchEgg(e.uid) : null, { id: 'egg.' + i, label: t('Egg'), clip: sv, frame: ready ? 'sel' : undefined });
      const img = this.add.image(ew / 2, 62, spriteTex(this, 'egg-' + e.kind)).setScale(5);
      card.add(img);
      if (ready) this.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 180, yoyo: true, repeat: -1 });
      card.add(text(this, ew / 2, 110, rarityName(e.kind), 16, RARITY[e.kind].color, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      card.add(bar(this, 14, 134, ew - 28, 12, e.progress / e.need, '#e7a72c'));
      card.add(text(this, ew / 2, 148, ready ? t('Ready to hatch!') : `${e.progress}/${e.need} XP`, 15, ready ? C.greenDark : C.inkSoft, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      if (ready) card.add(new Button(this, 14, eh - 28, t('Hatch!'), () => this.hatchEgg(e.uid), { variant: 'green', w: ew - 28, h: 24, size: 14, id: 'egg.hatch.' + i, clip: sv }).setY(eh - 30));
      c.add(card);
    });
    if (P.eggs.length) y += Math.ceil(P.eggs.length / ecols) * (eh + 10) + 6;

    // ---- your pets ----
    y = h2(this, c, y + 6, t('Your pets') + ` (${P.list.length})`);
    if (!P.list.length) { c.add(text(this, 0, y, t('Hatch an egg to get your first pet.'), 18, C.inkSoft)); y += 34; }
    const pw = w >= 760 ? (w - 10) / 2 : w, ph = 150;
    P.list.forEach((p0, i) => {
      const p = updatePet(p0);
      const px = w >= 760 ? (i % 2) * (pw + 10) : 0, py = y + Math.floor(i / (w >= 760 ? 2 : 1)) * (ph + 10);
      const active = P.active === p.uid;
      const sp = SPECIES_BY_ID[p.species];
      box(this, c, px, py, pw, ph, active ? 'sel' : 'panel');
      const pic = anim(this, px + 14, py + 16, ANIMS.pet(petSprite(p)), 3, 96);
      c.add(pic);
      if (p.shiny) c.add(sprite(this, px + 92, py + 12, 'starIcon', 20));
      const tx = px + 124;
      c.add(text(this, tx, py + 10, p.name, 22, C.ink, { fontStyle: 'bold' }));
      c.add(text(this, tx, py + 36, `${speciesName(sp.id)} · ${rarityName(sp.rarity)}${p.shiny ? ' · ' + t('Shiny') : ''} · ${t('Level')} ${p.level}`, 15, RARITY[sp.rarity].color, { fontStyle: 'bold' }));
      const bw = Math.min(160, (pw - 124 - 24) / 2 - 8);
      c.add(text(this, tx, py + 58, t('Food'), 14, C.inkSoft)); c.add(bar(this, tx, py + 76, bw, 12, p.full / 100, p.full < 25 ? '#d2473c' : '#e7a72c'));
      c.add(text(this, tx + bw + 16, py + 58, t('Joy'), 14, C.inkSoft)); c.add(bar(this, tx + bw + 16, py + 76, bw, 12, p.joy / 100, p.joy < 25 ? '#d2473c' : '#e06a9a'));
      c.add(text(this, px + pw - 14, py + 10, moodText(p), 15, mood(p) === 'happy' ? C.greenDark : mood(p) === 'ok' ? C.inkSoft : C.redDark, { fontStyle: 'bold' }).setOrigin(1, 0));
      let bx = tx;
      const btn = (label: string, fn: () => void, variant: 'green' | 'blue' | 'paper' | 'gold', id: string) => { const b = new Button(this, bx, py + ph - 50, label, fn, { variant, h: 38, size: 14, id: id + '.' + i, clip: sv }); c.add(b); bx += b.bw + 6; };
      btn(active ? t('Following') : t('Follow me'), () => { setActivePet(active ? null : p.uid); play('click'); this.rebuild(); }, active ? 'gold' : 'blue', 'pet.follow');
      btn(t('Feed'), () => this.feedMenu(p), 'green', 'pet.feed');
      btn(t('Play'), () => { playWithPet(p.uid); play('coin'); this.rebuild(); }, 'paper', 'pet.play');
      btn(t('Rename'), () => this.renameMenu(p), 'paper', 'pet.rename');
    });
    if (P.list.length) y += Math.ceil(P.list.length / (w >= 760 ? 2 : 1)) * (ph + 10) + 6;

    // ---- Petdex ----
    const found = SPECIES.filter((x) => P.dex[x.id]).length;
    y = h2(this, c, y + 6, t('Petdex') + ` · ${found}/20`);
    const dw = 112, dh = 132, dcols = Math.max(2, Math.floor((w + 8) / (dw + 8)));
    SPECIES.forEach((sp, i) => {
      const dx = (i % dcols) * (dw + 8), dy = y + Math.floor(i / dcols) * (dh + 8);
      const d = P.dex[sp.id];
      box(this, c, dx, dy, dw, dh, d ? 'panel' : 'stone');
      const img = this.add.image(dx + dw / 2, dy + 48, spriteTex(this, 'pet-' + sp.id + (d?.shiny ? '*shiny' : ''))).setScale(4);
      if (!d) img.setTint(0x2b1a12).setAlpha(0.55);
      c.add(img);
      c.add(text(this, dx + dw / 2, dy + 86, d ? speciesName(sp.id) : '???', 15, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      c.add(text(this, dx + dw / 2, dy + 106, rarityName(sp.rarity), 13, RARITY[sp.rarity].color, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      if (d?.shiny) c.add(sprite(this, dx + dw - 24, dy + 6, 'starIcon', 18));
      if (d) c.add(text(this, dx + 8, dy + 6, `×${d.n}`, 14, C.inkSoft, { fontStyle: 'bold' }));
    });
    y += Math.ceil(SPECIES.length / dcols) * (dh + 8) + 8;
    c.add(text(this, 0, y, t('Every pet can hatch shiny (1 in 20): same friend, rare colours.'), 15, C.inkSoft, { wordWrap: { width: w } }));
    y += 30;

    // ---- egg shop ----
    y = h2(this, c, y, t('Egg shop'));
    box(this, c, 0, y, w, 112);
    let sx = 16;
    for (const r of RARITIES.filter((x) => RARITY[x].eggPrice > 0)) {
      c.add(sprite(this, sx, y + 18, 'egg-' + r, 64));
      c.add(text(this, sx + 70, y + 18, t('{r} egg', { r: rarityName(r) }), 17, RARITY[r].color, { fontStyle: 'bold' }));
      c.add(new Button(this, sx + 70, y + 48, String(RARITY[r].eggPrice), () => { if (buyEgg(r as Rarity)) { play('coin'); this.rebuild(); } else play('wrong'); }, { variant: 'gold', sprite: 'coin', h: 42, size: 16, id: 'egg.buy.' + r, clip: sv, disabled: s.gold < RARITY[r].eggPrice }));
      sx += Math.min(260, (w - 20) / 3);
    }
    y += 124;
    c.add(text(this, 0, y, t('Ultra rare eggs cannot be bought: beat bosses at the Monster Gate to find them.'), 15, C.inkSoft, { wordWrap: { width: w } }));
    return y + 40;
  }

  private hatchEgg(eggUid: string) {
    const kind = useGame.getState().pets.eggs.find((e) => e.uid === eggUid)?.kind ?? 'common';
    const pet = hatch(eggUid);
    if (!pet) return;
    play('unlock');
    const sp = SPECIES_BY_ID[pet.species];
    const m = modal(this, 480, (c, w, close) => {
      const egg = this.add.image(w / 2, 110, spriteTex(this, 'egg-' + kind)).setScale(8);
      c.add(egg);
      this.tweens.add({ targets: egg, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, repeat: 5, onComplete: () => {
        egg.destroy();
        play('victory');
        this.cameras.main.flash(350, 255, 255, 255);
        const pic = anim(this, w / 2 - 64, 40, ANIMS.pet(petSprite(pet)), 3, 128);
        c.add(pic);
        if (pet.shiny) for (let i = 0; i < 6; i++) { const st = sprite(this, w / 2 - 80 + Math.random() * 160, 30 + Math.random() * 130, 'starIcon', 20); c.add(st); this.tweens.add({ targets: st, alpha: 0.2, duration: 400 + i * 80, yoyo: true, repeat: -1 }); }
        c.add(bigTitle(this, w / 2, 180, speciesName(pet.species), 44, RARITY[sp.rarity].color));
        c.add(text(this, w / 2, 236, `${rarityName(sp.rarity)}${pet.shiny ? ' · ' + t('SHINY!') : ''}`, 20, RARITY[sp.rarity].color, { fontStyle: 'bold' }).setOrigin(0.5, 0));
        c.add(text(this, w / 2, 266, t(sp.desc), 17, C.inkSoft, { align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0));
        c.add(new Button(this, w / 2 - 110, 330, t('Say hello!'), () => { close(); this.rebuild(); }, { variant: 'green', w: 220, id: 'hatch.ok' }));
      } });
      return 400;
    }, { closable: false });
    void m;
  }

  private feedMenu(p: Pet) {
    const inv = useGame.getState().home.inv;
    const foods = FOODS.filter((f) => (inv[f] ?? 0) > 0);
    modal(this, 520, (c, w, close) => {
      c.add(text(this, 20, 18, t('Feed {name}', { name: p.name }), 24, C.ink, { fontStyle: 'bold' }));
      let y = 56;
      if (!foods.length) {
        c.add(text(this, 20, y, t('You have no food. Grow vegetables or collect eggs and milk at your homestead.'), 18, C.inkSoft, { wordWrap: { width: w - 40 } }));
        c.add(new Button(this, 20, y + 60, t('Go to the homestead'), () => { close(); go('home'); }, { variant: 'green', id: 'feed.home' }));
        return y + 130;
      }
      const likes = SPECIES_BY_ID[p.species].likes;
      foods.forEach((f, i) => {
        const x = 20 + (i % 3) * ((w - 40) / 3), yy = y + Math.floor(i / 3) * 70;
        const card = new Card(this, x, yy, (w - 40) / 3 - 8, 62, () => { const r = feedPet(p.uid, f); play(r === 'ok' ? 'coin' : 'wrong'); close(); this.rebuild(); }, { id: 'feed.' + f, label: itemName(f) });
        card.add(sprite(this, 8, 14, itemSprite(f), 32));
        card.add(text(this, 46, 10, itemName(f), 15, C.ink, { fontStyle: 'bold' }));
        card.add(text(this, 46, 32, `×${inv[f]}${likes.includes(f) ? '  ♥' : ''}`, 15, likes.includes(f) ? C.red : C.inkSoft, { fontStyle: 'bold' }));
        c.add(card);
      });
      y += Math.ceil(foods.length / 3) * 70 + 6;
      c.add(text(this, 20, y, t('♥ = favourite food: more joy.'), 15, C.inkSoft));
      return y + 40;
    });
  }

  private renameMenu(p: Pet) {
    modal(this, 460, (c, w, close) => {
      c.add(text(this, 20, 18, t('A new name for your pet'), 22, C.ink, { fontStyle: 'bold' }));
      const inp = domInput(this, 0, 0, w - 40, 46, { value: p.name, maxLength: 16, id: 'pet.name', onEnter: () => ok() });
      const ok = () => { renamePet(p.uid, inp.el.value.trim()); useGame.getState().unlock('pet_name'); inp.dom.destroy(); close(); this.rebuild(); };
      this.time.delayedCall(150, () => { const mm = c.getBounds(); inp.dom.setPosition(mm.x + 20, mm.y + 56); inp.dom.setDepth(2000); inp.el.focus(); });
      c.add(new Button(this, w - 150, 116, t('Save'), ok, { variant: 'green', w: 130, id: 'pet.name.ok' }));
      c.add(new Button(this, 20, 116, t('Cancel'), () => { inp.dom.destroy(); close(); }, { variant: 'ghost', id: 'pet.name.cancel' }));
      return 180;
    });
  }
}
void N; void pill;
