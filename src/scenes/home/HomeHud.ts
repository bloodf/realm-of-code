// The homestead's interface: a top bar (gold, basket, shop, help, back to the village) and
// the panels for a garden plot, an animal, the market stall (buy seeds, hay, animals and
// land, sell what you grow) and your basket.
import Phaser from 'phaser';
import { UIScene } from '../base';
import { useGame } from '../../game/store';
import { CROPS, CROP_BY_ID, ANIMALS, ANIMAL_BY_ID, MAX_ANIMALS, SELL, HAY_PRICE, PLOT_PRICE, updatePlot, plotStage, plotProgress, updateAnimal, plant, water, harvest, clearPlot, buySeed, buyHay, sell, buyPlot, buyAnimal, feedAnimal, petAnimal, collect, itemName, itemSprite } from '../../game/home';
import { Button, Card, text, sprite, bar, modal, woodBg, iconTex } from '../../ui/widgets';
import { C } from '../../ui/theme';
import { play } from '../../audio/sound';
import { go } from '../../lib/route';
import { openHelp } from '../help/helpers';
import { t } from '../../i18n';
import { MIN, now } from '../../game/clock';

type ShopTab = 'seeds' | 'animals' | 'sell' | 'plots';

export class HomeHud extends UIScene {
  constructor() { super('HomeHud'); }

  build() {
    const s = useGame.getState();
    const { W, H } = this;
    const narrow = this.narrow;
    const bh = narrow ? 54 : 60;
    woodBg(this, 0, 0, W, bh);
    this.add.rectangle(0, bh, W, 4, 0x1c110a).setOrigin(0, 0);
    new Button(this, 8, (bh - 44) / 2, '', () => go('world'), { variant: 'wood', icon: 'x', w: 46, h: 44, id: 'home.close' });
    this.add.text(64, bh / 2, t('Your Homestead'), { fontFamily: "'Jacquard 12', serif", fontSize: narrow ? '26px' : '34px', color: '#ffd66b', stroke: '#1c110a', strokeThickness: 5 }).setOrigin(0, 0.5);
    let rx = W - 8;
    const hb = new Button(this, 0, (bh - 44) / 2, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 52, h: 44, id: 'home.help' }); rx -= hb.bw; hb.x = rx; rx -= 8;
    const shop = new Button(this, 0, (bh - 44) / 2, narrow ? '' : t('Market'), () => this.shop('seeds'), { variant: 'green', icon: 'coin', h: 44, size: 16, id: 'home.shop' }); rx -= shop.bw; shop.x = rx; rx -= 8;
    const basket = new Button(this, 0, (bh - 44) / 2, narrow ? '' : t('Basket'), () => this.basket(), { variant: 'paper', sprite: 'basket', h: 44, size: 16, id: 'home.basket' }); rx -= basket.bw; basket.x = rx; rx -= 12;
    const gold = text(this, rx, bh / 2 - 12, String(s.gold), 22, '#ffd66b', { fontStyle: 'bold' }).setOrigin(1, 0);
    sprite(this, rx - gold.width - 30, bh / 2 - 12, 'coin', 24);
    // hint line
    const hint = narrow ? t('Tap a plot or an animal') : t('WASD or arrows to walk · Space to plant, water, harvest, feed and collect · click a plot or an animal');
    const ht = text(this, W / 2, H - 30, hint, narrow ? 15 : 17, '#fff4dc', { fontStyle: 'bold', backgroundColor: '#2b1a12cc', padding: { x: 10, y: 4 } }).setOrigin(0.5, 0);
    void ht;

    const onPlot = (i: number) => this.plot(i);
    const onAnimal = (uid: string) => this.animal(uid);
    const onShop = (tab?: ShopTab) => this.shop(tab ?? 'seeds');
    this.game.events.on('home:plot', onPlot);
    this.game.events.on('home:animal', onAnimal);
    this.game.events.on('home:shop', onShop);
    const unsub = useGame.subscribe((a, b) => { if (a.gold !== b.gold) gold.setText(String(a.gold)); });
    this.events.once('shutdown', () => { this.game.events.off('home:plot', onPlot); this.game.events.off('home:animal', onAnimal); this.game.events.off('home:shop', onShop); unsub(); });
    this.game.registry.set('debug:HomeHud', () => ({ open: !!this.children.list.find((o) => o.getData?.('panel')) }));
  }

  private panel(w: number, fill: (c: Phaser.GameObjects.Container, w: number, close: () => void) => number) {
    const m = modal(this, w, fill);
    m.c.setData('panel', 1);
    return m;
  }

  // ---------------- a garden plot ----------------
  plot(i: number) {
    const s = useGame.getState();
    if (i >= s.home.size) { this.shop('plots'); return; }
    const p = updatePlot(s.home.plots[i]);
    const st = plotStage(p);
    const crop = p.crop ? CROP_BY_ID[p.crop] : null;
    this.panel(520, (c, w, close) => {
      const again = () => { close(); this.plot(i); };
      c.add(text(this, 20, 16, t('Garden plot {n}', { n: i + 1 }), 24, C.ink, { fontStyle: 'bold' }));
      let y = 56;
      if (st === 'weeds' || st === 'withered') {
        c.add(text(this, 20, y, st === 'weeds' ? t('Weeds grew here while the plot was empty.') : t('This crop withered: it was ripe for too long.'), 18, C.inkSoft, { wordWrap: { width: w - 40 } }));
        c.add(new Button(this, 20, y + 46, t('Clear the plot'), () => { clearPlot(i); play('click'); again(); }, { variant: 'green', id: 'plot.clear' }));
        return y + 120;
      }
      if (st === 'empty') {
        const seeds = CROPS.filter((cr) => (s.home.inv['seed-' + cr.id] ?? 0) > 0);
        c.add(text(this, 20, y, seeds.length ? t('Pick a seed to plant:') : t('You have no seeds. Buy some at the market.'), 18, C.inkSoft));
        y += 32;
        seeds.forEach((cr, k) => {
          const x = 20 + (k % 2) * ((w - 40) / 2), yy = y + Math.floor(k / 2) * 66;
          const card = new Card(this, x, yy, (w - 40) / 2 - 8, 58, () => { if (plant(i, cr.id)) play('click'); close(); }, { id: 'plant.' + cr.id, label: t(cr.name) });
          card.add(sprite(this, 8, 10, cr.sprite, 36));
          card.add(text(this, 52, 6, t(cr.name), 17, C.ink, { fontStyle: 'bold' }));
          card.add(text(this, 52, 30, `×${s.home.inv['seed-' + cr.id]} · ${t('{n} min', { n: cr.grow })}`, 14, C.inkSoft));
          c.add(card);
        });
        y += Math.ceil(seeds.length / 2) * 66 + 6;
        c.add(new Button(this, 20, y, t('Buy seeds'), () => { close(); this.shop('seeds'); }, { variant: 'gold', icon: 'coin', id: 'plot.buy' }));
        return y + 70;
      }
      c.add(sprite(this, 20, y, crop!.sprite, 64));
      c.add(text(this, 96, y, t(crop!.name), 22, C.ink, { fontStyle: 'bold' }));
      const k = plotProgress(p);
      const wet = p.water > now();
      if (st === 'ripe') c.add(text(this, 96, y + 30, t('Ripe! Harvest it.'), 18, C.greenDark, { fontStyle: 'bold' }));
      else {
        const left = Math.max(0, Math.ceil((crop!.grow * MIN - p.growth) / MIN / (wet ? 1 : 1 / 3)));
        c.add(bar(this, 96, y + 34, w - 130, 14, k, '#6cc04a'));
        c.add(text(this, 96, y + 52, (wet ? t('Watered') : t('Dry: it grows 3 times slower')) + ' · ' + t('about {n} min left', { n: left }), 15, wet ? C.blueDark : C.redDark));
      }
      y += 88;
      if (st === 'ripe') c.add(new Button(this, 20, y, t('Harvest'), () => { if (harvest(i)) play('coin'); close(); }, { variant: 'green', id: 'plot.harvest' }));
      else if (!wet) c.add(new Button(this, 20, y, t('Water'), () => { if (water(i)) play('splash'); again(); }, { variant: 'blue', sprite: 'wateringCan', id: 'plot.water' }));
      else c.add(text(this, 20, y + 10, t('Come back later: crops keep growing while you learn.'), 16, C.inkSoft));
      return y + 70;
    });
  }

  // ---------------- an animal ----------------
  animal(uid: string) {
    const a0 = useGame.getState().home.animals.find((x) => x.uid === uid);
    if (!a0) return;
    const a = updateAnimal(a0);
    const def = ANIMAL_BY_ID[a.kind];
    this.panel(500, (c, w, close) => {
      const again = () => { close(); this.animal(uid); };
      c.add(sprite(this, 20, 16, def.sprite, 80));
      c.add(text(this, 116, 16, a.name, 24, C.ink, { fontStyle: 'bold' }));
      c.add(text(this, 116, 46, t(def.desc), 15, C.inkSoft, { wordWrap: { width: w - 136 } }));
      let y = 110;
      c.add(text(this, 20, y, t('Food'), 15, C.inkSoft)); c.add(bar(this, 80, y + 2, w - 100, 14, a.full / 100, a.full < 25 ? '#d2473c' : '#e7a72c'));
      c.add(text(this, 20, y + 24, t('Joy'), 15, C.inkSoft)); c.add(bar(this, 80, y + 26, w - 100, 14, a.joy / 100, '#e06a9a'));
      y += 56;
      if (def.product) c.add(text(this, 20, y, a.ready ? t('{n} × {item} ready to collect!', { n: a.ready, item: itemName(def.product) }) : t('Makes {item} when fed.', { item: itemName(def.product) }), 16, a.ready ? C.greenDark : C.inkSoft, { fontStyle: 'bold' }));
      y += 30;
      const inv = useGame.getState().home.inv;
      const food = def.eats.find((f) => (inv[f] ?? 0) > 0);
      let bx = 20;
      const add = (b: Button) => { b.x = bx; c.add(b); bx += b.bw + 8; };
      if (def.product && a.ready) add(new Button(this, 0, y, t('Collect'), () => { if (collect(uid)) play('coin'); again(); }, { variant: 'green', id: 'animal.collect', size: 17 }));
      add(new Button(this, 0, y, food ? t('Feed ({food})', { food: itemName(food) }) : t('No food'), () => { if (feedAnimal(uid)) play('coin'); again(); }, { variant: 'gold', id: 'animal.feed', size: 17, disabled: !food || a.full >= 95 }));
      add(new Button(this, 0, y, t('Pet'), () => { if (petAnimal(uid)) play('say'); again(); }, { variant: 'paper', icon: 'heart', id: 'animal.pet', size: 17, disabled: now() - a.petted < 5 * MIN }));
      y += 60;
      c.add(text(this, 20, y, t('Eats: {list}', { list: def.eats.map(itemName).join(', ') }), 15, C.inkSoft, { wordWrap: { width: w - 40 } }));
      return y + 40;
    });
  }

  // ---------------- the market stall ----------------
  shop(tab: ShopTab) {
    const s = useGame.getState();
    this.panel(Math.min(760, this.W - 16), (c, w, close) => {
      const again = (tb: ShopTab = tab) => { close(); this.shop(tb); };
      c.add(sprite(this, 16, 10, 'npc-farm', 56));
      c.add(text(this, 84, 14, t('Bess\'s market stall'), 24, C.ink, { fontStyle: 'bold' }));
      c.add(text(this, 84, 44, t('You have {n} gold.', { n: s.gold }), 17, C.goldDark, { fontStyle: 'bold' }));
      c.add(new Button(this, w - 56, 10, '', close, { variant: 'red', icon: 'x', w: 44, h: 42, id: 'shop.close' }));
      const tabs: [ShopTab, string][] = [['seeds', t('Seeds & hay')], ['animals', t('Animals')], ['sell', t('Sell')], ['plots', t('Land')]];
      const tw = (w - 40) / 4;
      tabs.forEach(([id, label], i) => c.add(new Button(this, 20 + i * tw, 78, label, () => again(id), { variant: tab === id ? 'gold' : 'paper', w: tw - 6, h: 42, size: 15, id: 'shop.tab.' + id })));
      let y = 134;
      const cols = w > 600 ? 2 : 1, cw = (w - 40 - (cols - 1) * 10) / cols;
      const row = (k: number) => ({ x: 20 + (k % cols) * (cw + 10), y: y + Math.floor(k / cols) * 72 });
      if (tab === 'seeds') {
        [...CROPS.map((cr) => ({ id: 'seed-' + cr.id, name: t('{crop} seeds', { crop: t(cr.name) }), spr: cr.sprite, price: cr.seed, info: t('{n} min · sells for {p}', { n: cr.grow, p: cr.sell }), buy: () => buySeed(cr.id, 1) })), { id: 'hay', name: t('Hay ×5'), spr: 'item-hay', price: HAY_PRICE * 5, info: t('Food for animals'), buy: () => buyHay(5) }]
          .forEach((it, k) => {
            const r = row(k);
            const card = new Card(this, r.x, r.y, cw, 64, null, { id: 'shop.item.' + it.id });
            card.add(sprite(this, 10, 12, it.spr, 40));
            card.add(text(this, 58, 8, it.name, 17, C.ink, { fontStyle: 'bold' }));
            card.add(text(this, 58, 32, `${it.info} · ${t('you have {n}', { n: s.home.inv[it.id] ?? 0 })}`, 14, C.inkSoft));
            card.add(new Button(this, cw - 96, 10, String(it.price), () => { if (it.buy()) { play('coin'); again(); } else play('wrong'); }, { variant: 'gold', sprite: 'coin', w: 86, h: 44, size: 16, id: 'buy.' + it.id, disabled: s.gold < it.price }));
            c.add(card);
          });
        y += Math.ceil((CROPS.length + 1) / cols) * 72;
      } else if (tab === 'animals') {
        c.add(text(this, 20, y, t('Your pen has room for {n} animals ({have} now).', { n: MAX_ANIMALS, have: s.home.animals.length }), 16, C.inkSoft)); y += 30;
        ANIMALS.forEach((an, k) => {
          const r = row(k);
          const card = new Card(this, r.x, r.y, cw, 64, null, { id: 'shop.animal.' + an.id });
          card.add(sprite(this, 8, 8, an.sprite, 48));
          card.add(text(this, 62, 6, t(an.name), 17, C.ink, { fontStyle: 'bold' }));
          card.add(text(this, 62, 30, t(an.desc), 13, C.inkSoft, { wordWrap: { width: cw - 170 } }));
          card.add(new Button(this, cw - 96, 10, String(an.price), () => { if (buyAnimal(an.id)) { play('unlock'); again(); } else play('wrong'); }, { variant: 'gold', sprite: 'coin', w: 86, h: 44, size: 16, id: 'buyanimal.' + an.id, disabled: s.gold < an.price || s.home.animals.length >= MAX_ANIMALS }));
          c.add(card);
        });
        y += Math.ceil(ANIMALS.length / cols) * 72;
      } else if (tab === 'sell') {
        const goods = Object.keys(SELL).filter((id) => (s.home.inv[id] ?? 0) > 0);
        if (!goods.length) { c.add(text(this, 20, y, t('Nothing to sell yet. Harvest crops and collect eggs, milk and wool.'), 17, C.inkSoft, { wordWrap: { width: w - 40 } })); y += 40; }
        goods.forEach((id, k) => {
          const r = row(k);
          const n = s.home.inv[id];
          const card = new Card(this, r.x, r.y, cw, 64, null, { id: 'shop.sell.' + id });
          card.add(sprite(this, 10, 12, itemSprite(id), 40));
          card.add(text(this, 58, 8, `${itemName(id)} ×${n}`, 17, C.ink, { fontStyle: 'bold' }));
          card.add(text(this, 58, 32, t('{p} gold each', { p: SELL[id] }), 14, C.inkSoft));
          card.add(new Button(this, cw - 180, 10, t('Sell 1'), () => { sell(id, 1); if (id === 'truffle') useGame.getState().unlock('rich_farmer'); play('coin'); again(); }, { variant: 'paper', w: 80, h: 44, size: 15, id: 'sell1.' + id }));
          card.add(new Button(this, cw - 94, 10, t('All'), () => { sell(id, n); if (id === 'truffle') useGame.getState().unlock('rich_farmer'); play('coin'); again(); }, { variant: 'gold', w: 84, h: 44, size: 15, id: 'sellall.' + id }));
          c.add(card);
        });
        y += Math.ceil(goods.length / cols) * 72 + 4;
        c.add(text(this, 20, y, t('Tip: keep some food for your pets and animals!'), 15, C.inkSoft)); y += 28;
      } else {
        const price = PLOT_PRICE[s.home.size];
        c.add(text(this, 20, y, t('You have {n} of 12 garden plots.', { n: s.home.size }), 18, C.ink, { fontStyle: 'bold' })); y += 34;
        if (s.home.size < 12) c.add(new Button(this, 20, y, t('Buy a new plot · {p} gold', { p: price }), () => { if (buyPlot()) { play('unlock'); again(); } else play('wrong'); }, { variant: 'gold', sprite: 'coin', id: 'buy.plot', disabled: s.gold < price }));
        else c.add(text(this, 20, y, t('Your garden is as big as it gets!'), 17, C.greenDark));
        y += 64;
      }
      return y + 12;
    });
  }

  // ---------------- the basket ----------------
  basket() {
    const inv = useGame.getState().home.inv;
    const ids = Object.keys(inv).filter((k) => inv[k] > 0).sort();
    this.panel(560, (c, w, close) => {
      c.add(text(this, 20, 16, t('Your basket'), 24, C.ink, { fontStyle: 'bold' }));
      c.add(new Button(this, w - 56, 10, '', close, { variant: 'red', icon: 'x', w: 44, h: 42, id: 'basket.close' }));
      let y = 64;
      if (!ids.length) { c.add(text(this, 20, y, t('Empty. Buy seeds at the market to start your garden.'), 17, C.inkSoft)); return y + 50; }
      ids.forEach((id, k) => {
        const x = 20 + (k % 4) * ((w - 40) / 4), yy = y + Math.floor(k / 4) * 84;
        c.add(sprite(this, x + 20, yy, itemSprite(id), 40));
        c.add(text(this, x + 40, yy + 44, `${itemName(id)} ×${inv[id]}`, 14, C.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: (w - 40) / 4 - 6 } }).setOrigin(0.5, 0));
      });
      return y + Math.ceil(ids.length / 4) * 84 + 10;
    });
  }
}
void iconTex;
