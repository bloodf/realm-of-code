// Pet species and rarities (data only, so achievements can use it without loading the store).
import type { Rarity } from './types07';

export interface Species { id: string; name: string; rarity: Rarity; desc: string; likes: string[] }
export const SPECIES: Species[] = [
  { id: 'bunny', name: 'Bunny', rarity: 'common', desc: 'Hops around your feet. Loves carrots more than anything.', likes: ['carrot', 'cabbage'] },
  { id: 'frog', name: 'Frog', rarity: 'common', desc: 'Sings by the pond at night. Catches bugs, even in code.', likes: ['strawberry', 'corn'] },
  { id: 'hedgehog', name: 'Hedgehog', rarity: 'common', desc: 'Small, spiky and very brave.', likes: ['potato', 'egg'] },
  { id: 'mouse', name: 'Mouse', rarity: 'common', desc: 'Reads your spellbooks at night. Tiny scholar.', likes: ['wheat', 'corn'] },
  { id: 'turtle', name: 'Turtle', rarity: 'common', desc: 'Slow and steady. Never gives up.', likes: ['cabbage', 'strawberry'] },
  { id: 'snail', name: 'Snail', rarity: 'common', desc: 'Carries its house everywhere. Leaves a shiny trail.', likes: ['cabbage', 'tomato'] },
  { id: 'squirrel', name: 'Squirrel', rarity: 'common', desc: 'Hides acorns in your pockets for later.', likes: ['corn', 'potato'] },
  { id: 'duckling', name: 'Duckling', rarity: 'common', desc: 'Follows you in a straight line. Quack!', likes: ['wheat', 'corn'] },
  { id: 'fox', name: 'Fox', rarity: 'uncommon', desc: 'Clever and curious. Finds shortcuts everywhere.', likes: ['egg', 'strawberry'] },
  { id: 'owl', name: 'Owl', rarity: 'uncommon', desc: 'Wise night bird. Hoots when you get an answer right.', likes: ['truffle', 'egg'] },
  { id: 'raccoon', name: 'Raccoon', rarity: 'uncommon', desc: 'A masked little thief with a good heart.', likes: ['tomato', 'corn'] },
  { id: 'penguin', name: 'Penguin', rarity: 'uncommon', desc: 'Waddles from the snowy north. Loves cold milk.', likes: ['milk', 'potato'] },
  { id: 'bat', name: 'Bat', rarity: 'uncommon', desc: 'Sleeps all day, debugs all night.', likes: ['strawberry', 'tomato'] },
  { id: 'redpanda', name: 'Red Panda', rarity: 'rare', desc: 'Fluffy tail, fluffy heart. Very rare in these lands.', likes: ['strawberry', 'milk'] },
  { id: 'otter', name: 'Otter', rarity: 'rare', desc: 'Holds your hand while you sleep so you do not drift away.', likes: ['egg', 'milk'] },
  { id: 'wolfpup', name: 'Wolf Pup', rarity: 'rare', desc: 'Loyal to the end. Howls at full moons and failing tests.', likes: ['truffle', 'milk'] },
  { id: 'griffin', name: 'Baby Griffin', rarity: 'rare', desc: 'Half eagle, half lion, all courage.', likes: ['egg', 'truffle'] },
  { id: 'phoenix', name: 'Phoenix Chick', rarity: 'ultra', desc: 'Reborn from its own ashes. Never lets a streak die.', likes: ['corn', 'truffle'] },
  { id: 'unicorn', name: 'Baby Unicorn', rarity: 'ultra', desc: 'Its horn glows near true friends. Ultra rare.', likes: ['strawberry', 'carrot'] },
  { id: 'kitsune', name: 'Kitsune', rarity: 'ultra', desc: 'A nine-tailed spirit fox. Each tail holds a secret.', likes: ['truffle', 'tomato'] },
];
export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export const RARITY: Record<Rarity, { name: string; color: string; bonus: number; eggPrice: number; need: number }> = {
  common: { name: 'Common', color: '#8bd14e', bonus: 0.05, eggPrice: 120, need: 40 },
  uncommon: { name: 'Uncommon', color: '#5b8ee1', bonus: 0.08, eggPrice: 300, need: 80 },
  rare: { name: 'Rare', color: '#a66be0', bonus: 0.12, eggPrice: 700, need: 150 },
  ultra: { name: 'Ultra rare', color: '#e8833a', bonus: 0.2, eggPrice: 0, need: 250 },
};
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'ultra'];
/** What hatches from each egg (chance per rarity). Ultra eggs come only from bosses and big achievements. */
export const EGG_ODDS: Record<Rarity, Partial<Record<Rarity, number>>> = {
  common: { common: 0.74, uncommon: 0.2, rare: 0.05, ultra: 0.01 },
  uncommon: { common: 0.3, uncommon: 0.48, rare: 0.18, ultra: 0.04 },
  rare: { uncommon: 0.35, rare: 0.53, ultra: 0.12 },
  ultra: { rare: 0.55, ultra: 0.45 },
};
export const SHINY_CHANCE = 1 / 20;

