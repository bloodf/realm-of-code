// Syntax highlighting tokens (no React): used to draw code in the game engine.
import type { CodeLang } from '../course/types';

const JS_KW = 'const|let|var|function|return|if|else|for|while|do|of|in|new|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|switch|case|break|continue|true|false|null|undefined|this|interface|type|implements|private|public|readonly';
const SQL_KW = 'SELECT|FROM|WHERE|AND|OR|NOT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|NULL|IS|LIKE|IN|BETWEEN|ASC|DESC|INTEGER|TEXT|REAL|UNIQUE|DEFAULT|INDEX|DROP|ALTER|ADD|CASE|WHEN|THEN|END';

type Rule = [RegExp, string];

const RULES: Partial<Record<CodeLang, Rule[]>> = {
  js: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, 'c'], [/`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y, 's'],
    [new RegExp(`\\b(?:${JS_KW})\\b`, 'y'), 'k'], [/\b\d+(?:\.\d+)?\b/y, 'n'], [/[A-Za-z_$][\w$]*(?=\s*\()/y, 'f'],
  ],
  html: [
    [/<!--[\s\S]*?-->/y, 'c'], [/<\/?[A-Za-z][\w-]*|\/?>/y, 't'], [/"[^"]*"|'[^']*'/y, 's'], [/\b[a-zA-Z-:@]+(?==)/y, 'a'],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//y, 'c'], [/"[^"]*"|'[^']*'/y, 's'], [/[a-z-]+(?=\s*:[^:])/y, 'p'], [/#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|s|fr|vh|vw)?\b/y, 'n'], [/@[a-z-]+/y, 'k'],
  ],
  sql: [
    [/--[^\n]*/y, 'c'], [/'(?:''|[^'])*'/y, 's'], [new RegExp(`\\b(?:${SQL_KW})\\b`, 'iy'), 'k'], [/\b\d+(?:\.\d+)?\b/y, 'n'],
  ],
  bash: [[/#[^\n]*/y, 'c'], [/"[^"]*"|'[^']*'/y, 's'], [/(?<=^|\n|\$ )[a-z][\w-]*/y, 'f'], [/\s-{1,2}[a-zA-Z-]+/y, 'k']],
  json: [[/"(?:\\.|[^"\\])*"(?=\s*:)/y, 'p'], [/"(?:\\.|[^"\\])*"/y, 's'], [/\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/y, 'n']],
};
const PY_KW = 'def|return|if|elif|else|for|while|in|not|and|or|import|from|as|class|try|except|finally|raise|with|lambda|pass|break|continue|True|False|None|is|global|yield|async|await|self';
RULES.py = [[/#[^\n]*/y, 'c'], [/f?"""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*'/y, 's'], [new RegExp(`\\b(?:${PY_KW})\\b`, 'y'), 'k'], [/\b\d+(?:\.\d+)?\b/y, 'n'], [/[A-Za-z_]\w*(?=\s*\()/y, 'f']];
const PHP_KW = 'echo|print|function|return|if|elseif|else|for|foreach|as|while|do|class|new|public|private|protected|static|array|true|false|null|TRUE|FALSE|NULL|isset|empty|require|include|namespace|use|fn|match|try|catch|throw';
RULES.php = [[/\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//y, 'c'], [/<\?php|\?>/y, 't'], [/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y, 's'], [/\$[A-Za-z_]\w*/y, 'a'], [new RegExp(`\\b(?:${PHP_KW})\\b`, 'y'), 'k'], [/\b\d+(?:\.\d+)?\b/y, 'n'], [/[A-Za-z_]\w*(?=\s*\()/y, 'f']];
RULES.ts = RULES.js; RULES.jsx = [...RULES.html!.slice(0, 1), ...RULES.js!, [/<\/?[A-Za-z][\w.]*|\/?>/y, 't']];
RULES.vue = [...RULES.html!, [/\{\{|\}\}/y, 'k']]; RULES.svelte = [...RULES.html!, [/\{[#/:@][a-z]+/y, 'k']];

export const TOKEN_COLORS: Record<string, string> = { '': '#f3e9d2', k: '#f29e6d', s: '#a8d66f', n: '#e6a3ff', c: '#9a8468', t: '#f29e6d', a: '#ffd479', f: '#ffd479', p: '#9fd3e8' };

export interface Token { text: string; cls: string }

export function tokenize(code: string, lang: CodeLang = 'js'): Token[] {
  const rules = RULES[lang];
  if (!rules) return [{ text: code, cls: '' }];
  const out: Token[] = [];
  let i = 0, plain = '';
  const flush = () => { if (plain) { out.push({ text: plain, cls: '' }); plain = ''; } };
  while (i < code.length) {
    let hit = false;
    for (const [re, cls] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i && m[0].length) { flush(); out.push({ text: m[0], cls }); i += m[0].length; hit = true; break; }
    }
    if (!hit) { plain += code[i]; i++; }
  }
  flush();
  return out;
}

/** Tokens split into lines (for drawing line by line). */
export function tokenLines(code: string, lang: CodeLang = 'js'): Token[][] {
  const lines: Token[][] = [[]];
  for (const t of tokenize(code, lang)) {
    const parts = t.text.split('\n');
    parts.forEach((p, i) => { if (i > 0) lines.push([]); if (p) lines[lines.length - 1].push({ text: p, cls: t.cls }); });
  }
  return lines;
}
