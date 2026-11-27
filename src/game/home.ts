// The homestead: a vegetable garden that grows in real time, and farm animals to feed,
// pet and collect from. Everything is computed from timestamps, so the garden keeps
// growing while the game is closed (and weeds grow if you stay away too long).
import { useGame } from './store';
import type { Plot, Animal } from './types07';
import { now, MIN, HOUR } from './clock';
import { t } from '../i18n';

export interface CropDef { id: string; name: string; sprite: string; grow: number; seed: number; sell: number; xp: number }
/** grow = minutes of watered growth. */
export const CROPS: CropDef[] = [
  { id: 'wheat', name: 'Wheat', sprite: 'wheat3', grow: 3, seed: 4, sell: 8, xp: 2 },
  { id: 'carrot', name: 'Carrot', sprite: 'carrot3', grow: 6, seed: 6, sell: 12, xp: 3 },
  { id: 'potato', name: 'Potato', sprite: 'crop-potato', grow: 10, seed: 8, sell: 16, xp: 4 },
  { id: 'cabbage', name: 'Cabbage', sprite: 'crop-cabbage', grow: 15, seed: 10, sell: 22, xp: 5 },
  { id: 'tomato', name: 'Tomato', sprite: 'crop-tomato', grow: 20, seed: 12, sell: 28, xp: 6 },
  { id: 'strawberry', name: 'Strawberry', sprite: 'crop-strawberry', grow: 30, seed: 15, sell: 38, xp: 8 },
  { id: 'corn', name: 'Corn', sprite: 'crop-corn', grow: 45, seed: 18, sell: 50, xp: 10 },
  { id: 'pumpkin', name: 'Pumpkin', sprite: 'pumpkin3', grow: 60, seed: 22, sell: 70, xp: 14 },
];
export const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export interface AnimalDef { id: string; name: string; sprite: string; price: number; product: string | null; every: number; eats: string[]; desc: string }
/** every = minutes to make one product (while fed). */
export const ANIMALS: AnimalDef[] = [
  { id: 'chicken', name: 'Chicken', sprite: 'animal-chicken', price: 60, product: 'egg', every: 20, eats: ['wheat', 'corn', 'hay'], desc: 'Lays an egg every 20 minutes when fed.' },
  { id: 'cow', name: 'Cow', sprite: 'animal-cow', price: 220, product: 'milk', every: 45, eats: ['hay', 'wheat', 'cabbage'], desc: 'Gives milk every 45 minutes when fed.' },
  { id: 'sheep', name: 'Sheep', sprite: 'animal-sheep', price: 160, product: 'wool', every: 60, eats: ['hay', 'cabbage'], desc: 'Grows wool. Shear it every hour.' },
  { id: 'pig', name: 'Pig', sprite: 'animal-pig', price: 180, product: 'truffle', every: 90, eats: ['potato', 'corn', 'tomato'], desc: 'Sniffs out a truffle every 90 minutes.' },
  { id: 'goat', name: 'Goat', sprite: 'animal-goat', price: 140, product: 'milk', every: 60, eats: ['hay', 'cabbage', 'carrot'], desc: 'Eats almost anything. Gives milk.' },
  { id: 'horse', name: 'Horse', sprite: 'animal-horse', price: 300, product: null, every: 0, eats: ['carrot', 'hay'], desc: 'A happy horse lets you walk faster in the village.' },
  { id: 'dog', name: 'Dog', sprite: 'animal-dog', price: 120, product: 'feather', every: 120, eats: ['egg', 'milk', 'potato'], desc: 'Guards the garden: weeds grow slower. Brings back feathers.' },
  { id: 'cat', name: 'Cat', sprite: 'animal-cat', price: 100, product: null, every: 0, eats: ['milk', 'egg'], desc: 'Keeps mice away: ripe crops wait longer before they wither.' },
];
export const ANIMAL_BY_ID = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));
export const MAX_ANIMALS = 8;

/** Goods you can sell at the market stall (price each) and buy (seeds, hay). */
export const SELL: Record<string, number> = { ...Object.fromEntries(CROPS.map((c) => [c.id, c.sell])), egg: 10, milk: 18, wool: 25, truffle: 45, feather: 12 };
export const HAY_PRICE = 3;
export const PLOT_PRICE = [0, 0, 0, 0, 0, 0, 150, 200, 300, 400, 550, 700];

export const itemName = (id: string) => t(CROP_BY_ID[id]?.name ?? { egg: 'Egg', milk: 'Milk', wool: 'Wool', truffle: 'Truffle', feather: 'Feather', hay: 'Hay' }[id] ?? (id.startsWith('seed-') ? CROP_BY_ID[id.slice(5)]?.name + ' seeds' : id));
export const itemSprite = (id: string) => (id.startsWith('seed-') ? 'seedBag' : CROP_BY_ID[id]?.sprite ?? ({ egg: 'item-egg', milk: 'item-milk', wool: 'item-wool', truffle: 'item-truffle', feather: 'item-feather', hay: 'item-hay' } as Record<string, string>)[id] ?? 'chest');

const WEEDS_AFTER = 10 * HOUR;     // an empty plot gets weeds
const WITHER_AFTER = 30 * HOUR;    // a ripe crop withers if it is not picked
const hasAnimal = (kind: string) => useGame.getState().home.animals.some((a) => a.kind === kind && a.full > 10);

export function updatePlot(p: Plot, at = now()): Plot {
  if (!p.tick) return { ...p, tick: at };
  const from = p.tick;
  if (at <= from) return p;
  const out = { ...p, tick: at };
  if (!p.crop) {
    if (!p.weeds && at - from > WEEDS_AFTER * (hasAnimal('dog') ? 2 : 1)) out.weeds = true;
    return out;
  }
  if (p.withered) return out;
  const def = CROP_BY_ID[p.crop];
  const need = def.grow * MIN;
  if (p.growth < need) {
    // watered time grows at full speed, dry time at a third
    const wet = Math.max(0, Math.min(at, p.water) - from);
    const dry = at - from - wet;
    out.growth = Math.min(need, p.growth + wet + dry / 3);
    if (out.growth >= need) {
      // when it became ripe: the watered time comes first, then dry time counts a third
      const left = need - p.growth;
      out.ripeAt = Math.min(at, from + (left <= wet ? left : wet + (left - wet) * 3));
    }
  }
  if (out.ripeAt && at - out.ripeAt > WITHER_AFTER * (hasAnimal('cat') ? 2 : 1)) out.withered = true;
  return out;
}
export function plotStage(p: Plot): 'empty' | 'weeds' | 'seed' | 'sprout' | 'growing' | 'ripe' | 'withered' {
  if (!p.crop) return p.weeds ? 'weeds' : 'empty';
  if (p.withered) return 'withered';
  const r = p.growth / (CROP_BY_ID[p.crop].grow * MIN);
  return r >= 1 ? 'ripe' : r > 0.6 ? 'growing' : r > 0.2 ? 'sprout' : 'seed';
}
export const plotProgress = (p: Plot) => (p.crop ? Math.min(1, p.growth / (CROP_BY_ID[p.crop].grow * MIN)) : 0);

export function updateAnimal(a: Animal, at = now()): Animal {
  if (!a.tick) return { ...a, tick: at };
  const h = Math.max(0, (at - a.tick) / HOUR);
  if (h < 0.005) return a;
  const def = ANIMAL_BY_ID[a.kind];
  // production only while the animal is fed (fullness above 20)
  const fedHours = a.full > 20 ? Math.min(h, (a.full - 20) / 6) : 0;
  let made = a.made + fedHours * HOUR, ready = a.ready;
  if (def?.product && def.every) { const per = def.every * MIN; while (made >= per && ready < 5) { made -= per; ready++; } if (ready >= 5) made = 0; }
  return { ...a, tick: at, full: Math.max(0, a.full - h * 6), joy: Math.max(0, a.joy - h * 2.5), made, ready };
}

/** Brings the garden and the animals up to date. */
export function tickHome() {
  const at = now();
  useGame.setState((s) => ({ home: { ...s.home, plots: s.home.plots.map((p) => updatePlot(p, at)), animals: s.home.animals.map((a) => updateAnimal(a, at)) } }));
}

const setPlot = (i: number, fn: (p: Plot) => Plot) => useGame.setState((s) => ({ home: { ...s.home, plots: s.home.plots.map((p, k) => (k === i ? fn(updatePlot(p)) : p)) } }));
const inv = () => useGame.getState().home.inv;
const addInv = (id: string, n: number) => useGame.setState((s) => ({ home: { ...s.home, inv: { ...s.home.inv, [id]: Math.max(0, (s.home.inv[id] ?? 0) + n) } } }));

export function plant(i: number, crop: string): boolean {
  const p = updatePlot(useGame.getState().home.plots[i]);
  if (p.crop || p.weeds || (inv()['seed-' + crop] ?? 0) <= 0) return false;
  addInv('seed-' + crop, -1);
  setPlot(i, (q) => ({ ...q, crop, growth: 0, ripeAt: 0, withered: false, tick: now() }));
  return true;
}
export function water(i: number): boolean {
  const p = updatePlot(useGame.getState().home.plots[i]);
  if (!p.crop || p.withered || plotStage(p) === 'ripe') return false;
  const need = CROP_BY_ID[p.crop].grow * MIN;
  setPlot(i, (q) => ({ ...q, water: now() + Math.max(need, 30 * MIN) }));
  return true;
}
export function harvest(i: number): string | null {
  const p = updatePlot(useGame.getState().home.plots[i]);
  if (plotStage(p) !== 'ripe' || !p.crop) return null;
  const def = CROP_BY_ID[p.crop];
  const extra = Math.random() < 0.25 ? 1 : 0;
  addInv(def.id, 1 + extra);
  setPlot(i, (q) => ({ ...q, crop: null, growth: 0, ripeAt: 0, water: 0, tick: now() }));
  useGame.setState((s) => ({ stats: { ...s.stats, harvests: s.stats.harvests + 1 } }));
  useGame.getState().gainXp(def.xp);
  useGame.getState().bumpQuest('harvest');
  useGame.getState().checkAchievements();
  return def.id;
}
export function clearPlot(i: number): boolean {
  const p = updatePlot(useGame.getState().home.plots[i]);
  if (!p.weeds && !p.withered) return false;
  setPlot(i, (q) => ({ ...q, crop: null, weeds: false, withered: false, growth: 0, ripeAt: 0, tick: now() }));
  useGame.getState().gainXp(1);
  return true;
}

export function buySeed(crop: string, n = 1): boolean {
  const cost = CROP_BY_ID[crop].seed * n;
  if (useGame.getState().gold < cost) return false;
  useGame.setState((s) => ({ gold: s.gold - cost }));
  addInv('seed-' + crop, n);
  return true;
}
export function buyHay(n = 5): boolean {
  if (useGame.getState().gold < HAY_PRICE * n) return false;
  useGame.setState((s) => ({ gold: s.gold - HAY_PRICE * n }));
  addInv('hay', n);
  return true;
}
export function sell(id: string, n = 1): number {
  const have = inv()[id] ?? 0;
  const k = Math.min(have, n);
  if (!k || !SELL[id]) return 0;
  addInv(id, -k);
  useGame.setState((s) => ({ gold: s.gold + SELL[id] * k }));
  useGame.getState().checkAchievements();
  return SELL[id] * k;
}
export function buyPlot(): boolean {
  const s = useGame.getState();
  const price = PLOT_PRICE[s.home.size];
  if (s.home.size >= 12 || s.gold < price) return false;
  useGame.setState((st) => ({ gold: st.gold - price, home: { ...st.home, size: st.home.size + 1 } }));
  return true;
}

let seq = 0;
export function buyAnimal(kind: string, free = false): Animal | null {
  const s = useGame.getState();
  const def = ANIMAL_BY_ID[kind];
  if (!def || s.home.animals.length >= MAX_ANIMALS || (!free && s.gold < def.price)) return null;
  const a: Animal = { uid: 'a' + now().toString(36) + (seq++), kind, name: t(def.name), full: 70, joy: 60, tick: now(), made: 0, ready: 0, petted: 0 };
  useGame.setState((st) => ({ gold: st.gold - (free ? 0 : def.price), home: { ...st.home, animals: [...st.home.animals, a] } }));
  useGame.getState().checkAchievements();
  return a;
}
const setAnimal = (uid: string, fn: (a: Animal) => Animal) => useGame.setState((s) => ({ home: { ...s.home, animals: s.home.animals.map((a) => (a.uid === uid ? fn(updateAnimal(a)) : a)) } }));

/** Feeds an animal with the first food it likes that you have. Returns the food used. */
export function feedAnimal(uid: string): string | null {
  const a = useGame.getState().home.animals.find((x) => x.uid === uid);
  if (!a) return null;
  const food = ANIMAL_BY_ID[a.kind].eats.find((f) => (inv()[f] ?? 0) > 0);
  if (!food || updateAnimal(a).full >= 95) return null;
  addInv(food, -1);
  setAnimal(uid, (x) => ({ ...x, full: Math.min(100, x.full + 50), joy: Math.min(100, x.joy + 5) }));
  return food;
}
export function petAnimal(uid: string): boolean {
  const a = useGame.getState().home.animals.find((x) => x.uid === uid);
  if (!a || now() - a.petted < 5 * MIN) return false;
  setAnimal(uid, (x) => ({ ...x, joy: Math.min(100, x.joy + 25), petted: now() }));
  useGame.getState().gainXp(1);
  return true;
}
export function collect(uid: string): { item: string; n: number } | null {
  const a0 = useGame.getState().home.animals.find((x) => x.uid === uid);
  if (!a0) return null;
  const a = updateAnimal(a0);
  const def = ANIMAL_BY_ID[a.kind];
  if (!def.product || a.ready <= 0) return null;
  const n = a.ready + (a.joy > 70 && Math.random() < 0.3 ? 1 : 0);
  addInv(def.product, n);
  setAnimal(uid, (x) => ({ ...x, ready: 0 }));
  useGame.setState((s) => ({ stats: { ...s.stats, products: s.stats.products + n } }));
  useGame.getState().gainXp(2 * n);
  useGame.getState().checkAchievements();
  return { item: def.product, n };
}
export function horseBonus(): boolean { const h = useGame.getState().home.animals.find((a) => a.kind === 'horse'); return !!h && updateAnimal(h).joy > 40; }

/** Debug: everything ripe, every animal ready. */
export function growAll() {
  const at = now();
  useGame.setState((s) => ({
    home: {
      ...s.home,
      plots: s.home.plots.map((p) => (p.crop && !p.withered ? { ...p, growth: CROP_BY_ID[p.crop].grow * MIN, ripeAt: at, tick: at } : p)),
      animals: s.home.animals.map((a) => (ANIMAL_BY_ID[a.kind].product ? { ...a, ready: Math.max(a.ready, 2), full: 90, tick: at } : a)),
    },
  }));
}
