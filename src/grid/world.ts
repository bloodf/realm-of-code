// Pure simulation of the hero grid. Runs inside the code worker; the renderer
// replays the recorded events. No DOM access here.

export type Dir = 'up' | 'down' | 'left' | 'right';
export type Thing = 'empty' | 'wall' | 'tree' | 'water' | 'goblin' | 'gem' | 'exit' | 'door' | 'key';

export type GridEvent =
  | { t: 'move'; x: number; y: number; dir: Dir; line: number }
  | { t: 'bump'; x: number; y: number; dir: Dir; into: Thing; line: number }
  | { t: 'collect'; x: number; y: number; item: 'gem' | 'key'; line: number }
  | { t: 'attack'; x: number; y: number; dir: Dir; hit: boolean; line: number }
  | { t: 'door'; x: number; y: number; line: number }
  | { t: 'say'; text: string; line: number }
  | { t: 'log'; text: string; line: number }
  | { t: 'splash'; x: number; y: number; line: number }
  | { t: 'exit'; line: number }
  | { t: 'tired'; line: number };

export interface SimResult {
  events: GridEvent[];
  escaped: boolean;
  drowned: boolean;
  tired: boolean;
  gems: number;
  gemsTotal: number;
  goblins: number;
  goblinsTotal: number;
  steps: number;
  x: number;
  y: number;
  // Ended exactly one step away from the exit (for the "Off by One" achievement)
  offByOne: boolean;
}

export interface ParsedMap {
  w: number;
  h: number;
  tiles: string[][];   // base terrain: '.', ',', '#', 'T', '~', '=', 'E', 'D'
  items: string[][];   // '*' gem, 'k' key, 'g' goblin, '' none
  start: { x: number; y: number };
}

const TERRAIN = new Set(['.', ',', '#', 'T', '~', '=', 'E', 'D', 'f']);

export function parseMap(rows: string[]): ParsedMap {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles: string[][] = [];
  const items: string[][] = [];
  let start = { x: 0, y: 0 };
  for (let y = 0; y < h; y++) {
    tiles.push([]);
    items.push([]);
    for (let x = 0; x < w; x++) {
      const c = rows[y][x] ?? '#';
      let tile = '.';
      let item = '';
      if (c === 'H') start = { x, y };
      else if (c === '*' || c === 'k' || c === 'g') item = c;
      else if (TERRAIN.has(c)) tile = c;
      tiles[y].push(tile);
      items[y].push(item);
    }
  }
  return { w, h, tiles, items, start };
}

export const DIRS: Record<Dir, [number, number]> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};

export class Victory extends Error {}
export class Defeat extends Error {}

export const MAX_ACTIONS = 400;

export function createSim(rows: string[], lineOf: () => number) {
  const map = parseMap(rows);
  const tiles = map.tiles.map((r) => r.slice());
  const items = map.items.map((r) => r.slice());
  const events: GridEvent[] = [];
  let x = map.start.x;
  let y = map.start.y;
  let gems = 0, goblins = 0, steps = 0, keys = 0, actions = 0;
  let escaped = false, drowned = false, tired = false;
  const count = (ch: string) => map.items.flat().filter((i) => i === ch).length;
  const gemsTotal = count('*');
  const goblinsTotal = count('g');

  function thingAt(tx: number, ty: number): Thing {
    if (ty < 0 || ty >= map.h || tx < 0 || tx >= map.w) return 'wall';
    const it = items[ty][tx];
    if (it === 'g') return 'goblin';
    if (it === '*') return 'gem';
    if (it === 'k') return 'key';
    const t = tiles[ty][tx];
    if (t === '#') return 'wall';
    if (t === 'T') return 'tree';
    if (t === '~') return 'water';
    if (t === 'E') return 'exit';
    if (t === 'D') return 'door';
    return 'empty';
  }

  function act() {
    actions++;
    if (actions > MAX_ACTIONS) {
      tired = true;
      events.push({ t: 'tired', line: lineOf() });
      throw new Defeat('Your hero is exhausted after ' + MAX_ACTIONS + ' actions. Is a loop running too long?');
    }
  }

  function checkDir(dir: unknown): Dir {
    if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') return dir;
    throw new TypeError(`"${String(dir)}" is not a direction. Use "up", "down", "left" or "right".`);
  }

  function step(dir: Dir) {
    act();
    const [dx, dy] = DIRS[dir];
    const nx = x + dx, ny = y + dy;
    const thing = thingAt(nx, ny);
    const line = lineOf();
    if (thing === 'wall' || thing === 'tree' || thing === 'goblin' || (thing === 'door' && keys === 0)) {
      events.push({ t: 'bump', x, y, dir, into: thing, line });
      return;
    }
    if (thing === 'door') {
      keys--;
      tiles[ny][nx] = '.';
      events.push({ t: 'door', x: nx, y: ny, line });
    }
    x = nx; y = ny; steps++;
    events.push({ t: 'move', x, y, dir, line });
    if (thing === 'water') {
      drowned = true;
      events.push({ t: 'splash', x, y, line });
      throw new Defeat('Splash! Your hero fell into the water.');
    }
    if (thing === 'gem' || thing === 'key') {
      items[y][x] = '';
      if (thing === 'gem') gems++; else keys++;
      events.push({ t: 'collect', x, y, item: thing, line });
    }
    if (thing === 'exit') {
      escaped = true;
      events.push({ t: 'exit', line });
      throw new Victory('exit');
    }
  }

  function moves(dir: Dir, n: unknown) {
    const times = n === undefined ? 1 : Number(n);
    if (!Number.isFinite(times) || times < 0) throw new TypeError('The number of steps must be a positive number.');
    for (let i = 0; i < Math.floor(times); i++) step(dir);
  }

  const hero = {
    moveRight: (n?: number) => moves('right', n),
    moveLeft: (n?: number) => moves('left', n),
    moveUp: (n?: number) => moves('up', n),
    moveDown: (n?: number) => moves('down', n),
    move: (dir: Dir, n?: number) => moves(checkDir(dir), n),
    attack: (dir: Dir) => {
      act();
      const d = checkDir(dir);
      const [dx, dy] = DIRS[d];
      const tx = x + dx, ty = y + dy;
      const hit = thingAt(tx, ty) === 'goblin';
      if (hit) { items[ty][tx] = ''; goblins++; }
      events.push({ t: 'attack', x: tx, y: ty, dir: d, hit, line: lineOf() });
      return hit;
    },
    look: (dir: Dir): Thing => thingAt(x + DIRS[checkDir(dir)][0], y + DIRS[checkDir(dir)][1]),
    say: (...msg: unknown[]) => {
      act();
      events.push({ t: 'say', text: msg.map(String).join(' ').slice(0, 80), line: lineOf() });
    },
    get x() { return x; },
    get y() { return y; },
    get gems() { return gems; },
    get keys() { return keys; },
  };

  function result(): SimResult {
    let offByOne = false;
    if (!escaped) {
      for (const [dx, dy] of Object.values(DIRS)) if (thingAt(x + dx, y + dy) === 'exit') offByOne = true;
    }
    return { events, escaped, drowned, tired, gems, gemsTotal, goblins, goblinsTotal, steps, x, y, offByOne };
  }

  return { hero, events, result, map };
}
