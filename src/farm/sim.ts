// Code Farm: a pure simulation of the farm grid. The player's program (blocks or typed
// JavaScript) calls the farm commands below; every command is recorded as an event that
// the Phaser scene replays as animation. No DOM here: it runs in the code worker and in Node.

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Crop = 'wheat' | 'carrot' | 'pumpkin';
export type Ground = 'soil' | 'grass' | 'path' | 'fence' | 'rock' | 'pond';
export const CROPS: Crop[] = ['wheat', 'carrot', 'pumpkin'];

export interface Cell { g: Ground; crop: Crop | null; stage: number; wet: boolean; weed: boolean }

export interface FarmDef {
  rows: string[];          // see LEGEND
  start: [number, number];
  can?: number;            // watering can capacity (default 99)
  off?: string[];          // commands that are not available in this level
}

/**
 * Map legend (one character per tile):
 *  .  soil (tilled, empty)      ;  wet soil          ,  grass (till it first)
 *  =  path                      #  fence             o  rock        ~  pond
 *  x  soil with weeds
 *  0-3  wheat seed..ripe (dry)  4-7  wheat seed..ripe (wet)
 *  k  carrot seed   c  ripe carrot   q  pumpkin seed   p  ripe pumpkin
 */
export function parseFarm(rows: string[]): Cell[][] {
  return rows.map((row) => [...row].map((ch): Cell => {
    const c: Cell = { g: 'soil', crop: null, stage: 0, wet: false, weed: false };
    if (ch === ';') c.wet = true;
    else if (ch === ',') c.g = 'grass';
    else if (ch === '=') c.g = 'path';
    else if (ch === '#') c.g = 'fence';
    else if (ch === 'o') c.g = 'rock';
    else if (ch === '~') c.g = 'pond';
    else if (ch === 'x') c.weed = true;
    else if (ch >= '0' && ch <= '7') { const n = Number(ch); c.crop = 'wheat'; c.stage = n % 4; c.wet = n >= 4; }
    else if (ch === 'k') c.crop = 'carrot';
    else if (ch === 'c') { c.crop = 'carrot'; c.stage = 3; }
    else if (ch === 'q') c.crop = 'pumpkin';
    else if (ch === 'p') { c.crop = 'pumpkin'; c.stage = 3; }
    return c;
  }));
}

export const WALKABLE = new Set<Ground>(['soil', 'grass', 'path']);
export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

type Tag = { line: number; block?: string };
export type FarmEventBody =
  | { t: 'move'; x: number; y: number; dir: Dir }
  | { t: 'bump'; x: number; y: number; dir: Dir }
  | { t: 'till'; x: number; y: number }
  | { t: 'plant'; x: number; y: number; crop: Crop }
  | { t: 'water'; x: number; y: number; left: number }
  | { t: 'harvest'; x: number; y: number; crop: Crop }
  | { t: 'rot'; x: number; y: number; crop: Crop }
  | { t: 'weed'; x: number; y: number }
  | { t: 'sleep'; day: number; grew: [number, number, number][] }
  | { t: 'refill'; left: number }
  | { t: 'say'; text: string }
  | { t: 'oops'; x: number; y: number; text: string };
export type FarmEvent = Tag & FarmEventBody;

export interface FarmResult {
  events: FarmEvent[];
  cells: Cell[][];
  x: number; y: number;
  basket: Record<Crop, number>;
  mistakes: number;
  rotted: number;
  days: number;
  said: string[];
  actions: number;
  water: number;
  exhausted: boolean;
}

export class Exhausted extends Error { constructor() { super('Your farmer is exhausted after 3000 actions. Is a loop running forever?'); this.name = 'Exhausted'; } }
export class NotAvailable extends Error { constructor(name: string) { super(`${name}() is not available in this level. Can you write it yourself?`); this.name = 'NotAvailable'; } }

const MAX_ACTIONS = 3000;

export const COMMANDS = ['move', 'till', 'plant', 'water', 'harvest', 'pullWeed', 'sleep', 'refill', 'nextRow', 'say',
  'isDry', 'isRipe', 'hasCrop', 'hasWeed', 'isGrass', 'isField', 'canMove', 'waterLeft', 'getX', 'getY', 'cropHere'] as const;

export function createFarm(def: FarmDef, lineOf: () => number = () => 0) {
  const cells = parseFarm(def.rows);
  const h = cells.length, w = Math.max(...def.rows.map((r) => r.length));
  const cap = def.can ?? 99;
  let [x, y] = def.start;
  let water = cap;
  let block: string | undefined;
  let actions = 0, mistakes = 0, rotted = 0, days = 0;
  let exhausted = false;
  const basket: Record<Crop, number> = { wheat: 0, carrot: 0, pumpkin: 0 };
  const said: string[] = [];
  const events: FarmEvent[] = [];
  const off = new Set(def.off ?? []);

  const tag = (): Tag => ({ line: lineOf(), block });
  const push = (e: FarmEventBody) => events.push({ ...tag(), ...e });
  const oops = (text: string) => { mistakes++; push({ t: 'oops', x, y, text }); };
  const act = (name: string) => {
    if (off.has(name)) throw new NotAvailable(name);
    if (++actions > MAX_ACTIONS) { exhausted = true; throw new Exhausted(); }
  };
  const at = (xx: number, yy: number) => (yy >= 0 && yy < h && xx >= 0 && xx < w ? cells[yy][xx] : null);
  const here = () => cells[y][x];
  const canGo = (dir: Dir) => { const [dx, dy] = DIRS[dir]; const c = at(x + dx, y + dy); return !!c && WALKABLE.has(c.g); };
  const dirOf = (d: unknown): Dir => {
    const s = String(d).toLowerCase();
    if (s === 'up' || s === 'down' || s === 'left' || s === 'right') return s;
    throw new TypeError(`move() needs "up", "down", "left" or "right", not ${JSON.stringify(d)}`);
  };
  const cropOf = (c: unknown): Crop => {
    if (c === undefined) return 'wheat';
    const s = String(c).toLowerCase();
    if ((CROPS as string[]).includes(s)) return s as Crop;
    throw new TypeError(`plant() knows "wheat", "carrot" and "pumpkin", not ${JSON.stringify(c)}`);
  };

  const api = {
    move(d: unknown) {
      act('move');
      const dir = dirOf(d);
      if (!canGo(dir)) { mistakes++; push({ t: 'bump', x, y, dir }); return false; }
      x += DIRS[dir][0]; y += DIRS[dir][1];
      push({ t: 'move', x, y, dir });
      return true;
    },
    till() {
      act('till');
      const c = here();
      if (c.g !== 'grass') return oops(c.g === 'soil' ? 'This soil is already tilled.' : 'You can only till grass.');
      c.g = 'soil';
      push({ t: 'till', x, y });
    },
    plant(kind?: unknown) {
      act('plant');
      const crop = cropOf(kind);
      const c = here();
      if (c.g === 'grass') return oops('Till the grass before planting.');
      if (c.g !== 'soil') return oops('Seeds only grow in farmland.');
      if (c.weed) return oops('Weeds are in the way! Pull them first.');
      if (c.crop) return oops('Something is already growing here.');
      c.crop = crop; c.stage = 0;
      push({ t: 'plant', x, y, crop });
    },
    water() {
      act('water');
      const c = here();
      if (water <= 0) return oops('Your watering can is empty. Refill it at the pond.');
      if (c.g !== 'soil') return oops('Only farmland needs water.');
      if (c.wet) return oops('Already wet! Do not waste water.');
      c.wet = true; water--;
      push({ t: 'water', x, y, left: water });
    },
    harvest() {
      act('harvest');
      const c = here();
      if (!c.crop) return oops('There is nothing to harvest here.');
      const crop = c.crop;
      if (c.stage < 3) { c.crop = null; c.stage = 0; rotted++; mistakes++; push({ t: 'rot', x, y, crop }); return; }
      c.crop = null; c.stage = 0; basket[crop]++;
      push({ t: 'harvest', x, y, crop });
    },
    pullWeed() {
      act('pullWeed');
      const c = here();
      if (!c.weed) return oops('No weeds here.');
      c.weed = false;
      push({ t: 'weed', x, y });
    },
    sleep() {
      act('sleep');
      days++;
      const grew: [number, number, number][] = [];
      cells.forEach((row, yy) => row.forEach((c, xx) => {
        if (c.crop && c.wet && c.stage < 3) { c.stage++; grew.push([xx, yy, c.stage]); }
        c.wet = false;
      }));
      push({ t: 'sleep', day: days, grew });
    },
    refill() {
      act('refill');
      const near = (Object.keys(DIRS) as Dir[]).some((d) => at(x + DIRS[d][0], y + DIRS[d][1])?.g === 'pond');
      if (!near) return oops('There is no pond next to you.');
      water = cap;
      push({ t: 'refill', left: water });
    },
    nextRow() {
      act('nextRow');
      if (!api.move('down')) return;
      while (x > 0 && canGo('left')) { actions++; x--; push({ t: 'move', x, y, dir: 'left' }); }
    },
    say(...v: unknown[]) {
      act('say');
      const text = v.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      said.push(text);
      push({ t: 'say', text });
    },
    isDry() { act('isDry'); const c = here(); return c.g === 'soil' && !c.wet; },
    isRipe() { act('isRipe'); const c = here(); return !!c.crop && c.stage === 3; },
    hasCrop() { act('hasCrop'); return !!here().crop; },
    hasWeed() { act('hasWeed'); return here().weed; },
    isGrass() { act('isGrass'); return here().g === 'grass'; },
    isField() { act('isField'); const g = here().g; return g === 'soil' || g === 'grass'; },
    canMove(d: unknown) { act('canMove'); return canGo(dirOf(d)); },
    waterLeft() { act('waterLeft'); return water; },
    getX() { act('getX'); return x; },
    getY() { act('getY'); return y; },
    cropHere() { act('cropHere'); return here().crop; },
    /** Blocks mode: remembers which block is running (for highlighting). */
    __hl(id: string) { block = id; },
  };

  return {
    api,
    events,
    result: (): FarmResult => ({ events, cells, x, y, basket: { ...basket }, mistakes, rotted, days, said, actions, water, exhausted }),
  };
}

/** Tiles that are farmland at the start (soil or grass): the "field". */
export function fieldOf(rows: string[]): [number, number][] {
  const out: [number, number][] = [];
  parseFarm(rows).forEach((row, y) => row.forEach((c, x) => { if (c.g === 'soil' || c.g === 'grass') out.push([x, y]); }));
  return out;
}

/** Runs a program in the current thread (tests and the level checker). */
export function runFarmSync(def: FarmDef, code: string): { result: FarmResult; error: string | null } {
  const farm = createFarm(def);
  const names = [...COMMANDS, '__hl'] as string[];
  let error: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(...names, code)(...names.map((n) => (farm.api as Record<string, unknown>)[n]));
  } catch (e) { error = (e as Error).message; }
  return { result: farm.result(), error };
}
