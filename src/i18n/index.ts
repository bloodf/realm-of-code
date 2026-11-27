// Translations (English, Portuguese, Spanish).
//
// Text is written in English in the code. Instead of wrapping every string by hand, the
// game translates at the places where text is drawn: every Phaser Text object, every
// rich-text (markdown) texture and every DOM input placeholder calls tr(). So menus,
// data (achievements, pets, items...), help pages and lesson content are translated
// wherever they are shown.
//
// The dictionaries live in i18n/<lang>/*.txt (one entry per English string, keyed by a
// hash of the English text) and are compiled by `npm run i18n` into
// src/i18n/gen/<lang>.json. Template strings like `${n} lessons done` become patterns
// ("{0} lessons done") so they translate too. Missing entries fall back to English.
// Call t('...', vars) for strings with named placeholders; untranslated(() => ...) for
// text that must stay as it is (code).
import PATTERNS from './gen/patterns.json';
import { hashKey } from './hash';

export type Lang = 'en' | 'pt' | 'es';
export const LANGS: { id: Lang; name: string; flag: string }[] = [
  { id: 'en', name: 'English', flag: 'EN' },
  { id: 'pt', name: 'Português', flag: 'PT' },
  { id: 'es', name: 'Español', flag: 'ES' },
];

let cur: Lang = 'en';
let dict: Record<string, string> = {};
let raw = 0;
const cache = new Map<string, string>();
const missing = new Set<string>();
let outputs = new Set<string>();   // translated strings (drawing them again must not count as missing)
interface Pat { re: RegExp; out: string; lit: number }
let pats: Pat[] = [];

export const getLang = () => cur;

/** Loads a language (the dictionaries are separate files, fetched on demand). */
export async function setLang(l: Lang): Promise<void> {
  cur = l === 'pt' || l === 'es' ? l : 'en';
  dict = {};
  cache.clear();
  if (cur !== 'en') {
    try {
      const mod = cur === 'pt' ? await import('./gen/pt.json') : await import('./gen/es.json');
      dict = (mod.default ?? mod) as Record<string, string>;
    } catch { cur = 'en'; }
  }
  outputs = new Set(Object.values(dict));
  buildPatterns();
  if (typeof document !== 'undefined') document.documentElement.lang = cur === 'pt' ? 'pt-BR' : cur;
}

/** The browser's language, if we have it. */
export function detectLang(): Lang {
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  return n.startsWith('pt') ? 'pt' : n.startsWith('es') ? 'es' : 'en';
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildPatterns() {
  pats = [];
  if (cur === 'en') return;
  for (const en of PATTERNS as string[]) {
    const out = dict[hashKey(en)];
    if (!out) continue;
    const parts = en.split(/\{(\w+)\}/g);
    let src = '^';
    let lit = 0;
    const names: string[] = [];
    parts.forEach((p, i) => {
      if (i % 2) { src += '([\\s\\S]+?)'; names.push(p); } else { src += esc(p); lit += p.replace(/[^A-Za-z]/g, '').length; }
    });
    if (lit < 3) continue;
    // the translation refers to placeholders by name; we capture them by position
    let o = out;
    names.forEach((n, i) => { o = o.split('{' + n + '}').join('\u0001' + i + '\u0002'); });
    pats.push({ re: new RegExp(src + '$'), out: o, lit });
  }
  pats.sort((a, b) => b.lit - a.lit);
}

/** Translates a finished string (no placeholders to fill). Used by the drawing code. */
export function tr(s: string): string {
  if (cur === 'en' || raw > 0 || !s || typeof s !== 'string') return s;
  const d = dict[hashKey(s)];
  if (d !== undefined) return d;
  const c = cache.get(s);
  if (c !== undefined) return c;
  if (outputs.has(s)) return s;
  const out = lookup(s);
  if (cache.size > 4000) cache.clear();
  cache.set(s, out);
  if (out !== s) { cache.set(out, out); outputs.add(out); }
  return out;
}

function lookup(s: string): string {
  // nothing to translate: numbers, symbols, a single code span
  if (!/[A-Za-z]{2}/.test(s) || /^`[^`]*`$/.test(s)) return s;
  // keep outer spaces
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s)!;
  if (m[1] || m[3]) {
    const d = dict[hashKey(m[2])];
    if (d !== undefined) return m[1] + d + m[3];
  }
  // templates: "{0}/{1} lessons done"
  for (const p of pats) {
    const mm = p.re.exec(s);
    if (!mm) continue;
    return p.out.replace(/\u0001(\d+)\u0002/g, (_, i) => tr(mm[+i + 1]));
  }
  // a core wrapped in numbers, symbols or markdown: "1. Walk the village", "**Title**", "Hint · 3"
  const w = /^([^A-Za-zÀ-ÿ`]*?)((?:\*\*)?)([A-Za-zÀ-ÿ`][\s\S]*?[A-Za-zÀ-ÿ.!?`)]?)(\2)([^A-Za-zÀ-ÿ`]*)$/.exec(s);
  if (w && (w[1] || w[2] || w[5])) {
    const core = dict[hashKey(w[3])];
    if (core !== undefined) return w[1] + w[2] + core + w[4] + w[5];
  }
  // parts joined with a separator: "Full-Stack Developer · React + Node.js", "Lightbulb: A hint"
  for (const sep of [' · ', ': ', ' - ', ' — ']) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep);
    const outParts = parts.map((p) => tr(p));
    if (outParts.some((p, i) => p !== parts[i])) return outParts.join(sep);
  }
  // prose around code blocks: translate the prose only
  if (s.includes('```')) {
    const parts = s.split(/(```[\s\S]*?```)/);
    if (parts.length > 1) {
      const outParts = parts.map((p, i) => (i % 2 ? p : tr(p)));
      if (outParts.some((p, i) => p !== parts[i])) return outParts.join('');
    }
    return s;
  }
  // several paragraphs or lines joined together
  if (s.includes('\n')) {
    const sep = s.includes('\n\n') ? '\n\n' : '\n';
    const parts = s.split(sep);
    if (parts.length > 1) {
      const outParts = parts.map((p) => tr(p));
      if (outParts.some((p, i) => p !== parts[i])) return outParts.join(sep);
    }
  }
  if (missing.size < 5000) missing.add(s);
  return s;
}

/** Translates a string with named placeholders: t('{n} lessons', { n: 5 }). */
export function t(s: string, vars?: Record<string, string | number>): string {
  if (cur === 'en') return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
  let out = dict[hashKey(s)];
  if (out === undefined) { out = s; if (missing.size < 5000 && /[A-Za-z]{3}/.test(s)) missing.add(s); }
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (typeof vars[k] === 'string' ? tr(vars[k] as string) : String(vars[k])) : m));
  if (outputs.size < 50000) outputs.add(out);
  return out;
}
/** Singular or plural: tn(n, '{n} lesson', '{n} lessons'). */
export const tn = (n: number, one: string, many: string, vars: Record<string, string | number> = {}) => t(n === 1 ? one : many, { n, ...vars });

/** Translated and in capitals (buttons, headings). */
export function up(s: string): string {
  const o = tr(s).toUpperCase();
  if (cur !== 'en' && outputs.size < 50000) outputs.add(o);
  return o;
}

/** Runs fn with translation switched off (for code, names, things typed by the player). */
export function untranslated<T>(fn: () => T): T {
  raw++;
  try { return fn(); } finally { raw--; }
}

/** True when a string has a translation (used by the coverage test). */
export const has = (s: string) => cur === 'en' || tr(s) !== s;
/** Strings that were drawn but have no translation (for the i18n bot). */
export const missingStrings = () => [...missing];
