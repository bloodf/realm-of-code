// Canvas renderer for the hero grid (no framework). It draws the map and replays the event trace
// recorded by the code worker: walking, bumping, collecting, fighting, talking.
import { parseMap, DIRS, type GridEvent, type ParsedMap } from './world';
import { spritePixels, tilePixels, TUNICS, type SpriteName, type TileName, type THEMES } from './sprites';
import { play } from '../audio/sound';

const T = 16;       // tile size in art pixels
const S = 3;        // scale

type Theme = keyof typeof THEMES;


function toCanvas(px: Uint8ClampedArray) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  c.getContext('2d')!.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, 16, 16), 0, 0);
  return c;
}

const spriteCache = new Map<string, HTMLCanvasElement>();
function sprite(name: SpriteName, tunic?: string) {
  const k = name + (tunic ?? '');
  let c = spriteCache.get(k);
  if (!c) { c = toCanvas(spritePixels(name, tunic ? TUNICS[tunic] : undefined)); spriteCache.set(k, c); }
  return c;
}
const tileCache = new Map<string, HTMLCanvasElement>();
function tile(name: TileName, v: number, theme: Theme) {
  const k = name + v + theme;
  let c = tileCache.get(k);
  if (!c) { c = toCanvas(tilePixels(name, v, theme)); tileCache.set(k, c); }
  return c;
}

const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function drawTerrain(m: ParsedMap, theme: Theme, frame: 0 | 1) {
  const c = document.createElement('canvas');
  c.width = m.w * T; c.height = m.h * T;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = m.tiles[y][x];
    const h = hash(x, y);
    let base: TileName = h % 9 === 0 ? 'flowers' : 'grass';
    if (ch === ',') base = 'path';
    if (ch === '#') base = 'wall';
    if (ch === '~') base = frame ? 'water2' : 'water';
    if (ch === '=') base = 'bridge';
    if (ch === 'E' || ch === 'D') base = 'path';
    g.drawImage(tile(base, h % 4, theme), x * T, y * T);
    if (ch === 'T') g.drawImage(sprite('tree'), x * T, y * T);
    if (ch === 'E') g.drawImage(sprite('gate'), x * T, y * T);
    // soft shadow under walls for depth
    if (ch === '#' && m.tiles[y + 1]?.[x] !== '#' && y + 1 < m.h) {
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(x * T, (y + 1) * T, T, 3);
    }
  }
  return c;
}

interface Anim {
  hero: { x: number; y: number; fx: number; fy: number; face: 1 | -1; t0: number; dur: number; bump?: { dx: number; dy: number } };
  items: string[][];
  doors: Set<string>;
  bubble: { text: string; until: number } | null;
  fx: { kind: 'slash' | 'spark' | 'splash' | 'text'; x: number; y: number; t0: number; dur: number; text?: string; color?: string }[];
  sunk: boolean;
  won: boolean;
}

export interface GridOpts {
  map: string[];
  theme?: Theme;
  avatar: SpriteName;
  tunic: string;
  events: GridEvent[] | null;
  speed: number;
  onLine?: (line: number | null) => void;
  onDone?: () => void;
}

/** Draws the hero map on a canvas and replays events. Returns a stop function. */
export function playGrid(cv: HTMLCanvasElement, o: GridOpts): () => void {
  const { map, avatar, tunic, events, speed } = o;
  const theme = o.theme ?? 'forest';
  const cb = { current: { onLine: o.onLine, onDone: o.onDone } };
  const skipRef = { current: false };
    const m = parseMap(map);
    const layers = [drawTerrain(m, theme, 0), drawTerrain(m, theme, 1)];
    
    cv.width = m.w * T * S; cv.height = m.h * T * S;
    const g = cv.getContext('2d')!;
    g.imageSmoothingEnabled = false;

    const a: Anim = {
      hero: { x: m.start.x, y: m.start.y, fx: m.start.x, fy: m.start.y, face: 1, t0: 0, dur: 0 },
      items: m.items.map((r) => r.slice()),
      doors: new Set(m.tiles.flatMap((r, y) => r.map((c, x) => (c === 'D' ? `${x},${y}` : ''))).filter(Boolean)),
      bubble: null, fx: [], sunk: false, won: false,
    };

    const queue = events ? events.slice() : [];
    let idx = 0;
    let nextAt = performance.now() + 250;
    let raf = 0;
    let done = !events;
    // Long replays (e.g. a loop bumping into a wall 400 times) speed up so they last about 10 s at most.
    const boost = Math.max(1, (queue.length * 280) / 10000);
    const dur = (ms: number) => ms / (Math.max(0.25, speed) * boost * (skipRef.current ? 40 : 1));

    function apply(e: GridEvent, now: number): number {
      if ('line' in e && e.line) cb.current.onLine?.(e.line);
      switch (e.t) {
        case 'move': {
          const h = a.hero;
          h.fx = h.x; h.fy = h.y; h.x = e.x; h.y = e.y; h.t0 = now; h.dur = dur(240); h.bump = undefined;
          if (e.dir === 'left') h.face = -1; else if (e.dir === 'right') h.face = 1;
          play('step');
          return dur(250);
        }
        case 'bump': {
          const h = a.hero;
          const [dx, dy] = DIRS[e.dir];
          h.fx = h.x; h.fy = h.y; h.t0 = now; h.dur = dur(280); h.bump = { dx, dy };
          if (e.dir === 'left') h.face = -1; else if (e.dir === 'right') h.face = 1;
          a.fx.push({ kind: 'text', x: h.x + dx * 0.5, y: h.y + dy * 0.5, t0: now, dur: dur(700), text: 'Ouch!', color: '#ffb199' });
          play('bump');
          return dur(320);
        }
        case 'collect': {
          a.items[e.y][e.x] = '';
          a.fx.push({ kind: 'spark', x: e.x, y: e.y, t0: now, dur: dur(500) });
          a.fx.push({ kind: 'text', x: e.x, y: e.y - 0.3, t0: now, dur: dur(800), text: e.item === 'gem' ? '+1 gem' : 'key!', color: e.item === 'gem' ? '#8fe3f2' : '#f2c14e' });
          play(e.item === 'gem' ? 'gem' : 'key');
          return dur(120);
        }
        case 'attack': {
          const h = a.hero;
          if (e.dir === 'left') h.face = -1; else if (e.dir === 'right') h.face = 1;
          a.fx.push({ kind: 'slash', x: e.x, y: e.y, t0: now, dur: dur(300) });
          if (e.hit) {
            a.items[e.y][e.x] = '';
            a.fx.push({ kind: 'spark', x: e.x, y: e.y, t0: now, dur: dur(500) });
            a.fx.push({ kind: 'text', x: e.x, y: e.y - 0.3, t0: now, dur: dur(800), text: 'Defeated!', color: '#ffd479' });
            play('hit');
          } else play('swing');
          return dur(360);
        }
        case 'door':
          a.doors.delete(`${e.x},${e.y}`);
          play('door');
          return dur(300);
        case 'say':
          a.bubble = { text: e.text, until: now + dur(1100) };
          play('say');
          return dur(900);
        case 'log':
          return dur(40);
        case 'splash':
          a.sunk = true;
          a.fx.push({ kind: 'splash', x: e.x, y: e.y, t0: now + dur(200), dur: dur(700) });
          setTimeout(() => play('splash'), dur(200));
          return dur(900);
        case 'exit':
          a.won = true;
          a.fx.push({ kind: 'spark', x: a.hero.x, y: a.hero.y, t0: now + dur(200), dur: dur(700) });
          return dur(700);
        case 'tired':
          a.bubble = { text: 'So... tired...', until: now + dur(1400) };
          return dur(1200);
      }
    }

    function draw(now: number) {
      // advance the event queue
      while (!done && now >= nextAt) {
        if (idx >= queue.length) {
          done = true;
          cb.current.onLine?.(null);
          cb.current.onDone?.();
          break;
        }
        nextAt = now + apply(queue[idx++], now);
      }

      const frame = Math.floor(now / 500) % 2;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(layers[frame], 0, 0, m.w * T * S, m.h * T * S);

      // doors
      for (const k of a.doors) {
        const [x, y] = k.split(',').map(Number);
        g.drawImage(sprite('door'), x * T * S, y * T * S, T * S, T * S);
      }
      // items
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const it = a.items[y][x];
        if (!it) continue;
        const bob = Math.sin(now / 300 + x + y) * (it === 'g' ? 1 : 2);
        const name: SpriteName = it === '*' ? 'gem' : it === 'k' ? 'key' : 'goblin';
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.beginPath(); g.ellipse((x + 0.5) * T * S, (y + 0.9) * T * S, 5 * S, 1.6 * S, 0, 0, Math.PI * 2); g.fill();
        g.drawImage(sprite(name), x * T * S, (y * T + bob) * S, T * S, T * S);
      }

      // hero
      const h = a.hero;
      let p = h.dur ? Math.min(1, (now - h.t0) / h.dur) : 1;
      let hx = h.x, hy = h.y, lift = 0;
      if (h.bump) {
        const k = p < 0.5 ? p * 2 : (1 - p) * 2;
        hx = h.x + h.bump.dx * 0.25 * k; hy = h.y + h.bump.dy * 0.25 * k;
      } else if (p < 1) {
        const e = p * (2 - p);
        hx = h.fx + (h.x - h.fx) * e; hy = h.fy + (h.y - h.fy) * e;
        lift = Math.sin(p * Math.PI) * 3;
      } else {
        lift = Math.abs(Math.sin(now / 400)) * 0.8;
        p = 1;
      }
      if (!a.sunk) {
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.beginPath(); g.ellipse((hx + 0.5) * T * S, (hy + 0.92) * T * S, 5 * S, 1.6 * S, 0, 0, Math.PI * 2); g.fill();
        g.save();
        g.translate((hx + 0.5) * T * S, (hy * T - lift) * S);
        g.scale(h.face, 1);
        g.drawImage(sprite(avatar, tunic), -T * S / 2, 0, T * S, T * S);
        g.restore();
      }

      // effects
      a.fx = a.fx.filter((f) => now < f.t0 + f.dur);
      for (const f of a.fx) {
        const k = Math.max(0, (now - f.t0) / f.dur);
        if (now < f.t0) continue;
        const cx = (f.x + 0.5) * T * S, cy = (f.y + 0.5) * T * S;
        if (f.kind === 'slash') {
          g.globalAlpha = 1 - k;
          g.drawImage(sprite('slash'), f.x * T * S, f.y * T * S, T * S, T * S);
          g.globalAlpha = 1;
        } else if (f.kind === 'spark') {
          for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const r = k * 22 * S / 3 * 2;
            g.fillStyle = i % 2 ? '#fff4dc' : '#f2c14e';
            g.globalAlpha = 1 - k;
            g.fillRect(cx + Math.cos(ang) * r - S, cy + Math.sin(ang) * r - S, S * 2, S * 2);
          }
          g.globalAlpha = 1;
        } else if (f.kind === 'splash') {
          for (let i = 0; i < 10; i++) {
            const ang = Math.PI + (i / 9) * Math.PI;
            const r = k * 18 * S;
            g.fillStyle = '#cfefff';
            g.globalAlpha = 1 - k;
            g.fillRect(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.8 + k * k * 20, S * 2, S * 2);
          }
          g.globalAlpha = 1;
        } else if (f.kind === 'text' && f.text) {
          g.globalAlpha = 1 - k * k;
          g.font = `bold ${6 * S}px MedievalSharp, serif`;
          g.textAlign = 'center';
          g.lineWidth = 4;
          g.strokeStyle = '#1b1220';
          g.strokeText(f.text, cx, cy - k * 14 * S);
          g.fillStyle = f.color ?? '#fff';
          g.fillText(f.text, cx, cy - k * 14 * S);
          g.globalAlpha = 1;
        }
      }

      // speech bubble
      if (a.bubble && now < a.bubble.until) {
        g.font = `${6 * S}px MedievalSharp, serif`;
        const text = a.bubble.text;
        const w = Math.min(cv.width - 8, g.measureText(text).width + 8 * S);
        const bx = Math.max(4, Math.min(cv.width - w - 4, (hx + 0.5) * T * S - w / 2));
        const by = Math.max(4, hy * T * S - 14 * S);
        g.fillStyle = '#fff4dc';
        g.strokeStyle = '#1b1220';
        g.lineWidth = S;
        g.beginPath();
        g.roundRect(bx, by, w, 11 * S, 3 * S);
        g.fill(); g.stroke();
        g.fillStyle = '#1b1220';
        g.textAlign = 'center';
        g.fillText(text, bx + w / 2, by + 8 * S, w - 4 * S);
      }

      if (a.won) {
        g.fillStyle = `rgba(242, 193, 78, ${0.15 + 0.1 * Math.sin(now / 150)})`;
        g.fillRect(0, 0, cv.width, cv.height);
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
}
