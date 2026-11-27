// Translation tooling.
//   node scripts/i18n.cjs extract   finds every piece of English text in src/ and writes the
//                                   catalogue i18n/en/<group>.txt (one entry per string)
//   node scripts/i18n.cjs build     compiles i18n/<lang>/*.txt into src/i18n/gen/<lang>.json,
//                                   checks each translation and prints the coverage
//   node scripts/i18n.cjs check     like build, but writes nothing and fails (exit 1) on problems
//   node scripts/i18n.cjs todo <group> [max] prints the entries of a group still to translate
//
// File format (catalogue and translations):   @@ <key>            (key = hash of the English)
//                                              text (may span several lines)
// i18n/pt-es/<group>.txt holds both languages:  @@ <key>
//                                              Portuguese text
//                                              ~~
//                                              Spanish text
// A translation must keep the same {placeholders} and `code spans` as the English.
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIR = path.join(ROOT, 'i18n');
const LANGS = ['pt', 'es'];

function hashKey(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ---------------------------------------------------------------- extraction
const SKIP_FILES = [/^dev\//, /^debug\.ts$/, /^i18n\//, /^pixel\/(?!art\.ts)/, /^scenes\/Verify\.ts$/, /\.worker\.ts$/, /^runners\/poly\.ts$/, /^audio\//, /^engine\/textures\.ts$/, /^lib\/tokens\.ts$/, /^ui\/(draw|editorTheme|theme)\.ts$/, /^grid\//, /^vite-env/];

function groupOf(rel) {
  let m;
  if ((m = /^course\/courses\/(\w+)\.ts$/.exec(rel))) return 'course-' + m[1];
  if ((m = /^content\/lessons\/(\w+)\.ts$/.exec(rel))) return 'code-' + m[1];
  if (/^farm\//.test(rel)) return 'farm';
  if (rel === 'scenes/help/content.ts') return 'help';
  if (rel === 'game/achievements.ts') return 'achievements';
  if (/^(game\/(items|quests|petData|pets|home|battle)|games\/|course\/(paths|adaptive)|pixel\/art|world\/buildings)/.test(rel)) return 'data';
  if (/^(runners|engine|lesson)\//.test(rel)) return 'runtime';
  if (/^scenes\/dev\//.test(rel)) return 'dev';
  return 'ui';
}

// object properties whose value is never shown as text
const SKIP_PROPS = new Set(['id', 'sprite', 'icon', 'art', 'kind', 'variant', 'color', 'colors', 'frame', 'lang', 't', 'cls', 'scene', 'target', 'ui', 'go', 'biome', 'emblem', 'route', 'key', 'font', 'fontFamily', 'fontStyle', 'fontSize', 'align', 'product', 'eats', 'uid', 'course', 'courseId', 'game', 'metric', 'tier', 'cat', 'rarity', 'mobs', 'boss', 'region', 'code', 'files', 'solution', 'starter', 'expected', 'schema', 'seed', 'sql', 'html', 'css', 'js', 'answers', 'distractors', 'lines', 'query', 'cmd', 'commands', 'path', 'file', 'layers', 'tunic', 'avatar', 'cursor', 'type', 'mode', 'accept', 'anim', 'crop', 'animal', 'food', 'foods', 'metric', 'stroke', 'backgroundColor', 'shadow', 'src', 'href', 'rel', 'ground', 'road', 'decos', 'flowers', 'pool', 'animated', 'sky', 'hills', 'palette', 'rows', 'map', 'tiles', 'start', 'fs', 'cwd', 'home', 'user', 'shell', 'entry', 'main', 'template', 'mount', 'preview', 'run', 'check', 'setup', 'db', 'table', 'tables', 'name_', 'element', 'selector', 'sel', 'event', 'prop', 'cssProp', 'value', 'word', 'words', 'token', 'tokens', 'glyph', 'char', 'letter', 'output', 'out', 'stdout', 'probe', 'needs', 'requires', 'after', 'before', 'to', 'from', 'flag', 'slot', 'dir', 'facing', 'tool', 'item', 'items', 'reward', 'tag', 'tags', 'ext', 'mime', 'accepted', 'regex', 'pattern', 'forbid', 'must', 'gem', 'gems', 'pet', 'species', 'mob', 'music', 'sound', 'sfx']);
// functions whose string arguments are ids, code or keys (index list, or 'all')
const SKIP_CALLS = {
  go: 'all', play: 'all', spriteTex: 'all', iconTex: 'all', sprite: [3], anim: 'all', emit: 'all', on: 'all', once: 'all', off: 'all',
  getElementById: 'all', querySelector: 'all', querySelectorAll: 'all', $: 'all', $$: 'all', setItem: 'all', getItem: 'all', removeItem: 'all',
  createElement: 'all', add: 'all', remove: 'all', toggle: 'all', contains: 'all', addEventListener: 'all', removeEventListener: 'all', RegExp: 'all',
  log: 'all', warn: 'all', error: 'all', require: 'all', load: 'all', exists: 'all', start: 'all', run: 'all', stop: 'all', launch: 'all', isActive: 'all',
  bringToTop: 'all', sleep: 'all', wake: 'all', setData: 'all', getData: 'all', unlock: 'all', bumpQuest: 'all', reg: 'all', has: 'all', includes: 'all',
  startsWith: 'all', endsWith: 'all', split: 'all', join: 'all', replace: 'all', replaceAll: 'all', match: 'all', test: 'all', indexOf: 'all', padStart: 'all',
  padEnd: 'all', get: 'all', set: 'all', delete: 'all', getScene: 'all', rect: 'all', click: 'all', setAttribute: 'all', getAttribute: 'all', hasAttribute: 'all',
  closest: 'all', matches: 'all', fetch: 'all', importScripts: 'all', postMessage: 'all', localeCompare: 'all', setLang: 'all', setPath: 'all', markTour: 'all',
  maybeTour: 'all', setHelpContext: 'all', startTour: 'all', noteStruggle: 'all', icon: [3], iconBtn: 'all', spriteKey: 'all', tex: 'all', texture: 'all',
  setTexture: 'all', addCanvas: 'all', addKey: 'all', keyboard: 'all', getComputedStyle: 'all', getPropertyValue: 'all', px: 'all', color: 'all', sameColor: 'all',
  src: 'all', uses: 'all', text_: 'all', txt: 'all', style: 'all', css: 'all', attr: 'all', val: 'all', typeIn: 'all', press: 'all', fire: 'all', dispatchEvent: 'all',
  Event: 'all', KeyboardEvent: 'all', MouseEvent: 'all', Error: 'none', hashKey: 'all', openHelp: 'all', pickGame: 'all', gameFor: 'all', giveEgg: 'all', buyEgg: 'all',
  plant: 'all', buySeed: 'all', buyAnimal: 'all', sell: 'all', feedPet: 'all', feedAnimal: 'all', shinyPalette: 'all', registerSprite: 'all', hex: 'all', N: 'all',
  shade: 'all', parseInt: 'all', Number: 'all', file: 'all', jsx: 'all', vue: 'all', svelte: 'all', page: 'all', html: 'all', style_: 'all', script: 'all', doc: 'all',
  probe: 'all', pyProbe: 'all', phpProbe: 'all', dbOf: 'all', table: 'all', fsOf: 'all', dirOf: 'all', mkFs: 'all', runSql: 'all', exec: 'all', prepare: 'all',
  setLocal: 'all', cell: 'all', row: 'all', word: 'all', mob: 'all', spawn: 'all', scaledMob: 'all', chance: 'all', tierOf: 'all',
  // content DSL: code arguments only (see DSL_SKIP)
};
const DSL_SKIP = { match: [], tf: [], mc: [], teach: [2, 3], mcc: [1], out: [0, 1], outPy: [0, 1], outPhp: [0, 1], fill: [1, 2, 3, 5], order: [1, 3], type: [1], bug: [1, 4], lesson: [0], unit: [0], challenge: [0], node: [0], code: [0], challengeOf: [], A: [] };

function calleeName(expr) {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return '';
}

function codeLike(s) {
  const prose = s.replace(/`[^`]*`/g, ' ').replace(/```[\s\S]*?```/g, ' ');
  if (!/[A-Za-z]{3}/.test(prose) && !/^[A-Z][a-z]?$/.test(s.trim())) return true;
  const t = s.trim();
  if (/^<[^>]+>[\s\S]*<\/[^>]+>$|^<[a-z!][^>]*>$/.test(t)) return true;              // html
  if (/^[.#]?[a-z][\w-]*\s*\{[\s\S]*\}$/.test(t)) return true;                             // css rule
  if (/(=>|\)\s*;|;\s*$|^\s*(const|let|var|function|import|export|return|if|for|while|def|class|echo|print)\b.*[(=;:{]|console\.log|SELECT .* FROM|\$\w+\s*=)/.test(t) && !/[.!?]$/.test(t) && !/\s[a-z]+\s[a-z]+\s[a-z]+/.test(prose)) return true;
  return false;
}

function prose(s) {
  if (!s || !/[A-Za-z]{2}/.test(s)) return false;
  const t = s.trim();
  if (!t) return false;
  if (/^(https?:|\.{0,2}\/|#\/|data:)|\.(png|jpe?g|js|ts|json|css|html|svg|mp3|wav|txt|md|py|php|sql|jsx|tsx|vue)$/i.test(t)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return false;
  if (!/\s/.test(t)) {
    // a single word: only capitalised words are labels ("Save", "Bunny"); the rest are ids
    if (!/^[A-Z][a-zà-ÿ]+[!?.:]?$|^[A-Z][a-z]+(-[A-Za-z]+)+$|^[A-Z]{2,}[a-z]*[!?]?$/.test(t)) return false;
    if (/^[A-Z]{2,}$/.test(t) && t.length <= 4) return false;                                // HTML, CSS, SQL
  }
  if (/^[\w.-]+(\.[\w-]+)+$/.test(t)) return false;                                         // a.b.c ids
  if (/^[a-z]+(:[\w.-]+)+$/.test(t)) return false;                                          // debug:Battle
  if (/^[a-z][\w]*(\.[\w$]+)*\(.*\)$/.test(t)) return false;                                 // fn(...)
  if (codeLike(s)) return false;
  return true;
}

function isTypePosition(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isTypeNode(p) && !ts.isTypeQueryNode(p)) return true;
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isImportTypeNode?.(p)) return true;
    if (ts.isStatement(p) || ts.isExpression(p) && !ts.isLiteralExpression(p) && p !== node.parent) break;
  }
  return false;
}

function skipByContext(node) {
  const p = node.parent;
  if (!p) return true;
  if (isTypePosition(node)) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isPropertyAssignment(p) && p.initializer === node) { const n = p.name.getText().replace(/['"]/g, ''); if (SKIP_PROPS.has(n)) return true; }
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return true;
  if (ts.isLiteralTypeNode(p) || ts.isEnumMember(p)) return true;
  // walk up through arrays/conditionals/parens to the call or property that owns the string
  let cur = node, up = p;
  while (up && (ts.isArrayLiteralExpression(up) || ts.isConditionalExpression(up) || ts.isParenthesizedExpression(up) || ts.isAsExpression(up) || (ts.isBinaryExpression(up) && up.operatorToken.kind === ts.SyntaxKind.BarBarToken) || (ts.isBinaryExpression(up) && up.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken))) {
    if (ts.isConditionalExpression(up) && up.condition === cur) return true;
    cur = up; up = up.parent;
  }
  if (up && ts.isPropertyAssignment(up) && up.initializer === cur) { const n = up.name.getText().replace(/['"]/g, ''); if (SKIP_PROPS.has(n)) return true; }
  if (up && (ts.isCallExpression(up) || ts.isNewExpression(up)) && up.arguments) {
    const name = calleeName(up.expression);
    const idx = up.arguments.indexOf(cur);
    if (name in DSL_SKIP) return DSL_SKIP[name].includes(idx);
    const rule = SKIP_CALLS[name];
    if (rule === 'all') return true;
    if (Array.isArray(rule) && rule.includes(idx)) return true;
  }
  if (up && ts.isPropertyAccessExpression(up)) return true;                                 // 'x'.length
  // inside tagged templates / regexps we never look
  return false;
}

// strings given to t(), tn(), up(), tr() and Blockly messages are always text
function forced(node) {
  const p = node.parent;
  if (p && ts.isCallExpression(p) && ['t', 'tn', 'up', 'tr'].includes(calleeName(p.expression))) return true;
  if (p && ts.isPropertyAssignment(p) && p.initializer === node && ['message0', 'message1'].includes(p.name.getText())) return true;
  return false;
}

function templateText(node) {
  // `${a} lessons done` -> "{0} lessons done"
  let s = node.head.text;
  node.templateSpans.forEach((sp, i) => { s += '{' + i + '}' + sp.literal.text; });
  return s;
}

function extract() {
  const files = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f)) files.push(p); } };
  walk(SRC);
  const groups = {};
  const seen = new Map();
  const patterns = new Set();
  // lesson content last: a string also used by the UI belongs to the UI group
  const late = (f) => (/[\\/](content|courses)[\\/]/.test(f) ? 1 : 0);
  for (const file of files.sort((a, b) => late(a) - late(b) || a.localeCompare(b))) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (SKIP_FILES.some((r) => r.test(rel))) continue;
    const g = groupOf(rel);
    const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const add = (s, node) => {
      if (!forced(node)) {
        if (!prose(s)) return;
        if (skipByContext(node)) return;
      } else if (!/[A-Za-z]{2}/.test(s)) return;
      if (seen.has(s)) return;
      seen.set(s, g);
      (groups[g] ??= []).push(s);
      if (/\{\w+\}/.test(s)) patterns.add(s);
    };
    const visit = (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node.text, node);
      else if (ts.isTemplateExpression(node)) {
        if (!(node.parent && ts.isTaggedTemplateExpression(node.parent))) add(templateText(node), node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  fs.mkdirSync(path.join(DIR, 'en'), { recursive: true });
  for (const f of fs.readdirSync(path.join(DIR, 'en'))) fs.unlinkSync(path.join(DIR, 'en', f));
  let total = 0;
  for (const [g, list] of Object.entries(groups)) {
    total += list.length;
    fs.writeFileSync(path.join(DIR, 'en', g + '.txt'), list.map((s) => `@@ ${hashKey(s)}\n${s}\n`).join(''));
  }
  fs.writeFileSync(path.join(SRC, 'i18n', 'gen', 'patterns.json'), JSON.stringify([...patterns].sort()));
  console.log(`${total} strings in ${Object.keys(groups).length} groups, ${patterns.size} patterns`);
  for (const [g, list] of Object.entries(groups).sort()) console.log(`  ${g.padEnd(18)} ${String(list.length).padStart(5)}  ${(list.join('').length / 1000).toFixed(1)}k chars`);
}

// ---------------------------------------------------------------- reading .txt files
function readEntries(file) {
  const out = [];
  if (!fs.existsSync(file)) return out;
  const txt = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const re = /^@@ (\S+)[^\n]*\n([\s\S]*?)(?=^@@ |(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(txt))) out.push([m[1], m[2].replace(/\n+$/, '')]);
  return out;
}
function catalogue() {
  const cat = new Map();
  const dir = path.join(DIR, 'en');
  for (const f of fs.readdirSync(dir).sort()) for (const [k, v] of readEntries(path.join(dir, f))) cat.set(k, { en: v, group: f.replace(/\.txt$/, '') });
  return cat;
}

const spans = (s) => (s.replace(/```[\s\S]*?```/g, '').match(/`[^`\n]+`/g) || []).sort().join('\u0000');
const holders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

function pseudo() {
  // every string wrapped in [[ ]] (placeholders kept): shows what is not translated yet
  const cat = catalogue();
  const dict = {};
  for (const [k, c] of cat) dict[k] = c.en.includes('```') ? c.en : '«' + c.en + '»';
  fs.writeFileSync(path.join(SRC, 'i18n', 'gen', 'pt.json'), JSON.stringify(dict));
  console.log('pseudo pt.json written');
}

/** All translation entries of a language: [file, key, text]. */
function langEntries(lang) {
  const out = [];
  const dir = path.join(DIR, lang);
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) for (const [k, v] of readEntries(path.join(dir, f))) out.push([lang + '/' + f, k, v]);
  const both = path.join(DIR, 'pt-es');
  // compact files: one line per entry, "key ¦ Portuguese ¦ Spanish"
  if (fs.existsSync(both)) for (const f of fs.readdirSync(both).filter((x) => x.endsWith('.tsv')).sort()) {
    for (const line of fs.readFileSync(path.join(both, f), 'utf8').split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue;
      const parts = line.split(' ¦ ');
      if (parts.length !== 3) { out.push(['pt-es/' + f, line.slice(0, 20), null]); continue; }
      out.push(['pt-es/' + f, parts[0].trim(), parts[lang === 'pt' ? 1 : 2].replace(/\\n/g, '\n')]);
    }
  }
  if (fs.existsSync(both)) for (const f of fs.readdirSync(both).filter((x) => x.endsWith('.txt')).sort()) for (const [k, v] of readEntries(path.join(both, f))) {
    const parts = v.split(/\n~~\n|^~~\n|\n~~$/);
    if (parts.length !== 2) { out.push(['pt-es/' + f, k, null]); continue; }
    out.push(['pt-es/' + f, k, parts[lang === 'pt' ? 0 : 1].replace(/\n+$/, '')]);
  }
  return out;
}

const fences = (s) => (s.match(/```[\s\S]*?```/g) || []).join('\u0000');

function build(write = true) {
  const cat = catalogue();
  const report = [];
  let failed = 0;
  for (const lang of LANGS) {
    const dict = {};
    const problems = [];
    const perGroup = {};
    {
      for (let [f, k, v] of langEntries(lang)) {
        if (v === null) { problems.push(`${f}: ${k} is malformed (needs "~~" or two " ¦ ")`); continue; }
        const c = cat.get(k);
        if (!c) { problems.push(`${f}: unknown key ${k} (${v.slice(0, 40)})`); continue; }
        // [[1]], [[2]]... stand for the English text's code blocks (copied as they are)
        if (/\[\[\d+\]\]/.test(v)) { const blocks = c.en.match(/```[\s\S]*?```/g) || []; v = v.replace(/\[\[(\d+)\]\]/g, (m, n) => blocks[+n - 1] ?? m); }
        if (holders(c.en) !== holders(v)) problems.push(`${f}: ${k} placeholders differ: "${c.en.slice(0, 60)}" -> "${v.slice(0, 60)}"`);
        if (spans(c.en) !== spans(v)) problems.push(`${f}: ${k} code spans differ: ${spans(c.en).replace(/\u0000/g, ' ')} -> ${spans(v).replace(/\u0000/g, ' ')}`);
        if (fences(c.en) !== fences(v)) problems.push(`${f}: ${k} code blocks differ`);
        dict[k] = v;
      }
    }
    for (const [k, c] of cat) { perGroup[c.group] ??= [0, 0]; perGroup[c.group][1]++; if (dict[k] !== undefined) perGroup[c.group][0]++; }
    if (write) fs.writeFileSync(path.join(SRC, 'i18n', 'gen', lang + '.json'), JSON.stringify(dict));
    else if (fs.readFileSync(path.join(SRC, 'i18n', 'gen', lang + '.json'), 'utf8') !== JSON.stringify(dict)) problems.push(`src/i18n/gen/${lang}.json is out of date: run npm run i18n`);
    const done = Object.keys(dict).filter((k) => cat.has(k)).length;
    report.push(`${lang}: ${done}/${cat.size} strings translated (${Math.round((done / cat.size) * 100)}%)`);
    for (const [g, [a, b]] of Object.entries(perGroup).sort()) report.push(`   ${g.padEnd(18)} ${String(a).padStart(5)}/${b}`);
    failed += problems.length;
    if (problems.length) { report.push(`   ${problems.length} problems:`); for (const p of problems.slice(0, 60)) report.push('   ! ' + p); }
  }
  console.log(report.join('\n'));
  return failed;
}

function todo(group, max = 100000) {
  const cat = catalogue();
  const pt = new Set(langEntries('pt').filter((e) => e[2] !== null).map((e) => e[1]));
  const es = new Set(langEntries('es').filter((e) => e[2] !== null).map((e) => e[1]));
  let n = 0;
  for (const [k, c] of cat) {
    if (c.group !== group || (pt.has(k) && es.has(k))) continue;
    if (n++ >= max) break;
    process.stdout.write(c.en.includes('\n') ? `@@ ${k}\n${c.en}\n` : `${k} ¦ ${c.en}\n`);
  }
}

const [cmd, a, b, c] = process.argv.slice(2);
if (cmd === 'extract') extract();
else if (cmd === 'build') build();
else if (cmd === 'check') { const n = build(false); console.log(n ? `\n${n} translation problems` : '\nTranslations OK'); process.exit(n ? 1 : 0); }
else if (cmd === 'pseudo') pseudo();
else if (cmd === 'todo') todo(a, b ? +b : undefined);
else console.log('usage: node scripts/i18n.cjs extract | build | todo <lang> <group> [max]');
