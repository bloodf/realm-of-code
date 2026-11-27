// Virtual pets: 20 species in 4 rarities (3 ultra rare), each normal or shiny. Pets hatch
// from eggs (eggs hatch as you earn XP), follow you in the village, get hungry and bored
// over time, and give a small XP bonus when they are happy.
import { useGame, setXpListener, setXpBonus } from './store';
import type { Pet, Egg, Rarity } from './types07';
import { now, HOUR } from './clock';
import { t } from '../i18n';

export { SPECIES, SPECIES_BY_ID, RARITY, RARITIES, EGG_ODDS, SHINY_CHANCE } from './petData';
import { SPECIES, SPECIES_BY_ID, RARITY, EGG_ODDS, SHINY_CHANCE } from './petData';
export type { Species } from './petData';

export const petSprite = (p: { species: string; shiny: boolean }) => `pet-${p.species}${p.shiny ? '*shiny' : ''}`;
export const speciesName = (id: string) => t(SPECIES_BY_ID[id]?.name ?? id);
export const rarityName = (r: Rarity) => t(RARITY[r].name);

let seq = 0;
const uid = (p: string) => `${p}${now().toString(36)}${(seq++).toString(36)}`;
const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** Hunger and boredom over time (a full pet is hungry again after ~1 day). */
export function updatePet(p: Pet, at = now()): Pet {
  const h = Math.max(0, (at - p.tick) / HOUR);
  if (h < 0.01) return p;
  const full = clamp(p.full - h * 4.5);
  const joy = clamp(p.joy - h * (full < 25 ? 4 : 2));
  return { ...p, full, joy, tick: at };
}
export function mood(p: Pet): 'happy' | 'ok' | 'hungry' | 'sad' {
  if (p.full < 20) return 'hungry';
  if (p.joy < 25) return 'sad';
  return p.full > 60 && p.joy > 60 ? 'happy' : 'ok';
}
export function moodText(p: Pet) {
  const m = mood(p);
  return m === 'happy' ? t('Happy') : m === 'ok' ? t('Content') : m === 'hungry' ? t('Hungry') : t('Lonely');
}

/** Brings every pet's hunger/joy up to date (call when opening pet screens). */
export function tickPets() {
  const at = now();
  useGame.setState((s) => ({ pets: { ...s.pets, list: s.pets.list.map((p) => updatePet(p, at)) } }));
}

export function activePet(): Pet | null {
  const s = useGame.getState().pets;
  const p = s.list.find((x) => x.uid === s.active);
  return p ? updatePet(p) : null;
}

/** XP multiplier from the pet that follows you (only when it is not hungry or sad). */
export function petXpBonus(): number {
  const p = activePet();
  if (!p) return 0;
  const m = mood(p);
  if (m === 'hungry' || m === 'sad') return 0;
  return RARITY[SPECIES_BY_ID[p.species]?.rarity ?? 'common'].bonus * (p.shiny ? 1.5 : 1);
}

export function giveEgg(kind: Rarity, reason?: string) {
  const egg: Egg = { uid: uid('e'), kind, progress: 0, need: RARITY[kind].need, at: now() };
  useGame.setState((s) => ({ pets: { ...s.pets, eggs: [...s.pets.eggs, egg].slice(-12) } }));
  useGame.getState().mail({ kind: 'pet', title: t('You got an egg!'), text: (reason ? reason + ' ' : '') + t('Earn {n} XP to hatch it at the Pet Sanctuary.', { n: egg.need }), sprite: 'egg-' + kind, to: 'pets' });
  return egg;
}

export function buyEgg(kind: Rarity) {
  const price = RARITY[kind].eggPrice;
  const s = useGame.getState();
  if (!price || s.gold < price || s.pets.eggs.length >= 12) return false;
  useGame.setState({ gold: s.gold - price });
  giveEgg(kind);
  return true;
}

function roll<T extends string>(odds: Partial<Record<T, number>>, r = Math.random()): T {
  let acc = 0;
  const entries = Object.entries(odds) as [T, number][];
  for (const [k, v] of entries) { acc += v; if (r < acc) return k; }
  return entries[entries.length - 1][0];
}

/** Hatch an egg that is ready. Options (for debug mode) force the species and shininess. */
export function hatch(eggUid: string, force?: { species?: string; shiny?: boolean }): Pet | null {
  const s = useGame.getState();
  const egg = s.pets.eggs.find((e) => e.uid === eggUid);
  if (!egg || (!force && egg.progress < egg.need)) return null;
  const rarity = force?.species ? SPECIES_BY_ID[force.species].rarity : roll(EGG_ODDS[egg.kind]);
  const pool = SPECIES.filter((x) => x.rarity === rarity);
  const sp = force?.species ? SPECIES_BY_ID[force.species] : pool[Math.floor(Math.random() * pool.length)];
  const shiny = force?.shiny ?? Math.random() < SHINY_CHANCE;
  const pet: Pet = { uid: uid('p'), species: sp.id, shiny, name: t(sp.name), level: 1, xp: 0, full: 80, joy: 80, tick: now(), born: now() };
  useGame.setState((st) => {
    const d = st.pets.dex[sp.id] ?? { n: 0, shiny: 0 };
    return {
      pets: { ...st.pets, eggs: st.pets.eggs.filter((e) => e.uid !== eggUid), list: [...st.pets.list, pet], active: st.pets.active ?? pet.uid, dex: { ...st.pets.dex, [sp.id]: { n: d.n + 1, shiny: d.shiny + (shiny ? 1 : 0) } } },
      stats: { ...st.stats, eggsHatched: st.stats.eggsHatched + 1 },
    };
  });
  useGame.getState().checkAchievements();
  return pet;
}

/** Adds a pet directly (debug mode). */
export function spawnPet(species: string, shiny: boolean) {
  const egg = giveEgg('common');
  return hatch(egg.uid, { species, shiny });
}

function petXp(uidP: string, n: number) {
  useGame.setState((s) => ({
    pets: { ...s.pets, list: s.pets.list.map((p) => {
      if (p.uid !== uidP) return p;
      let xp = p.xp + n, level = p.level;
      while (level < 10 && xp >= level * 20) { xp -= level * 20; level++; }
      return { ...p, xp, level };
    }) },
  }));
}

/** Feed a pet with something from the homestead (crops, eggs, milk, truffles) or a pet treat. */
export function feedPet(uidP: string, food: string): 'ok' | 'full' | 'none' {
  const s = useGame.getState();
  const p0 = s.pets.list.find((x) => x.uid === uidP);
  if (!p0) return 'none';
  const p = updatePet(p0);
  if ((s.home.inv[food] ?? 0) <= 0) return 'none';
  if (p.full >= 95) return 'full';
  const liked = SPECIES_BY_ID[p.species]?.likes.includes(food);
  useGame.setState((st) => ({
    home: { ...st.home, inv: { ...st.home.inv, [food]: (st.home.inv[food] ?? 0) - 1 } },
    pets: { ...st.pets, list: st.pets.list.map((x) => (x.uid === uidP ? { ...p, full: clamp(p.full + 45), joy: clamp(p.joy + (liked ? 20 : 8)) } : x)) },
    stats: { ...st.stats, petsFed: st.stats.petsFed + 1 },
  }));
  petXp(uidP, liked ? 8 : 4);
  useGame.getState().bumpQuest('petcare');
  useGame.getState().checkAchievements();
  return 'ok';
}

export function playWithPet(uidP: string): boolean {
  const s = useGame.getState();
  const p0 = s.pets.list.find((x) => x.uid === uidP);
  if (!p0) return false;
  const p = updatePet(p0);
  useGame.setState((st) => ({
    pets: { ...st.pets, list: st.pets.list.map((x) => (x.uid === uidP ? { ...p, joy: clamp(p.joy + 15), full: clamp(p.full - 3) } : x)) },
    stats: { ...st.stats, petPlays: st.stats.petPlays + 1 },
  }));
  petXp(uidP, 3);
  useGame.getState().bumpQuest('petcare');
  useGame.getState().checkAchievements();
  return true;
}

export function setActivePet(uidP: string | null) { useGame.setState((s) => ({ pets: { ...s.pets, active: uidP } })); }
export function renamePet(uidP: string, name: string) { useGame.setState((s) => ({ pets: { ...s.pets, list: s.pets.list.map((p) => (p.uid === uidP ? { ...p, name: name.slice(0, 16) || p.name } : p)) } })); }
export function releasePet(uidP: string) { useGame.setState((s) => ({ pets: { ...s.pets, list: s.pets.list.filter((p) => p.uid !== uidP), active: s.pets.active === uidP ? null : s.pets.active } })); }

/** XP earned anywhere warms the eggs; the pet that follows you learns a little too. */
setXpListener((n) => {
  const s = useGame.getState();
  if (!s.pets.eggs.length && !s.pets.active) return;
  const ready: Egg[] = [];
  useGame.setState((st) => ({
    pets: { ...st.pets, eggs: st.pets.eggs.map((e) => {
      if (e.progress >= e.need) return e;
      const progress = Math.min(e.need, e.progress + n);
      if (progress >= e.need) ready.push(e);
      return { ...e, progress };
    }) },
  }));
  if (s.pets.active) petXp(s.pets.active, Math.max(1, Math.round(n / 10)));
  for (const e of ready) useGame.getState().mail({ kind: 'pet', title: t('An egg is hatching!'), text: t('Visit the Pet Sanctuary to meet your new friend.'), sprite: 'egg-' + e.kind, to: 'pets' });
});

setXpBonus(petXpBonus);

/** The first egg, given on the first visit to the village. */
export function ensureStarterEgg() {
  const s = useGame.getState();
  if (s.pets.starter || !s.profile) return;
  useGame.setState((st) => ({ pets: { ...st.pets, starter: true } }));
  giveEgg('common', t('A gift from Lumi!'));
}
