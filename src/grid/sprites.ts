import { EXTRA_PALETTE, EXTRA_SPRITES, heroFrames, NPCS, npcFrames, npcPalette } from '../pixel/art.ts';
import { CREATURES, bobRows, blinkRows, shinyPalette } from '../pixel/creatures.ts';

// Hand-made 16x16 pixel art for Realm of Code. Each letter is a palette colour,
// '.' is transparent. Used by the game at runtime and exported to PNG by
// scripts/export-assets.ts.

export const PALETTE: Record<string, string> = {
  k: '#1b1220', // outline
  w: '#fff4dc', // highlight
  s: '#d8dee9', // steel light
  S: '#8c96ad', // steel
  d: '#565e78', // steel dark
  r: '#c0392b', // tunic (swappable)
  R: '#7d1f1a', // tunic shade (swappable)
  y: '#f2c14e', // gold
  Y: '#b7832f', // gold shade
  p: '#f1c29a', // skin
  P: '#c98b62', // skin shade
  g: '#8bd14e', // bright green
  G: '#3d8f3a', // green
  h: '#24603a', // dark green
  b: '#5b8ee1', // blue
  B: '#33407a', // dark blue
  c: '#8fe3f2', // cyan
  n: '#9a6339', // wood
  N: '#5e3a24', // dark wood
  v: '#8a4fb0', // purple
  V: '#4d2a66', // dark purple
  e: '#2a1d2e', // eye
  m: '#e06a6a', // mouth / pink
  o: '#e8833a', // orange
  x: '#f7f0a8', // pale light
};

export type SpriteName = string;

export const SPRITES: Record<string, string[]> = {
  knight: [
    '................',
    '.......rr.......',
    '......rrR.......',
    '.....kkkkkk.....',
    '....ksssssSk....',
    '....kswsssSk....',
    '....kskkkkkk....',
    '....ksssSSSk....',
    '.....kSSSSk.....',
    '...kkkrrrrkk....',
    '..kbbkryyrkSk...',
    '..kbykryyrkSk...',
    '..kbbkrrrRkpk...',
    '...kkkNNNNkk....',
    '....kdk..kdk....',
    '....kkk..kkk....',
  ],
  mage: [
    '.......k........',
    '......kvk.......',
    '.....kvvVk......',
    '.....kvyVk......',
    '....kvvvvVk.....',
    '...kkkkkkkkk....',
    '....kpppppk.....',
    '....kpepepk..y..',
    '....kwwwwwk.kyk.',
    '...krwwwwwrk.n..',
    '..krrwwwwwrRkn..',
    '..krrrrrrrrRkn..',
    '..kprrryrrrRpn..',
    '...krrrrrrRRkn..',
    '...krrrrrrRRk...',
    '....kkkkkkkk....',
  ],
  ranger: [
    '................',
    '......kkkk......',
    '.....kGGGGk.....',
    '....kGGGGGhk....',
    '....kGpppphk....',
    '....kGpepeGk....',
    '....kGppppGk..k.',
    '.....kGGGGk..knk',
    '...kkrrrrrkk.k.n',
    '..kpkrnnnrkpkk.n',
    '..kpkrrrrrRk.n.n',
    '...kkrrrrrRk.k.n',
    '....kNNNNNk...kn',
    '....kGk.kGk....k',
    '....kNk.kNk.....',
    '....kkk.kkk.....',
  ],
  goblin: [
    '................',
    '................',
    '..kk........kk..',
    '..kgk.kkkk.kgk..',
    '...kgkggggkgk...',
    '....kggggggk....',
    '....kgmggmgk....',
    '....kgggggGk....',
    '....kgkwkwGk....',
    '.....kGGGGk.....',
    '...kknnnnnnkk...',
    '..kgknNnnNnkgk..',
    '..kgknnnnnnkgk..',
    '...kknNNNNnkk...',
    '....kGk..kGk....',
    '....kkk..kkk....',
  ],
  gem: [
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '....kcwcbbBk....',
    '...kcwccbbbBk...',
    '..kkkkkkkkkkkk..',
    '..kccwcccbbbBk..',
    '...kccccbbbBk...',
    '....kcccbbBk....',
    '.....kccbBk.....',
    '......kcBk......',
    '.......kk.......',
    '................',
    '................',
    '................',
  ],
  key: [
    '................',
    '................',
    '................',
    '....kkkk........',
    '...kyyyyk.......',
    '..kyYkkYyk......',
    '..kyk..kykkkkkk.',
    '..kyk..kyyyyyyyk',
    '..kyYkkYyYkYkYk.',
    '...kyyyyk.k.k.k.',
    '....kkkk........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  tree: [
    '................',
    '.....kkkkkk.....',
    '...kkgggggGkk...',
    '..kgggggggGGGk..',
    '.kggwgggggGGGhk.',
    '.kgggggggGGGGhk.',
    'kgggggggGGGGGhhk',
    'kGgggggGGGGGhhhk',
    'kGGgggGGGGGhhhhk',
    '.kGGGGGGGhhhhhk.',
    '..kkhhhhhhhhkk..',
    '....kkknNkkk....',
    '......knNk......',
    '......knNk......',
    '.....knnNNk.....',
    '.....kkkkkk.....',
  ],
  gate: [
    '....kk....kk....',
    '...kSSk..kSSk...',
    '...kSSkkkkSSk...',
    '..kSSSSSSSSSSk..',
    '..kSdSdSSdSdSk..',
    '..kSSSSkkSSSSk..',
    '..kSSSknnkSSSk..',
    '..kSSknnnnkSSk..',
    '..kSdknNnNkdSk..',
    '..kSSknnnnkSSk..',
    '..kSSknNnNkSSk..',
    '..kSSknnnykSSk..',
    '..kSdknNnNkdSk..',
    '..kSSknnnnkSSk..',
    '..kddknNnNkddk..',
    '..kkkkkkkkkkkk..',
  ],
  door: [
    'kkkkkkkkkkkkkkkk',
    'kSSSSkkkkkkSSSSk',
    'kSSSknnnnnnkSSSk',
    'kSSknnNnnNnnkSSk',
    'kSSknnNnnNnnkSSk',
    'kSknnnNnnNnnnkSk',
    'kSkddddddddddkSk',
    'kSknnnNnnNnnnkSk',
    'kSknnnNnnNyynkSk',
    'kSknnnNnnNykykSk',
    'kSknnnNnnNyynkSk',
    'kSkddddddddddkSk',
    'kSknnnNnnNnnnkSk',
    'kSknnnNnnNnnnkSk',
    'kSknnnNnnNnnnkSk',
    'kkkkkkkkkkkkkkkk',
  ],
  flag: [
    '...k............',
    '..kyk...........',
    '...kkkkkkkk.....',
    '...krrrrrrrk....',
    '...krrryrrrrk...',
    '...krryyyrrrrk..',
    '...krrryrrrrk...',
    '...krrrrrrrk....',
    '...kkkkkkkk.....',
    '...kN...........',
    '...kN...........',
    '...kN...........',
    '...kN...........',
    '...kN...........',
    '..kkNk..........',
    '.kkkkkk.........',
  ],
  chest: [
    '................',
    '................',
    '................',
    '...kkkkkkkkkk...',
    '..knnnnnnnnnnk..',
    '..knNNNNNNNNnk..',
    '..knnnnnnnnnnk..',
    '..kYYYYkkYYYYk..',
    '..knnnnkyknnnk..',
    '..knnnnkkknnnk..',
    '..knNNNNNNNNnk..',
    '..knnnnnnnnnnk..',
    '..kYYYYYYYYYYk..',
    '...kkkkkkkkkk...',
    '................',
    '................',
  ],
  skull: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kwwwwwwk....',
    '...kwwwwwwwwk...',
    '...kwkkwwkkwk...',
    '...kwkkwwkkwk...',
    '...kwwwkkwwwk...',
    '....kwwwwwwk....',
    '.....kwkwkk.....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  slash: [
    '................',
    '...........wx...',
    '..........wxx...',
    '.........wxx....',
    '........wxx.....',
    '.......wxx......',
    '......wxx.......',
    '.....wxx........',
    '....wxx.........',
    '...wxx..........',
    '..wxx...........',
    '..wx............',
    '................',
    '................',
    '................',
    '................',
  ],
  heart: [
    '................',
    '................',
    '..kkk....kkk....',
    '.kmmmk..kmmmk...',
    'kmwmmmkkmmmmRk..',
    'kmwmmmmmmmmmRk..',
    'kmmmmmmmmmmmRk..',
    '.kmmmmmmmmmRk...',
    '..kmmmmmmmRk....',
    '...kmmmmmRk.....',
    '....kmmmRk......',
    '.....kmRk.......',
    '......kk........',
    '................',
    '................',
    '................',
  ],
  coin: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '...kyxyyyyYYk...',
    '..kyxyYkkYyYYk..',
    '..kyyYyyyyYyYk..',
    '..kyyYyyyyYyYk..',
    '..kyyYyyyyYyYk..',
    '..kyyyYkkYyyYk..',
    '...kyyyyyyyYk...',
    '....kYYYYYYk....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
  ],
  scroll: [
    '................',
    '..kkkkkkkkkkk...',
    '.knnwwwwwwwwnk..',
    '.kNnkkkkkkkkNk..',
    '..kwwwwwwwwwk...',
    '..kwkkkkkkwwk...',
    '..kwwwwwwwwwk...',
    '..kwkkkkkwwwk...',
    '..kwwwwwwwwwk...',
    '..kwkkkkkkkwk...',
    '..kwwwwwwwwwk...',
    '.kkkkkkkkkkkkk..',
    '.knnwwwwwwwwnk..',
    '.kNnkkkkkkkkNk..',
    '..kkkkkkkkkkk...',
    '................',
  ],
  ember: [
    '................',
    '.........k..k...',
    '........kyk.kyk.',
    '.......koooooook',
    '.......kooowoowk',
    '..kk...kooekoekk',
    '.kook..koooooook',
    '.koook.kkommmmk.',
    '..kooookooooook.',
    '...koooxxxxoook.',
    '...kooxxxxxxook.',
    '.kkkooxxxxxxokk.',
    'kook.kooxxxook..',
    '.kk...koooook...',
    '......kok.kok...',
    '......kkk.kkk...',
  ],
  emberSad: [
    '................',
    '.........k..k...',
    '........kyk.kyk.',
    '.......koooooook',
    '.......koooooook',
    '..kk...kokkokkok',
    '.kook..koooooook',
    '.koook.kooookook',
    '..kooookooookkk.',
    '...koooxxxxoook.',
    '...kooxxxxxxook.',
    '.kkkooxxxxxxokk.',
    'kook.kooxxxook..',
    '.kk...koooook...',
    '......kok.kok...',
    '......kkk.kkk...',
  ],
  emberCheer: [
    '.........k..k...',
    '........kyk.kyk.',
    '.......koooooook',
    '.......kooowoowk',
    'kk.....kooekoekk',
    'kok....koooooook',
    'koook..kkommmmk.',
    '.koooookooooook.',
    '..kooooxxxxoookk',
    '...kooxxxxxxokok',
    '...kooxxxxxxokk.',
    '.kkkooxxxxxxok..',
    'kook.kooxxxook..',
    '.kk...koooook...',
    '......kok.kok...',
    '......kkk.kkk...',
  ],
  trophy: [
    '................',
    '...kkkkkkkkkk...',
    '.kkkyxyyyyyYkkk.',
    'kyykyxyyyyyYkyyk',
    'kykkyxyyyyyYkkyk',
    'kyk.kyyyyyYYk.yk',
    '.kyykyyyyyYkyyk.',
    '..kkkyyyyyYkkk..',
    '.....kyyyYk.....',
    '......kyYk......',
    '......kyYk......',
    '.....kyyYYk.....',
    '....kNNNNNNk....',
    '....knnnnnNk....',
    '....kkkkkkkk....',
    '................',
  ],
};

Object.assign(PALETTE, EXTRA_PALETTE);
Object.assign(SPRITES, EXTRA_SPRITES);
// Items: a centred torch (the prop torch leans left).
SPRITES.torchItem = SPRITES.torch1.map((r) => '..' + r.slice(0, 14));
SPRITES.torchItem2 = SPRITES.torch2.map((r) => '..' + r.slice(0, 14));
Object.assign(SPRITES, heroFrames(SPRITES));

/** Per-sprite colour overrides (used by the section guides). */
export const SPRITE_PALETTES: Record<string, Record<string, string>> = {};
for (const def of NPCS) {
  const f = npcFrames(def);
  const pal = npcPalette(def);
  for (const [k, rows] of Object.entries(f)) {
    const name = `npc-${def.id}${k === 'base' ? '' : '@' + k}`;
    SPRITES[name] = rows;
    SPRITE_PALETTES[name] = pal;
  }
}

// Creatures (fairy, pets, animals, monsters, crops, gems): own palettes, plus a bob and a
// blink frame, and a "*shiny" recolour for pets.
for (const [name, art] of Object.entries(CREATURES)) {
  const frames: Record<string, string[]> = { '': art.rows, '@bob': bobRows(art.rows), '@blink': blinkRows(art.rows) };
  for (const [suf, rows] of Object.entries(frames)) {
    SPRITES[name + suf] = rows;
    SPRITE_PALETTES[name + suf] = art.pal;
    if (name.startsWith('pet-')) { SPRITES[name + '*shiny' + suf] = rows; SPRITE_PALETTES[name + '*shiny' + suf] = shinyPalette(art.pal); }
  }
}
// dragons are enemies now: the old dragon drawing in three colours
for (const [name, o, x, y] of [['mob-whelp', '#6cc04a', '#d8ecb0', '#f2c14e'], ['mob-dragon', '#d9482a', '#ffd23f', '#f2c14e'], ['mob-dragonBlack', '#3a3448', '#9a5ad8', '#e05a5a']] as [string, string, string, string][]) {
  const pal = { ...PALETTE, o, x, y, e: '#e05a5a' };
  SPRITES[name] = SPRITES.ember; SPRITE_PALETTES[name] = pal;
  SPRITES[name + '@bob'] = bobRows(SPRITES.ember); SPRITE_PALETTES[name + '@bob'] = pal;
}
// the fairy's wings flutter: move them one pixel down
SPRITES['fairy@wings'] = CREATURES.fairy.rows.map((r, y) => {
  const prev = CREATURES.fairy.rows[y - 1] ?? '................';
  return prev.slice(0, 4) + r.slice(4, 12) + prev.slice(12);
});
SPRITE_PALETTES['fairy@wings'] = CREATURES.fairy.pal;

export const TUNICS: Record<string, [string, string]> = {
  crimson: ['#c0392b', '#7d1f1a'],
  royal: ['#3b6fd6', '#22407f'],
  forest: ['#3d9a4f', '#22593a'],
  violet: ['#8a4fb0', '#4d2a66'],
  amber: ['#e0902a', '#8d5217'],
};

/** Returns RGBA pixels (16x16) for a sprite, with optional tunic colour swap. */
export function spritePixels(name: SpriteName, tunic?: [string, string]): Uint8ClampedArray {
  const rows = SPRITES[name] ?? SPRITES.skull;
  const data = new Uint8ClampedArray(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = rows[y]?.[x] ?? '.';
      if (ch === '.') continue;
      let hex = SPRITE_PALETTES[name]?.[ch] ?? PALETTE[ch];
      if (tunic && ch === 'r') hex = tunic[0];
      if (tunic && ch === 'R') hex = tunic[1];
      if (!hex) continue;
      const i = (y * 16 + x) * 4;
      data[i] = parseInt(hex.slice(1, 3), 16);
      data[i + 1] = parseInt(hex.slice(3, 5), 16);
      data[i + 2] = parseInt(hex.slice(5, 7), 16);
      data[i + 3] = 255;
    }
  }
  return data;
}

// ---------- Procedural terrain tiles (seeded, so they look the same every time) ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export type TileName = 'grass' | 'path' | 'wall' | 'water' | 'water2' | 'bridge' | 'stone' | 'flowers';

export const THEMES = {
  forest: { grass: ['#5a9c3a', '#4d8a32', '#68ad44'], path: ['#c9a26b', '#b58f5a', '#d8b47c'] },
  forge: { grass: ['#5b5552', '#524c49', '#66605c'], path: ['#8a6d55', '#7a5f49', '#9a7b61'] },
};

export function tilePixels(name: TileName, variant = 0, theme: keyof typeof THEMES = 'forest'): Uint8ClampedArray {
  const data = new Uint8ClampedArray(16 * 16 * 4);
  const r = rng(variant * 7919 + name.length * 104729 + 17);
  const put = (x: number, y: number, hex: string) => {
    const [R, G, B] = hexToRgb(hex);
    const i = (y * 16 + x) * 4;
    data[i] = R; data[i + 1] = G; data[i + 2] = B; data[i + 3] = 255;
  };
  const t = THEMES[theme];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    switch (name) {
      case 'grass':
      case 'flowers': {
        const v = r();
        put(x, y, v < 0.12 ? t.grass[1] : v > 0.93 ? t.grass[2] : t.grass[0]);
        break;
      }
      case 'path': {
        const v = r();
        put(x, y, v < 0.15 ? t.path[1] : v > 0.9 ? t.path[2] : t.path[0]);
        break;
      }
      case 'stone': {
        const v = r();
        put(x, y, v < 0.15 ? '#6d6a75' : v > 0.9 ? '#8d8a96' : '#7b7884');
        break;
      }
      case 'wall': {
        // stone bricks
        const row = Math.floor(y / 4);
        const off = row % 2 ? 4 : 0;
        const mortar = y % 4 === 3 || (x + off) % 8 === 7;
        const v = r();
        put(x, y, mortar ? '#3b3542' : y % 4 === 0 ? '#a5a0ad' : v < 0.2 ? '#77717f' : '#8c8696');
        break;
      }
      case 'water':
      case 'water2': {
        const phase = name === 'water2' ? 3 : 0;
        const wave = (y + phase) % 6 === 0 && ((x + y + phase) % 8) < 4;
        put(x, y, wave ? '#9fd8f5' : (y + phase) % 6 === 1 && ((x + y + phase) % 8) < 4 ? '#3f7fc9' : '#3a6fbf');
        break;
      }
      case 'bridge': {
        const plank = x % 4 === 3;
        const v = r();
        put(x, y, y === 0 || y === 15 ? '#3b2516' : plank ? '#5e3a24' : v < 0.2 ? '#8a5a35' : '#9a6a42');
        break;
      }
    }
  }
  if (name === 'flowers') {
    const colors = ['#f7f0a8', '#e06a6a', '#fff4dc', '#b58be0'];
    for (let i = 0; i < 5; i++) {
      const fx = 1 + Math.floor(r() * 14), fy = 1 + Math.floor(r() * 14);
      put(fx, fy, colors[Math.floor(r() * colors.length)]);
    }
  }
  return data;
}
