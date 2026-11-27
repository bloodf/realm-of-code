// Creatures drawn in code (16x16, one letter per pixel): Lumi the fairy, the 20 pets,
// the homestead animals, the monsters of the PvE battles, new crops, farm products,
// match-3 gems and pet eggs. Each creature has its own palette, so "shiny" pets are
// the same drawing with a different palette.

export interface Art { rows: string[]; pal: Record<string, string> }

const K = '#1b1220';
const dots = '................';
const base = { k: K, e: '#1b1220', w: '#ffffff', m: '#f08a9a', n: '#2a1d2e', y: '#f2c14e', Y: '#b7832f', o: '#e8833a', x: '#fff4dc' };

// ---------------- mammals from parts ----------------
const TOPS: Record<string, string[]> = {
  none: [dots, dots, dots, dots, dots],
  long: ['....kk....kk....', '...kbbk..kbbk...', '...kbak..kabk...', '...kbak..kabk...', '....kbk..kbk....'],
  pointy: [dots, '...k........k...', '..kbk......kbk..', '..kbak....kabk..', '..kbbak..kabbk..'],
  round: [dots, dots, '..kkk......kkk..', '.kbaak....kaabk.', '.kbaak....kaabk.'],
  small: [dots, dots, dots, '...kk......kk...', '..kbbk....kbbk..'],
  floppy: [dots, dots, '..kkk......kkk..', '.kaaak....kaaak.', '.kaaak....kaaak.'],
  tufts: [dots, dots, '...k........k...', '...kbk....kbk...', '...kbbk..kbbk...'],
  horn: ['.......kk.......', '.......kyk......', '......kyYk......', '..k...kyYk...k..', '..kbk.kyyk.kbk..'],
  horns: [dots, dots, '..kk........kk..', '..kYk......kYk..', '...kYk....kYk...'],
  crest: [dots, '......k.k.......', '.....kakak......', '......kaak......', '.......kk.......'],
  comb: [dots, dots, '......kkk.......', '.....krrrk......', '......krk.......'],
  mane: [dots, '.....kkkk.......', '....kaaaak......', '...kaaaaak......', '..kaaaaaak..kk..'],
};
const BODY = [
  '....kkkkkkkk....',
  '...kbbbbbbbbk...',
  '..kbbbbbbbbbbk..',
  '..kbbebbbbebbk..',
  '..kbmbbnnbbmbk..',
  '...kbbbbbbbbk...',
  '..kbbbllllbbbk..',
  '..kbbllllllbbk..',
  '..kbbbllllbbbk..',
  '...kbbkkkkbbk...',
  '...kkk....kkk...',
];
const FACES: Record<string, [string, string]> = {
  normal: ['..kbbebbbbebbk..', '..kbmbbnnbbmbk..'],
  mask: ['..kaaeaaaaeaak..', '..kbmbbnnbbmbk..'],
  big: ['..kbweebbeewbk..', '..kbbbbookbbbk..'],
  beak: ['..kbbebbbbebbk..', '..kbmbbookbmbk..'],
  snout: ['..kbbebbbbebbk..', '..kbbanaanabbk..'],
  angry: ['..kbkebbbbekbk..', '..kbbbnnnnbbbk..'],
  sleepy: ['..kbbkbbbbkbbk..', '..kbmbbnnbbmbk..'],
};
function put(rows: string[], y: number, x: number, s: string) {
  const r = rows[y].split('');
  for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && r[x + i] === '.') r[x + i] = s[i];
  rows[y] = r.join('');
}
function over(rows: string[], y: number, x: number, s: string) {
  const r = rows[y].split('');
  for (let i = 0; i < s.length; i++) if (s[i] !== ' ') r[x + i] = s[i];
  rows[y] = r.join('');
}
interface Parts { top: string; face?: string; tail?: 'tail' | 'big' | 'nine'; wings?: boolean; spots?: boolean; fluffy?: boolean; belly?: boolean }
function critter(p: Parts): string[] {
  const rows = [...TOPS[p.top], ...BODY];
  const [f1, f2] = FACES[p.face ?? 'normal'];
  rows[8] = f1; rows[9] = f2;
  if (p.belly === false) for (const y of [11, 12, 13]) rows[y] = rows[y].replace(/l/g, 'b');
  if (p.tail === 'tail') { put(rows, 9, 14, 'k'); put(rows, 10, 14, 'ak'); put(rows, 11, 14, 'ak'); put(rows, 12, 14, 'k'); }
  if (p.tail === 'big') { put(rows, 7, 14, 'k'); put(rows, 8, 14, 'ak'); put(rows, 9, 14, 'aak'); put(rows, 10, 14, 'ak'); put(rows, 11, 14, 'ak'); put(rows, 12, 14, 'k'); }
  if (p.tail === 'nine') { for (const [y, s] of [[5, 'k'], [6, 'ak'], [7, 'ka'], [8, 'ak'], [9, 'ka'], [10, 'ak'], [11, 'ka'], [12, 'k']] as [number, string][]) { put(rows, y, 14, s); put(rows, y, 0, s.split('').reverse().join('')); } }
  if (p.wings) for (const [y, l, r] of [[7, '.k', 'k.'], [8, 'ka', 'ak'], [9, 'ka', 'ak'], [10, 'ka', 'ak'], [11, '.k', 'k.']] as [number, string, string][]) { put(rows, y, 0, l); put(rows, y, 14, r); }
  if (p.spots) { over(rows, 7, 5, 'A'); over(rows, 11, 10, 'AA'); over(rows, 12, 4, 'A'); over(rows, 6, 9, 'A'); }
  if (p.fluffy) { for (const y of [6, 7, 10, 11, 12, 13]) { put(rows, y, 1, 'k'); put(rows, y, 14, 'k'); } }
  return rows;
}
const pal = (b: string, B: string, l: string, a: string, extra: Record<string, string> = {}) => ({ ...base, b, B, l, a, A: extra.A ?? B, r: '#d94848', ...extra });

// ---------------- hand-drawn ----------------
const FROG = [dots, dots, dots, '...kkk....kkk...', '..kwwek..kwwek..', '..kwwek..kewwk..', '..kbbbkkkkbbbk..', '.kbbbbbbbbbbbbk.', '.kbbmbbbbbbmbbk.', '.kbbkkkkkkkkbbk.', '..kbbbllllbbbk..', '.kbbbllllllbbbk.', '.kbbbbllllbbbbk.', '.kbbkbbbbbbkbbk.', 'kbbk.kkkkkk.kbbk', '.kk..........kk.'];
const TURTLE = [dots, dots, dots, dots, '......kkkk......', '.....kaAaAk.....', '....kaAaaAak.kk.', '...kaAaaaaAakbbk', '..kaAaaAaaaAkbek', '..kaaAaaAaaakbbk', '.kkkkkkkkkkkkbmk', '.kbbkllllllkbbk.', '..kbk......kbk..', '..kk........kk..', dots, dots];
const SNAIL = [dots, dots, '..k..k..........', '...kk...........', '...kbk..kkkk....', '..kbebk.kaAak...', '..kbbbkkaAaAak..', '..kbbbkaAkkAak..', '..kbbbkaAkaAak..', '..kbbbkaAaaAak..', '..kbbbbkaAAak...', '..kbbbbbkkkkbk..', '.kbbbbbbbbbbbbk.', '.kkkkkkkkkkkkkk.', dots, dots];
const PENGUIN = [dots, dots, '.....kkkkkk.....', '....kbbbbbbk....', '...kbbbbbbbbk...', '...kbwlbblwbk...', '...kbelbblebk...', '...kbllookllbk..', '..kbbllllllbbk..', '.kbkbllllllbkbk.', '.kbkbllllllbkbk.', '..kkbllllllbkk..', '...kbllllllbk...', '...kbbllllbbk...', '...kookkkkook...', '...kkk....kkk...'];
const OWL = [dots, '...k........k...', '...kbk....kbk...', '...kbbkkkkbbk...', '..kbbbbbbbbbbk..', '..kbwwbbbbwwbk..', '..kweewbbweewk..', '..kbwwbookwwbk..', '..kbbbbbkbbbbk..', '.kakbllllllbkak.', '.kakblAllAlbkak.', '.kakbllllllbkak.', '..kkblAllAlbkk..', '...kbllllllbk...', '...kokkkkkkok...', '...kk......kk...'];
const BAT = [dots, dots, '...k........k...', '...kk......kk...', '...kbk....kbk...', 'k..kbbkkkkbbk..k', 'kk.kbbbbbbbbk.kk', 'kak.kbebbebk.kak', 'kaakkbwbbwbkkaak', 'kaaakbbmmbbkaaak', 'kaaaakbbbbkaaaak', '.kaakakbbkakaak.', '..kk.kakkak.kk..', '......k..k......', dots, dots];
const DUCK = [dots, dots, dots, '.....kkkk.......', '....kbbbbk......', '...kbbebbbk.....', '...kbbbbookk....', '...kbbbbkook....', '....kbbbbkk.....', '...kbbbbbbbkkk..', '..kbbbbbbbbbbbk.', '..kbbblllbbbbbk.', '..kbbbllllbbbk..', '...kbbbbbbbbk...', '....kkokkokk....', '......k..k......'];
const SLIME = [dots, dots, dots, dots, dots, '......kkkk......', '....kkbbbbkk....', '...kbbwwbbbbk...', '..kbbwwbbbbbbk..', '..kbbebbbbebbk..', '.kbbbebbbbebbbk.', '.kbbbbbnnbbbbbk.', '.kbbbbbbbbbbbBk.', '.kBbbbbbbbbbBBk.', '..kkBBBBBBBBkk..', '....kkkkkkkk....'];
const GHOST = [dots, '.....kkkkkk.....', '....kbbbbbbk....', '...kbbbbbbbbk...', '...kbwbbbbwbk...', '..kbbebbbbebbk..', '..kbbebbbbebbk..', '..kbbbbnnbbbbk..', '..kbbbbnnbbbbk..', '..kbbbbbbbbbbk..', '..kbbbbbbbbbbk..', '..kbbbbbbbbbbk..', '..kbbkbbbkbbbk..', '..kbk.kbk.kbk...', '..kk...k...kk...', dots];
const SKELETON = [dots, '.....kkkkkk.....', '....kwwwwwwk....', '...kwwwwwwwwk...', '...kwkkwwkkwk...', '...kwkrwwkrwk...', '...kwwwwwwwwk...', '....kwkwkwkwk...', '.....kkkkkkk....', '...kk.kwwk.kk...', '..kwk.kwwk.kwk..', '..kwkkkwwkkkwk..', '..kk..kwwk..kk..', '.....kwkkwk.....', '.....kwk.kwk....', '.....kk...kk....'];
const MUSHROOM = [dots, '.....kkkkkk.....', '...kkaawaaakk...', '..kaaawwaawaak..', '.kaawaaaaaaawak.', '.kaaaaawwaaaaak.', '.kkkkkkkkkkkkkk.', '...kbbbbbbbbk...', '...kbkebbekbk...', '...kbbbbbbbbk...', '...kbbbnnbbbk...', '....kbbbbbbk....', '...kkbbbbbbkk...', '..kbk.kkkk.kbk..', '..kk........kk..', dots];
const GOLEM = [dots, '....kkkkkkkk....', '...kbbbbbbbbk...', '...kbBbbbbBbk...', '...kbkcbbckbk...', '...kbbbbbbbbk...', '.kkkkbbbbbbkkkk.', 'kbbbkbbBBbbkbbbk', 'kbBbkbbbbbbkbBbk', 'kbbbkbBbbBbkbbbk', '.kkkkbbbbbbkkkk.', '....kbbkkbbk....', '...kbbk..kbbk...', '...kbbk..kbbk...', '...kkkk..kkkk...', dots];
const MIMIC = [dots, dots, dots, '..kkkkkkkkkkkk..', '.knnnnnnnnnnnnk.', '.kNnnnnnnnnnnNk.', '.kkkkkkkkkkkkkk.', '.kwkwkwkwkwkwkk.', '.kmmmmmmmmmmmmk.', '.kkwkwkwkwkwkwk.', '.kkkkkkkkkkkkkk.', '.knnnnyynnnnnnk.', '.knnnnkynnnnnNk.', '.kNnnnnnnnnnNNk.', '.kkkkkkkkkkkkkk.', dots];
const WISP = [dots, dots, '.......k........', '......kyk.......', '.....kyxyk......', '....kyxxxyk.....', '...kyxxwxxyk....', '...kyxexexyk....', '...kyxxxxxyk....', '....kyxxxyk.....', '.....kyyyk......', '......kyk.......', '.......k........', dots, dots, dots];

// Lumi the fairy (the helper)
const FAIRY = [
  dots,
  '......kkkk......',
  '.....kyyyyk.....',
  'kk..kyyyyyyk..kk',
  'kck.kyppppyk.kck',
  'kcckyppepepykcck',
  'kcwckkppmpkkcwck',
  '.kcck.kggk.kcck.',
  '..kk.kggggk.kk..',
  '.....kgGGgk.....',
  '....kgggGGgk....',
  '....kGGGGGGk....',
  '.....kpk.kpk....',
  '......k...k.....',
  '........x.......',
  dots,
];
const FAIRY_CHEER = [
  '..x.........x...',
  '......kkkk......',
  '.....kyyyyk.....',
  'kk..kyyyyyyk..kk',
  'kckkkyppppykkkck',
  'kcckyppkpkpykcck',
  'kcwckkpmmmpkkcwk',
  '.kcckpkggkpkcck.',
  '..kk.kggggk.kk..',
  '.....kgGGgk.....',
  '....kgggGGgk....',
  '....kGGGGGGk....',
  '.....kpk.kpk....',
  '......k...k.....',
  '...x........x...',
  dots,
];
const FAIRY_SAD = [
  dots,
  dots,
  '......kkkk......',
  '.....kyyyyk.....',
  '....kyyyyyyk....',
  '..k.kyppppyk.k..',
  '.kckyppkpkpykck.',
  'kcck.kppmpk.kcck',
  'kcwk.kkggkk.kwck',
  '.kk..kggggk..kk.',
  '.....kgGGgk.....',
  '....kgggGGgk....',
  '....kGGGGGGk....',
  '.....kpk.kpk....',
  '......k...k.....',
  '.......b........',
];
const FAIRY_PAL = { k: K, y: '#ffd66b', p: '#ffe0c8', e: '#2a1d2e', m: '#f08a9a', c: '#9fe8f5', w: '#ffffff', g: '#7fd46a', G: '#3d9a4f', x: '#fff8a0', b: '#5b8ee1' };

// ---------------- crops, products, gems, eggs ----------------
const PLANT = ['................', '................', '................', '................', '................', '......k..k......', '.....kgkkgk.....', '....kgGgkgGk....', '.....kgGgGk.....', '......kgGk......', '.......kk.......', dots, dots, dots, dots, dots].map((r, i) => (i > 10 ? dots : r));
const TOMATO = [dots, '......k.k.......', '.....kgkgk......', '......kgk.......', '....kkrrrkk.....', '...krrwrrrrk....', '..krrwrrrrrRk...', '..krrrrrrrrRk...', '..krrrrrrrRRk...', '...krrrrRRRk....', '....kkkkkkk.....', dots, dots, dots, dots, dots];
const STRAWBERRY = [dots, '.....k.k.k......', '....kgkgkgk.....', '.....kgggk......', '....krrrrrk.....', '...krryrrrrk....', '...krrrrryrk....', '...kryrrrrrk....', '....krrrryk.....', '....krrrrrk.....', '.....kryrk......', '......krk.......', '.......k........', dots, dots, dots];
const CORN = ['......kk........', '.....kgGk.......', '....kgyyGk......', '....kyyyyk......', '...kgyYyyGk.....', '...kgyyyYGk.....', '...kgyYyyGk.....', '...kgyyyYGk.....', '...kgyYyyGk.....', '....kgyyGk......', '....kgGgGk......', '.....kgGk.......', '......kk........', dots, dots, dots];
const CABBAGE = [dots, dots, dots, dots, '.....kkkkk......', '...kkgGgGgkk....', '..kgGglllgGgk...', '..kgglllllggk...', '.kGgllgllglgGk..', '.kgGlllllllGgk..', '.kGgGllllGgGgk..', '..kgGgGgGgGgk...', '...kkgGgGgkk....', '.....kkkkk......', dots, dots];
const POTATO = [dots, dots, dots, dots, dots, '.....kkkkk......', '...kkaaaaakk....', '..kaaAaaaaaak...', '.kaaaaaaAaaaak..', '.kaAaaaaaaaAak..', '.kaaaaAaaaaaak..', '..kaaaaaaAaak...', '...kkaaaaakk....', '.....kkkkk......', dots, dots];
const EGG = [dots, dots, dots, '......kkkk......', '.....kwwwwk.....', '....kwwwwwxk....', '....kwwwwwxk....', '...kwwwwwwwxk...', '...kwwwwwwwxk...', '...kwwwwwwxxk...', '....kwwwwxxk....', '.....kkkkkk.....', dots, dots, dots, dots];
const MILK = [dots, dots, '......kkkk......', '......kyyk......', '.....kwwwwk.....', '....kwwwwwwk....', '....kbbbbbbk....', '....kwbwwbwk....', '....kwwwwwwk....', '....kwwwwwxk....', '....kwwwwwxk....', '....kkkkkkkk....', dots, dots, dots, dots];
const WOOL = [dots, dots, dots, '.....kk.kk......', '...kkwwkwwkk....', '..kwwwwwwwwxk...', '.kwwxwwwwxwwxk..', '.kwwwwwxwwwwxk..', '.kxwwwwwwwwxxk..', '..kwwxwwwxwxk...', '...kkxxkxxkk....', '.....kk.kk......', dots, dots, dots, dots];
const TRUFFLE = [dots, dots, dots, dots, dots, '.....kkkkk......', '....knNnNnk.....', '...knNNnNNnk....', '...kNnNNnNNk....', '...knNnNNnNk....', '....kNNnNNk.....', '.....kkkkk......', dots, dots, dots, dots];
const HAY = [dots, dots, dots, '..k.k..k.k..k...', '..kykykkykykk...', '.kyyYyyyYyyYk...', '.kyYyyYyyYyyk...', '.kkkkkkkkkkkk...', '.kyyYyyYyyyYk...', '.kyYyyyYyyYyk...', '.kkkkkkkkkkkk...', dots, dots, dots, dots, dots];
const FEATHER = [dots, dots, '..........kk....', '.........kwwk...', '........kwwxk...', '.......kwwxk....', '......kwwxk.....', '.....kwwxk......', '....kwwxk.......', '....kwxk........', '...kkkk.........', '..kk............', dots, dots, dots, dots];

const GEM_SHAPES: Record<string, string[]> = {
  ruby: [dots, dots, '....kkkkkkkk....', '...kwwbbbbBBk...', '..kwbbbbbbbBBk..', '..kbbbbbbbbbBk..', '..kbbbbbbbbBBk..', '..kbbbbbbbBBBk..', '...kbbbbbBBBk...', '....kbbbBBBk....', '.....kbBBBk.....', '......kBBk......', '.......kk.......', dots, dots, dots],
  sapphire: [dots, dots, '.......kk.......', '......kwbk......', '.....kwbbbk.....', '....kwbbbbbk....', '...kwbbbbbbBk...', '..kwbbbbbbbbBk..', '...kbbbbbbbBk...', '....kbbbbbBk....', '.....kbbbBk.....', '......kbBk......', '.......kk.......', dots, dots, dots],
  emerald: [dots, dots, '....kkkkkkkk....', '....kwwbbbBk....', '...kwbbbbbbBk...', '...kbbbbbbbBk...', '...kbbbbbbbBk...', '...kbbbbbbbBk...', '...kbbbbbbBBk...', '...kbbbbbBBBk...', '....kbbBBBBk....', '....kkkkkkkk....', dots, dots, dots, dots],
  topaz: [dots, dots, '.......kk.......', '......kwwk......', '.....kwbbBk.....', '.....kbbbBk.....', '....kwbbbbBk....', '....kbbbbbBk....', '...kwbbbbbbBk...', '...kbbbbbbbBk...', '..kbbbbbbbbBBk..', '..kkkkkkkkkkkk..', dots, dots, dots, dots],
  amethyst: [dots, dots, '.....kkkkkk.....', '....kwbbbbBk....', '...kwbbbbbbBk...', '..kwbbbbbbbbBk..', '..kbbbbbbbbbBk..', '..kbbbbbbbbbBk..', '..kbbbbbbbbBBk..', '...kbbbbbbBBk...', '....kbbbbBBk....', '.....kkkkkk.....', dots, dots, dots, dots],
  pearl: [dots, dots, dots, '.....kkkkkk.....', '....kwwbbbbk....', '...kwwbbbbbBk...', '...kwbbbbbbBk...', '...kbbbbbbbBk...', '...kbbbbbbBBk...', '...kbbbbbBBBk...', '....kbbBBBBk....', '.....kkkkkk.....', dots, dots, dots, dots],
};
const GEM_PAL: Record<string, [string, string]> = {
  ruby: ['#e0405a', '#8e1f36'], sapphire: ['#4a7fe8', '#22407f'], emerald: ['#3dc46a', '#1f6b3a'],
  topaz: ['#f2c14e', '#a8762a'], amethyst: ['#a66be0', '#5a2f8a'], pearl: ['#e8e4f4', '#9a94b0'],
};
const PET_EGG = [dots, dots, '......kkkk......', '.....kbbbbk.....', '....kbbaabbk....', '....kbaaabwk....', '...kbbbbbbbwk...', '...kbbaabbbbk...', '...kbaaaabbbk...', '...kbbaabbbBk...', '...kbbbbbaaBk...', '....kbbbbaBk....', '.....kkkkkk.....', dots, dots, dots];

export const CREATURES: Record<string, Art> = {
  fairy: { rows: FAIRY, pal: FAIRY_PAL },
  fairyCheer: { rows: FAIRY_CHEER, pal: FAIRY_PAL },
  fairySad: { rows: FAIRY_SAD, pal: FAIRY_PAL },

  // ---- pets: common ----
  'pet-bunny': { rows: critter({ top: 'long' }), pal: pal('#f4f0ea', '#c8c0b4', '#ffffff', '#f2a6b8') },
  'pet-frog': { rows: FROG, pal: pal('#6cc04a', '#3d8f3a', '#c8ec9a', '#3d8f3a') },
  'pet-hedgehog': { rows: critter({ top: 'small', fluffy: true }).map((r, y) => (y >= 5 && y <= 10 ? r.replace(/^(\.*)k/, (m, d) => (d.length ? d.slice(1) + 'kk' : 'k')) : r)), pal: pal('#c89a6a', '#7a5230', '#f1dcc0', '#5e3a24') },
  'pet-mouse': { rows: critter({ top: 'round', tail: 'tail' }), pal: pal('#b8b4c0', '#7d7888', '#ece8f0', '#f2a6b8') },
  'pet-turtle': { rows: TURTLE, pal: pal('#8bd14e', '#3d8f3a', '#d8ecb0', '#a8762a', { A: '#5e3a24' }) },
  'pet-snail': { rows: SNAIL, pal: pal('#e8d0a8', '#b89a6a', '#fff4dc', '#e8833a', { A: '#8d5217' }) },
  'pet-squirrel': { rows: critter({ top: 'small', tail: 'big' }), pal: pal('#c8743a', '#8d4a1f', '#f1d2a8', '#e09050') },
  'pet-duckling': { rows: DUCK, pal: pal('#ffe066', '#e0b030', '#fff4b0', '#e8833a') },
  // ---- uncommon ----
  'pet-fox': { rows: critter({ top: 'pointy', tail: 'big' }), pal: pal('#e8833a', '#a8501f', '#fff4dc', '#fff4dc') },
  'pet-owl': { rows: OWL, pal: pal('#a67c52', '#6b4a2e', '#e8d4b4', '#6b4a2e', { A: '#c8a478' }) },
  'pet-raccoon': { rows: critter({ top: 'round', face: 'mask', tail: 'tail' }), pal: pal('#9a96a4', '#5e5a6a', '#d8d4e0', '#3a3644') },
  'pet-penguin': { rows: PENGUIN, pal: pal('#3a4258', '#22283a', '#f4f4f8', '#f2a030') },
  'pet-bat': { rows: BAT, pal: pal('#6a5a8a', '#3e3458', '#8e7eb0', '#4a3e68') },
  // ---- rare ----
  'pet-redpanda': { rows: critter({ top: 'round', face: 'mask', tail: 'big' }), pal: pal('#c8502a', '#7d2f16', '#3a2418', '#fff4dc') },
  'pet-otter': { rows: critter({ top: 'small', tail: 'tail' }), pal: pal('#8a5a34', '#5e3a24', '#e8c89a', '#5e3a24') },
  'pet-wolfpup': { rows: critter({ top: 'pointy', tail: 'tail' }), pal: pal('#8c96ad', '#565e78', '#e8ecf4', '#d8dee9') },
  'pet-griffin': { rows: critter({ top: 'tufts', face: 'beak', wings: true }), pal: pal('#f2c14e', '#b7832f', '#fff4dc', '#a67c52') },
  // ---- ultra rare ----
  'pet-phoenix': { rows: critter({ top: 'crest', face: 'beak', wings: true, tail: 'big' }), pal: pal('#f05a28', '#a82a14', '#ffd23f', '#ffd23f') },
  'pet-unicorn': { rows: critter({ top: 'horn', tail: 'big' }), pal: pal('#ffffff', '#d8d0f0', '#fff4ff', '#f2a6e8') },
  'pet-kitsune': { rows: critter({ top: 'pointy', tail: 'nine' }), pal: pal('#fff4dc', '#e0c8a0', '#ffffff', '#e8833a') },

  // ---- homestead animals ----
  'animal-dog': { rows: critter({ top: 'floppy', tail: 'tail' }), pal: pal('#c89a5a', '#8d6a3a', '#f1dcc0', '#7a5230') },
  'animal-cat': { rows: critter({ top: 'pointy', tail: 'tail', face: 'normal' }), pal: pal('#9a9aa8', '#6a6a78', '#e0e0e8', '#f2a6b8') },
  'animal-cow': { rows: critter({ top: 'horns', face: 'snout', spots: true }), pal: pal('#f4f4f4', '#c0c0c8', '#ffffff', '#f2a6b8', { A: '#2a2430' }) },
  'animal-chicken': { rows: critter({ top: 'comb', face: 'beak', belly: false }), pal: pal('#ffffff', '#d8d8e0', '#ffffff', '#e8833a') },
  'animal-sheep': { rows: critter({ top: 'small', fluffy: true, face: 'normal' }), pal: pal('#f4f0e8', '#c8c0b0', '#ffffff', '#3a3040') },
  'animal-pig': { rows: critter({ top: 'small', face: 'snout', tail: 'tail', belly: false }), pal: pal('#f4a6b4', '#c87080', '#ffc8d0', '#e08090') },
  'animal-goat': { rows: critter({ top: 'horns', face: 'normal' }), pal: pal('#e8dcc8', '#b0a088', '#fff4e8', '#8d6a3a') },
  'animal-horse': { rows: critter({ top: 'mane', tail: 'big' }), pal: pal('#a8683a', '#6b3e1f', '#d8a878', '#3a2418') },

  // ---- monsters ----
  'mob-slime': { rows: SLIME, pal: pal('#6cd068', '#3a8a3a', '#ffffff', '#ffffff') },
  'mob-slimeBlue': { rows: SLIME, pal: pal('#5ab0f0', '#2a6aa8', '#ffffff', '#ffffff') },
  'mob-bat': { rows: BAT, pal: pal('#5a4a6a', '#2e2438', '#e05a5a', '#3a2e48', { e: '#e05a5a' }) },
  'mob-skeleton': { rows: SKELETON, pal: pal('#f4f0e8', '#c8c0b0', '#ffffff', '#ffffff', { w: '#ece6d8', r: '#e05a5a' }) },
  'mob-ghost': { rows: GHOST, pal: pal('#d8e4f4', '#a8b8d0', '#ffffff', '#ffffff') },
  'mob-mushroom': { rows: MUSHROOM, pal: pal('#f1dcc0', '#c8a478', '#ffffff', '#d94848') },
  'mob-wolf': { rows: critter({ top: 'pointy', face: 'angry', tail: 'tail', belly: false }), pal: pal('#6a6a7a', '#3a3a48', '#a8a8b8', '#4a4a58') },
  'mob-golem': { rows: GOLEM, pal: pal('#9a96a4', '#5e5a6a', '#c8c4d0', '#5e5a6a', { c: '#7fe3f2' }) },
  'mob-mimic': { rows: MIMIC, pal: { ...base, n: '#9a6339', N: '#5e3a24', m: '#d94848', w: '#ffffff' } },
  'mob-wisp': { rows: WISP, pal: { ...base, y: '#9fe8f5', x: '#e0f8ff' } },

  // ---- crops and products ----
  'crop-plant': { rows: PLANT, pal: { ...base, g: '#8bd14e', G: '#3d8f3a' } },
  'crop-tomato': { rows: TOMATO, pal: { ...base, g: '#8bd14e', r: '#e0402a', R: '#9a2418' } },
  'crop-strawberry': { rows: STRAWBERRY, pal: { ...base, g: '#8bd14e', r: '#e8304a', y: '#ffe0a0' } },
  'crop-corn': { rows: CORN, pal: { ...base, g: '#8bd14e', G: '#3d8f3a', y: '#ffd23f', Y: '#e0a020' } },
  'crop-cabbage': { rows: CABBAGE, pal: { ...base, g: '#8bd14e', G: '#3d8f3a', l: '#d8f0b0' } },
  'crop-potato': { rows: POTATO, pal: { ...base, a: '#c8945a', A: '#8d6030' } },
  'item-egg': { rows: EGG, pal: { ...base, w: '#fffaf0', x: '#e8dcc8' } },
  'item-milk': { rows: MILK, pal: { ...base, w: '#ffffff', x: '#d8e0ec', b: '#5b8ee1' } },
  'item-wool': { rows: WOOL, pal: { ...base, w: '#ffffff', x: '#d8d0c4' } },
  'item-truffle': { rows: TRUFFLE, pal: { ...base, n: '#6b4a2e', N: '#3e2818' } },
  'item-hay': { rows: HAY, pal: { ...base, y: '#f2d06e', Y: '#c89a3a' } },
  'item-feather': { rows: FEATHER, pal: { ...base, w: '#ffffff', x: '#c8d8f0' } },
};
for (const [g, shape] of Object.entries(GEM_SHAPES)) CREATURES['gem-' + g] = { rows: shape, pal: { ...base, b: GEM_PAL[g][0], B: GEM_PAL[g][1], w: '#ffffff' } };
const EGG_COLORS: Record<string, [string, string, string]> = { common: ['#f4ecd8', '#8bd14e', '#c8bca0'], uncommon: ['#e8f0fa', '#5b8ee1', '#b4c4dc'], rare: ['#f0e8fa', '#a66be0', '#c4b0dc'], ultra: ['#fff4c8', '#e8833a', '#e0b040'] };
for (const [r, [b, a, B]] of Object.entries(EGG_COLORS)) CREATURES['egg-' + r] = { rows: PET_EGG, pal: { ...base, b, a, B, w: '#ffffff' } };

/** Pixel-art rows shifted up by one (a breathing bob) and with eyes closed (a blink). */
export function bobRows(rows: string[]) { return [...rows.slice(1), dots]; }
export function blinkRows(rows: string[]) { return rows.map((r) => r.replace(/e/g, 'k')); }

/** A "shiny" palette: hues rotated, a little brighter. */
export function shinyPalette(p: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) {
    if (k === 'k' || k === 'e' || k === 'n' || k === 'w' || !/^#[0-9a-f]{6}$/i.test(v)) { out[k] = v; continue; }
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    // greys and whites get a pale gold / lilac tint, colours rotate by 150 degrees
    const nh = s < 0.12 ? 0.13 : (h + 150 / 360) % 1;
    const ns = s < 0.12 ? 0.55 : Math.min(1, s * 1.1 + 0.05);
    const nl = Math.min(0.92, l * 1.05 + 0.03);
    const q = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns, pp = 2 * nl - q;
    const hue = (t: number) => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
    out[k] = '#' + [hue(nh + 1 / 3), hue(nh), hue(nh - 1 / 3)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  }
  return out;
}
