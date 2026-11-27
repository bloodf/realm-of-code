// Saved state of the v0.7 systems: pets, the homestead and PvE battles.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultra';

export interface Pet {
  uid: string;
  species: string;          // pet species id (see pets.ts)
  shiny: boolean;
  name: string;
  level: number;
  xp: number;
  full: number;             // 0..100 (100 = just ate)
  joy: number;              // 0..100
  tick: number;             // last time full/joy were updated
  born: number;
}
export interface Egg { uid: string; kind: Rarity; progress: number; need: number; at: number }
export interface PetState {
  list: Pet[];
  eggs: Egg[];
  active: string | null;    // uid of the pet that follows you
  dex: Record<string, { n: number; shiny: number }>;   // species -> how many hatched
  starter: boolean;         // the first egg was given
}

export interface Plot {
  crop: string | null;
  growth: number;           // ms of growth so far
  water: number;            // watered until (time)
  tick: number;             // last update
  weeds: boolean;
  withered: boolean;
  ripeAt: number;           // when it became ripe (0 = not ripe)
}
export interface Animal {
  uid: string;
  kind: string;
  name: string;
  full: number;             // 0..100
  joy: number;              // 0..100
  tick: number;
  made: number;             // ms of "production" so far (a product is ready at the animal's time)
  ready: number;            // products waiting to be collected
  petted: number;           // last time petted
}
export interface HomeState {
  plots: Plot[];
  animals: Animal[];
  inv: Record<string, number>;   // seeds, crops, products, feed
  size: number;                   // how many plots are open
  visited: boolean;
}

export interface BattleState {
  wins: number;
  losses: number;
  kills: Record<string, number>;     // monster id -> defeated
  cleared: Record<string, number>;   // region id -> times its boss was beaten
  invaders: { uid: string; mob: string; x: number; y: number }[];   // monsters in the village after a long absence
  best: Record<string, number>;      // region id -> fewest turns
}

const emptyPlot = (): Plot => ({ crop: null, growth: 0, water: 0, tick: 0, weeds: false, withered: false, ripeAt: 0 });
export const initialPets = (): PetState => ({ list: [], eggs: [], active: null, dex: {}, starter: false });
export const initialHome = (): HomeState => ({ plots: Array.from({ length: 12 }, emptyPlot), animals: [], inv: { 'seed-wheat': 4, 'seed-carrot': 2, hay: 3 }, size: 6, visited: false });
export const initialBattle = (): BattleState => ({ wins: 0, losses: 0, kills: {}, cleared: {}, invaders: [], best: {} });
export { emptyPlot };
