// Game rules and content for the minigames (no UI): archery rounds, the SQL query
// generator, the loop generator and the bug hunt round type.
import type { CodeLang } from '../course/types';
import { shuffle } from './pools';

export interface BugRound { code: string; line: number; also?: number; why: string; lang?: CodeLang }

// ---------------- Selector Archery ----------------
export interface Round { html: string; concept: string; answer: string }
// Elements marked with data-t are the targets.
export const ROUNDS: Round[] = [
  { html: '<goblin data-t></goblin><goblin data-t></goblin><goblin data-t></goblin>', concept: 'A **type selector** is just the tag name: `goblin`', answer: 'goblin' },
  { html: '<coin></coin><gem data-t></gem><coin></coin><gem data-t></gem>', concept: 'Pick only one kind of tag by its name.', answer: 'gem' },
  { html: '<coin class="gold" data-t></coin><coin></coin><coin class="gold" data-t></coin>', concept: 'A **class selector** starts with a dot: `.gold`', answer: '.gold' },
  { html: '<key></key><key id="king" data-t></key><key></key>', concept: 'An **id selector** starts with a hash: `#king`', answer: '#king' },
  { html: '<chest><gem data-t></gem></chest><gem></gem><gem></gem>', concept: 'A **descendant selector** has a space: `chest gem` means "a gem inside a chest".', answer: 'chest gem' },
  { html: '<rack><coin data-t></coin><coin data-t></coin></rack><chest><coin></coin></chest>', concept: 'Same idea: only coins that are inside a rack.', answer: 'rack coin' },
  { html: '<goblin class="cursed" data-t></goblin><gem class="cursed"></gem><goblin></goblin>', concept: 'Join a tag and a class with no space: `goblin.cursed`', answer: 'goblin.cursed' },
  { html: '<scroll></scroll><key data-t></key><gem></gem><coin data-t></coin>', concept: 'A **comma** groups selectors: `key, coin`', answer: 'key, coin' },
  { html: '<rack><gem data-t></gem><gem></gem><gem></gem></rack>', concept: 'Pseudo-classes pick by position: `:first-child`', answer: 'gem:first-child' },
  { html: '<rack><coin></coin><coin></coin><coin data-t></coin><coin></coin></rack>', concept: '`:nth-child(n)` picks the n-th child (counting from 1).', answer: 'coin:nth-child(3)' },
  { html: '<coin class="gold"></coin><coin data-t></coin><coin class="gold"></coin><coin data-t></coin>', concept: '`:not(...)` excludes things: `coin:not(.gold)`', answer: 'coin:not(.gold)' },
  { html: '<rack><scroll></scroll><gem></gem><scroll data-t></scroll><key></key><scroll></scroll></rack>', concept: 'The **adjacent sibling** `+` means "right after": `gem + scroll`', answer: 'gem + scroll' },
];

/** Path stops use 6 rounds that fit the unit; the arcade uses all 12. */
export function archeryRounds(stop: boolean, unitIndex: number): Round[] {
  if (!stop) return ROUNDS;
  const upto = Math.min(ROUNDS.length, 6 + unitIndex * 2);
  const pool = ROUNDS.slice(0, upto);
  const keep = new Set<number>();
  while (keep.size < Math.min(6, pool.length)) keep.add(Math.floor(Math.random() * pool.length));
  return [...keep].sort((a, b) => a - b).map((i) => pool[i]);
}


// ---------------- Archive Hunt ----------------
export interface Knight { id: number; name: string; class: string; gold: number; level: number; city: string }
export const KNIGHTS: Knight[] = [
  { id: 1, name: 'Ada', class: 'mage', gold: 120, level: 5, city: 'Camelot' },
  { id: 2, name: 'Bors', class: 'knight', gold: 40, level: 3, city: 'Avalon' },
  { id: 3, name: 'Cai', class: 'ranger', gold: 75, level: 4, city: 'Camelot' },
  { id: 4, name: 'Dagon', class: 'knight', gold: 200, level: 7, city: 'Tintagel' },
  { id: 5, name: 'Elaine', class: 'mage', gold: 15, level: 2, city: 'Avalon' },
  { id: 6, name: 'Fenn', class: 'ranger', gold: 95, level: 6, city: 'Tintagel' },
  { id: 7, name: 'Gwen', class: 'knight', gold: 60, level: 5, city: 'Camelot' },
  { id: 8, name: 'Hal', class: 'mage', gold: 180, level: 8, city: 'Avalon' },
];
export const COLS: (keyof Knight)[] = ['id', 'name', 'class', 'gold', 'level', 'city'];

export interface Query { sql: string; ids: number[]; ordered?: boolean }

type Cond = { sql: string; f: (k: Knight) => boolean };
const pickOf = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function simple(): Cond {
  const t = Math.floor(Math.random() * 5);
  if (t === 0) { const n = pickOf([50, 70, 100, 150]); return { sql: `gold > ${n}`, f: (k) => k.gold > n }; }
  if (t === 1) { const c = pickOf(['mage', 'knight', 'ranger']); return { sql: `class = '${c}'`, f: (k) => k.class === c }; }
  if (t === 2) { const n = pickOf([3, 4, 5, 6]); return { sql: `level < ${n}`, f: (k) => k.level < n }; }
  if (t === 3) { const c = pickOf(['Camelot', 'Avalon', 'Tintagel']); return { sql: `city = '${c}'`, f: (k) => k.city === c }; }
  const n = pickOf([4, 5, 6]); return { sql: `level >= ${n}`, f: (k) => k.level >= n };
}

/** Builds a query for a round. `knows` says which SQL words the player has met. */
export function makeQuery(round: number, knows: (w: string) => boolean): Query {
  for (let attempt = 0; attempt < 50; attempt++) {
    const kinds: string[] = ['simple'];
    if (round >= 1 && knows('AND')) kinds.push('and');
    if (round >= 1 && knows('OR')) kinds.push('or');
    if (round >= 2 && knows('IN')) kinds.push('in');
    if (round >= 2 && knows('BETWEEN')) kinds.push('between');
    if (round >= 2 && knows('LIKE')) kinds.push('like');
    if (round >= 3 && knows('NOT')) kinds.push('not');
    if (round >= 3 && knows('LIMIT') && knows('ORDER BY')) kinds.push('top');
    const kind = round === 0 ? 'simple' : pickOf(kinds.length > 1 ? kinds.slice(1) : kinds);
    let c: Cond;
    let ordered = false;
    let tail = '';
    let rows = KNIGHTS;
    if (kind === 'and') { const a = simple(); const b = simple(); c = { sql: `${a.sql} AND ${b.sql}`, f: (k) => a.f(k) && b.f(k) }; }
    else if (kind === 'or') { const a = simple(); const b = simple(); c = { sql: `${a.sql} OR ${b.sql}`, f: (k) => a.f(k) || b.f(k) }; }
    else if (kind === 'in') { const cs = shuffle(['Camelot', 'Avalon', 'Tintagel']).slice(0, 2); c = { sql: `city IN ('${cs.join("', '")}')`, f: (k) => cs.includes(k.city) }; }
    else if (kind === 'between') { const a = pickOf([20, 50, 60]); const b = a + pickOf([50, 80, 120]); c = { sql: `gold BETWEEN ${a} AND ${b}`, f: (k) => k.gold >= a && k.gold <= b }; }
    else if (kind === 'like') { const l = pickOf(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']); const m = pickOf(['%', '%a%', '%n']); const re = new RegExp('^' + (m === '%' ? l : '') + (m === '%a%' ? '.*a' : m === '%n' ? '.*n$' : ''), 'i'); c = m === '%' ? { sql: `name LIKE '${l}%'`, f: (k) => re.test(k.name) } : { sql: `name LIKE '${m}'`, f: (k) => (m === '%a%' ? /a/i.test(k.name) : /n$/i.test(k.name)) }; }
    else if (kind === 'not') { const a = simple(); c = { sql: `NOT ${a.sql}`, f: (k) => !a.f(k) }; }
    else if (kind === 'top') {
      const a = simple(); const dir = pickOf(['DESC', 'ASC']); const col = pickOf(['gold', 'level'] as const); const n = pickOf([2, 3]);
      c = a; ordered = true;
      tail = `\nORDER BY ${col} ${dir}\nLIMIT ${n}`;
      rows = KNIGHTS.filter(a.f).sort((x, y) => (dir === 'DESC' ? y[col] - x[col] : x[col] - y[col]) || x.id - y.id);
      if (new Set(rows.map((r) => r[col])).size !== rows.length) continue;   // avoid ties
      rows = rows.slice(0, n);
      const ids = rows.map((r) => r.id);
      if (ids.length < 1) continue;
      return { sql: `SELECT name\nFROM knights\nWHERE ${c.sql}${tail};`, ids, ordered };
    }
    else c = simple();
    const ids = rows.filter(c.f).map((r) => r.id);
    if (ids.length === 0 || ids.length === KNIGHTS.length) continue;   // keep it interesting
    return { sql: `SELECT name\nFROM knights\nWHERE ${c.sql};`, ids, ordered };
  }
  return { sql: "SELECT name\nFROM knights\nWHERE class = 'mage';", ids: [1, 5, 8] };
}


// ---------------- Loop Bridge ----------------
export interface LoopRound { code: string; count: number }
const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const body = '  bridge.addPlank();';

/** Counts planks by running the loop (so the answer is always right). */
export function countPlanks(code: string): number {
  let n = 0;
  new Function('bridge', code)({ addPlank: () => { n++; if (n > 50) throw new Error('too many'); } });
  return n;
}

const TIERS: ((knows: (w: string) => boolean) => string | null)[] = [
  () => { const n = r(2, 7); return `for (let i = 0; i < ${n}; i++) {\n${body}\n}`; },
  () => { const n = r(2, 6); return Math.random() < 0.5 ? `for (let i = 1; i <= ${n}; i++) {\n${body}\n}` : `for (let i = 0; i <= ${n}; i++) {\n${body}\n}`; },
  () => { const n = r(5, 9); return Math.random() < 0.5 ? `for (let i = 0; i < ${n}; i += 2) {\n${body}\n}` : `for (let i = ${n}; i > 0; i--) {\n${body}\n}`; },
  (k) => k('while') ? (Math.random() < 0.5
    ? `let planks = 0;\nwhile (planks < ${r(3, 7)}) {\n${body}\n  planks++;\n}`
    : `let wood = ${r(9, 12)};\nwhile (wood >= 3) {\n${body}\n  wood -= 3;\n}`) : null,
  (k) => k('of') ? `const logs = [${shuffle(['"oak"', '"pine"', '"ash"', '"elm"', '"yew"', '"fir"']).slice(0, r(3, 6)).join(', ')}];\nfor (const log of logs) {\n${body}\n}` : null,
  () => `for (let row = 0; row < ${r(2, 3)}; row++) {\n  for (let col = 0; col < ${r(2, 3)}; col++) {\n  ${body}\n  }\n}`,
];

export function makeLoop(round: number, knows: (w: string) => boolean): LoopRound {
  const want = [0, 1, 1, 2, 3, 4, 5, 2][round] ?? 2;
  for (let t = want; t >= 0; t--) {
    const code = TIERS[t](knows);
    if (code) return { code, count: countPlanks(code) };
  }
  const code = `for (let i = 0; i < 4; i++) {\n${body}\n}`;
  return { code, count: 4 };
}

export function optionsFor(n: number): number[] {
  const set = new Set([n, n + 1, Math.max(0, n - 1), n + 2, Math.max(0, n - 2)]);
  const others = shuffle([...set].filter((x) => x !== n)).slice(0, 3);
  return shuffle([n, ...others]);
}

