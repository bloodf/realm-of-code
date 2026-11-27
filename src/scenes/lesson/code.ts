// Coding, SQL and terminal exercises inside the Phaser lesson scene. The instructions,
// objectives and tables are drawn by Phaser; the code editor, web preview, hero map
// canvas and terminal are DOM elements placed in the scene (kept across rebuilds).
import Phaser from 'phaser';
import type { Exercise, Sql, Terminal } from '../../course/types';
import type { Lesson as CodeLesson } from '../../content/types';
import { useGame } from '../../game/store';
import { CodeEditor, type EdFile } from '../../ui/codeEditor';
import { gridChecks, lessonFiles, loadPreview, runLesson, solutionFiles, type CheckResult, type RunOutcome } from '../../runners/engine';
import { warmTypeScript, isTsReady } from '../../runners/code';
import { warmUp, isWarm } from '../../runners/poly';
import { t, tn } from '../../i18n';
import { describeDb, runSql, sameTable, type SqlTable } from '../../runners/sql';
import { Shell } from '../../runners/shell';
import { playGrid } from '../../grid/gridPlayer';
import { Button, ScrollView, text, iconTex, UI } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { drawFrame } from '../../ui/draw';
import { C, N, FRAMES, CODE_FONT } from '../../ui/theme';
import { play } from '../../audio/sound';
import type { ExCtx, ExWidget, Verdict } from './quiz';

type Tab = 'task' | 'code' | 'result';

/** Places a DOM element at scene coordinates (x, y) with a size. */
function domAt(scene: Phaser.Scene, el: HTMLElement, x: number, y: number, w: number, h: number) {
  Object.assign(el.style, { width: `${Math.round(w)}px`, height: `${Math.round(h)}px` });
  return scene.add.dom(Math.round(x), Math.round(y), el).setOrigin(0, 0);
}

/** A scrolling Phaser panel (framed) with content built by `fill`. */
function infoPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill: (c: Phaser.GameObjects.Container, w: number, sv: ScrollView) => number, kind: keyof typeof FRAMES = 'panel') {
  const g = scene.add.graphics(); drawFrame(g, x, y, w, h, FRAMES[kind]);
  const sv = new ScrollView(scene, x + 14, y + 12, w - 24, h - 24);
  const ch = fill(sv.content, w - 40, sv);
  sv.setContentHeight(ch + 10);
  return { g, sv };
}

/** A data table drawn by Phaser. Returns its height. */
export function tableView(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, t: SqlTable, maxRows = 12, maxW = 600) {
  if (!t.columns.length) { c.add(text(scene, x, y, '(no rows)', 16, C.muted)); return 24; }
  const rows = t.rows.slice(0, maxRows).map((r) => r.map((v) => (v === null ? 'NULL' : String(v))));
  const size = 18;
  const measure = (s: string) => Math.min(220, s.length * 9 + 18);
  const widths = t.columns.map((col, i) => Math.max(measure(col), ...rows.map((r) => measure(r[i] ?? ''))));
  const scale = Math.min(1, maxW / widths.reduce((a, b) => a + b, 0));
  const ws = widths.map((w) => Math.floor(w * scale));
  const rh = 28;
  const g = scene.add.graphics();
  const total = ws.reduce((a, b) => a + b, 0);
  g.fillStyle(0xffffff).fillRect(x, y, total, rh * (rows.length + 1));
  g.fillStyle(N('#fdeec4')).fillRect(x, y, total, rh);
  g.lineStyle(2, N('#d9c08c'));
  for (let r = 0; r <= rows.length + 1; r++) g.lineBetween(x, y + r * rh, x + total, y + r * rh);
  let cx = x;
  for (const w of ws) { g.lineBetween(cx, y, cx, y + rh * (rows.length + 1)); cx += w; }
  g.lineBetween(cx, y, cx, y + rh * (rows.length + 1));
  c.add(g);
  cx = x;
  t.columns.forEach((col, i) => {
    c.add(scene.add.text(cx + 6, y + 4, col, { fontFamily: CODE_FONT, fontSize: `${size}px`, color: C.ink, fontStyle: 'bold' }).setCrop(0, 0, ws[i] - 8, rh));
    rows.forEach((r, ri) => c.add(scene.add.text(cx + 6, y + (ri + 1) * rh + 4, r[i] ?? '', { fontFamily: CODE_FONT, fontSize: `${size}px`, color: r[i] === 'NULL' ? C.muted : C.ink }).setCrop(0, 0, ws[i] - 8, rh)));
    cx += ws[i];
  });
  let h = rh * (rows.length + 1) + 4;
  const note = t.rows.length > maxRows ? `… ${t.rows.length - maxRows} more rows · ${t.rows.length} rows` : tn(t.rows.length, '{n} row', '{n} rows');
  c.add(text(scene, x, y + h, note, 14, C.muted));
  h += 22;
  return h;
}

/** Coding tabs for narrow screens. */
function tabs(scene: Phaser.Scene, x: number, y: number, w: number, tab: Tab, set: (t: Tab) => void, result = 'Result') {
  const tw = (w - 16) / 3;
  (['task', 'code', 'result'] as Tab[]).forEach((t, i) => {
    new Button(scene, x + i * (tw + 8), y, t === 'task' ? 'Task' : t === 'code' ? 'Code' : result, () => set(t), { variant: tab === t ? 'blue' : 'paper', w: tw, h: 44, size: 17, icon: t === 'task' ? 'scroll' : t === 'code' ? 'code' : 'play', id: 'codetab.' + t });
  });
}

export function codeExerciseWidget(x: ExCtx, ex: Exercise, showSolution: number, availH: number, onAuto: (v: Verdict) => void): ExWidget {
  if (ex.t === 'code') return codeLesson(x, ex.lesson, showSolution, Math.max(360, availH));
  if (ex.t === 'sql') return sqlWidget(x, ex, showSolution, Math.max(360, availH));
  if (ex.t === 'terminal') return terminalWidget(x, ex, showSolution, Math.max(360, availH), onAuto);
  return { h: 10, ready: () => false, check: () => ({ correct: false }), hint: null };
}

// ---------------- coding challenges ----------------
interface CodeWs {
  values?: Record<string, string>; outcome?: RunOutcome | null; checks?: CheckResult[]; hints?: number; tab?: Tab; sage?: boolean; solShown?: number; out?: 'preview' | 'console';
  __editor?: CodeEditor; __frame?: HTMLIFrameElement; __grid?: HTMLCanvasElement; __gridStop?: () => void; __console?: HTMLDivElement;
}

function initialChecks(lesson: CodeLesson): CheckResult[] {
  const list = lesson.kind === 'grid' ? gridChecks(lesson) : lesson.checks;
  const base: CheckResult[] = list.map((c) => ({ label: c.label, pass: false, bonus: c.bonus }));
  if (lesson.kind !== 'web' && lesson.lang === 'ts') base.unshift({ label: 'No type errors', pass: false });
  return base;
}

function codeLesson(x: ExCtx, lesson: CodeLesson, showSolution: number, H: number): ExWidget {
  const { scene, w } = x;
  const ws = x.ws as CodeWs;
  const s = useGame.getState();
  const files = lessonFiles(lesson) as EdFile[];
  const starter = Object.fromEntries(files.map((f) => [f.name, f.code]));
  if (!ws.values) ws.values = { ...starter, ...(s.drafts[lesson.id] ?? {}) };
  if (!ws.checks) ws.checks = initialChecks(lesson);
  ws.hints ??= 0;
  ws.tab ??= 'task';
  ws.out ??= 'preview';
  if (lesson.kind !== 'web' && lesson.lang === 'ts') warmTypeScript();
  if (lesson.kind === 'console' && (lesson.lang === 'py' || lesson.lang === 'php')) void warmUp(lesson.lang).then(() => { if (!ws.outcome) rebuild(); });
  const narrow = w < 1000;
  const top = x.c.y + x.y;
  const left = x.c.x + x.x;
  let panelY = top, panelH = H;
  const rebuild = () => (scene as unknown as { rebuild: () => void }).rebuild();
  if (narrow) { tabs(scene, left, top, w, ws.tab, (t) => { ws.tab = t; play('click'); rebuild(); }); panelY += 54; panelH -= 54; }
  const infoW = narrow ? w : 340;
  const restW = narrow ? w : w - infoW - 12;
  const edW = narrow ? w : Math.floor(restW * 0.55);
  const outW = narrow ? w : restW - edW - 12;
  const showInfo = !narrow || ws.tab === 'task', showEd = !narrow || ws.tab === 'code', showOut = !narrow || ws.tab === 'result';
  const judged = !!ws.outcome;

  // ---- info panel (Phaser) ----
  if (showInfo) {
    UI.area(scene, 'code.task', left, panelY, infoW, panelH, 'The task');
    infoPanel(scene, left, panelY, infoW, panelH, (c, iw, sv) => {
      let y = 0;
      c.add(scene.add.image(0, y + 2, iconTex(scene, 'code', C.blueDark, 1)).setOrigin(0, 0));
      c.add(text(scene, 18, y, lesson.boss ? 'PROJECT' : 'CODING CHALLENGE', 15, C.blueDark, { fontStyle: 'bold' }));
      y += 22;
      c.add(text(scene, 0, y, lesson.title, 24, C.ink, { fontStyle: 'bold', wordWrap: { width: iw } }));
      y += c.list[c.list.length - 1] instanceof Phaser.GameObjects.Text ? (c.list[c.list.length - 1] as Phaser.GameObjects.Text).height + 8 : 34;
      const add = (md: string, size = 18, color: string = C.ink) => { const t = richTexture(scene, md, { width: iw, size, color }); c.add(scene.add.image(0, y, t.key).setOrigin(0, 0)); y += t.h + 10; };
      add(lesson.story, 16, C.inkSoft);
      add(lesson.learn, 17);
      c.add(text(scene, 0, y, 'Your task', 21, C.ink, { fontStyle: 'bold' })); y += 28;
      add(lesson.task, 17);
      c.add(text(scene, 0, y, 'Objectives', 21, C.ink, { fontStyle: 'bold' })); y += 28;
      for (const ch of ws.checks!) {
        const g = scene.add.graphics();
        g.fillStyle(judged ? (ch.pass ? N(C.green) : N(C.red)) : N('#fdf6e3')).fillRect(0, y + 2, 20, 20);
        g.lineStyle(3, judged ? (ch.pass ? N(C.greenDark) : N(C.redDark)) : N('#b8955c')).strokeRect(0, y + 2, 20, 20);
        c.add(g);
        if (judged) c.add(text(scene, 10, y + 2, ch.pass ? '✓' : '✗', 16, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5, 0));
        const t = richTexture(scene, ch.label + (ch.bonus ? ' **(bonus)**' : '') + (judged && !ch.pass && ch.fail ? `\n*${ch.fail}*` : ''), { width: iw - 30, size: 16, color: judged && !ch.pass && ch.fail ? C.ink : C.ink });
        c.add(scene.add.image(30, y, t.key).setOrigin(0, 0));
        y += Math.max(26, t.h + 6);
      }
      y += 6;
      c.add(text(scene, 0, y, 'Hints', 21, C.ink, { fontStyle: 'bold' })); y += 28;
      for (const h of lesson.hints.slice(0, ws.hints)) {
        const t = richTexture(scene, h, { width: iw - 20, size: 16 });
        const g = scene.add.graphics(); g.fillStyle(N('#fdeec4')).fillRect(0, y, iw, t.h + 14); g.lineStyle(3, N('#d8b060')).strokeRect(0, y, iw, t.h + 14);
        c.add([g, scene.add.image(10, y + 7, t.key).setOrigin(0, 0)]);
        y += t.h + 22;
      }
      if (ws.hints! < lesson.hints.length) { c.add(new Button(scene, 0, y, 'Show a hint', () => { ws.hints!++; play('page'); rebuild(); }, { variant: 'ghost', icon: 'hint', size: 16, h: 40, id: 'code.hint', clip: sv })); y += 50; }
      else { c.add(text(scene, 0, y, 'No more hints.', 16, C.muted)); y += 26; }
      if (s.settings.sageNotes && lesson.sage) {
        c.add(new Button(scene, 0, y, ws.sage ? "Hide Sage's notes" : "Sage's notes (going deeper)", () => { ws.sage = !ws.sage; rebuild(); }, { variant: 'blue', size: 15, h: 38, id: 'code.sage', clip: sv }));
        y += 48;
        if (ws.sage) add(lesson.sage, 16);
      }
      return y;
    });
  }

  // ---- editor (DOM) ----
  if (!ws.__editor) {
    const ed = new CodeEditor(files, ws.values!, s.settings.fontSize);
    ed.onChange = (_n, _v, all) => {
      ws.values = { ...all };
      clearTimeout((ws as { __t?: number }).__t);
      (ws as { __t?: number }).__t = window.setTimeout(() => {
        if (Object.keys(all).some((k) => all[k] !== starter[k])) useGame.getState().saveDraft(lesson.id, all);
        if (lesson.kind === 'web' && ws.__frame) void loadPreview(ws.__frame, lesson, ws.values!);
      }, 400);
    };
    ws.__editor = ed;
  }
  const ed = ws.__editor;
  if (showSolution && ws.solShown !== showSolution) { ws.solShown = showSolution; ws.values = solutionFiles(lesson); ed.setValues(ws.values); }
  ed.onRun = () => { (scene as unknown as { checkNow?: () => void }).checkNow?.(); };
  const edX = narrow ? left : left + infoW + 12;
  if (showEd) {
    const barH = 44;
    domAt(scene, ed.el, edX, panelY, edW, panelH - barH);
    UI.area(scene, 'code.editor', edX, panelY, edW, panelH - barH, 'The editor');
    const bar = scene.add.graphics(); bar.fillStyle(0x2a1d14).fillRect(edX, panelY + panelH - barH, edW, barH);
    text(scene, edX + 10, panelY + panelH - barH + 12, 'Ctrl+Enter runs your code', 15, '#cbb99a');
    new Button(scene, edX + edW - 110, panelY + panelH - barH + 4, 'Reset', () => { ws.values = { ...starter }; ed.setValues(ws.values); ws.outcome = null; ws.checks = initialChecks(lesson); play('page'); rebuild(); }, { variant: 'paper', icon: 'reset', size: 15, w: 104, h: 36, id: 'code.reset' });
  }

  // ---- output ----
  const outX = narrow ? left : edX + edW + 12;
  if (showOut) {
    UI.area(scene, 'code.output', outX, panelY, outW, panelH, 'The result');
    let oy = panelY;
    let oh = panelH;
    const oracle = ws.outcome ? oracleText(ws.outcome) : null;
    const oracleT = oracle ? richTexture(scene, oracle, { width: outW - 24, size: 16, color: '#3f2470' }) : null;
    const oracleH = oracleT ? Math.min(oracleT.h + 20, 150) : 0;
    if (lesson.kind === 'web') {
      const tw = (outW - 8) / 2;
      new Button(scene, outX, oy, 'Preview', () => { ws.out = 'preview'; rebuild(); }, { variant: ws.out === 'preview' ? 'blue' : 'paper', size: 15, w: tw, h: 38, id: 'code.preview' });
      new Button(scene, outX + tw + 8, oy, `Console${ws.outcome?.logs.length ? ` (${ws.outcome.logs.length})` : ''}`, () => { ws.out = 'console'; rebuild(); }, { variant: ws.out === 'console' ? 'blue' : 'paper', size: 15, w: tw, h: 38, id: 'code.console' });
      oy += 44; oh -= 44;
      if (!ws.__frame) {
        const f = document.createElement('iframe');
        f.className = 'preview-frame';
        f.title = 'Preview';
        f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
        ws.__frame = f;
        setTimeout(() => void loadPreview(f, lesson, ws.values!), 50);
      }
      if (ws.out === 'preview') domAt(scene, ws.__frame, outX, oy, outW, oh - oracleH);
      else domAt(scene, consoleEl(ws, ws.outcome?.logs ?? [], 'Nothing printed yet.'), outX, oy, outW, oh - oracleH);
      if (ws.out !== 'preview') { const hidden = ws.__frame; domAt(scene, hidden, -5000, -5000, 400, 300); }
    } else if (lesson.kind === 'grid') {
      if (!ws.__grid) {
        ws.__grid = document.createElement('canvas');
        ws.__grid.className = 'grid-canvas';
        ws.__gridStop = playGrid(ws.__grid, { map: lesson.map, avatar: s.profile!.avatar, tunic: s.profile!.tunic, events: null, speed: s.settings.speed, theme: lesson.lang === 'ts' ? 'forge' : 'forest' });
      }
      const wrap = document.createElement('div');
      wrap.className = 'dom-panel grid-wrap';
      wrap.appendChild(ws.__grid);
      const legend = document.createElement('div');
      legend.className = 'legend';
      legend.textContent = 'Gem, goblin, key, door, tree, gate: reach the gate!';
      wrap.appendChild(legend);
      const logs = ws.outcome?.logs ?? [];
      if (logs.length) wrap.appendChild(consoleEl(ws, logs, ''));
      domAt(scene, wrap, outX, oy, outW, oh - oracleH);
    } else {
      if (ws.outcome === undefined || ws.outcome === null) {
        const waitMsg = lesson.lang === 'ts' && !isTsReady() ? t('Loading the TypeScript compiler… (only the first time)') : (lesson.lang === 'py' || lesson.lang === 'php') && !isWarm(lesson.lang) ? t('Loading {lang}… (about 12 MB, only the first time)', { lang: lesson.lang === 'py' ? 'Python' : 'PHP' }) : t('Run your code to see the output here.');
        domAt(scene, consoleEl(ws, [], waitMsg), outX, oy, outW, oh - oracleH);
      } else domAt(scene, consoleEl(ws, ws.outcome.logs, 'Nothing was printed.'), outX, oy, outW, oh - oracleH);
    }
    if (oracleT) {
      const g = scene.add.graphics(); g.fillStyle(N('#efe3ff')).fillRect(outX, oy + oh - oracleH, outW, oracleH); g.lineStyle(3, N(C.purple)).strokeRect(outX, oy + oh - oracleH, outW, oracleH);
      const img = scene.add.image(outX + 12, oy + oh - oracleH + 10, oracleT.key).setOrigin(0, 0);
      if (oracleT.h > oracleH - 20) img.setCrop(0, 0, oracleT.w, oracleH - 20);
    }
  }

  const run = async (): Promise<Verdict> => {
    play('cast');
    if (narrow) ws.tab = 'result';
    const o = await runLesson(lesson, ws.values!, ws.__frame ?? null);
    if (lesson.kind === 'grid' && o.events?.length && ws.__grid) {
      ws.__gridStop?.();
      await new Promise<void>((resolve) => {
        ws.__gridStop = playGrid(ws.__grid!, { map: lesson.map, avatar: s.profile!.avatar, tunic: s.profile!.tunic, events: o.events!, speed: useGame.getState().settings.speed, theme: lesson.lang === 'ts' ? 'forge' : 'forest', onLine: (l) => ed.setRunningLine(l), onDone: resolve });
      });
    }
    ws.outcome = o;
    ws.checks = o.results;
    const main = lesson.kind === 'web' ? (o.error?.file || ed.activeFile) : 'main.' + lesson.lang;
    ed.setErrors([...o.tsDiagnostics.map((d) => ({ file: main, line: d.line, message: d.message })), ...(o.error?.line ? [{ file: main, line: o.error.line, message: o.error.message }] : [])]);
    useGame.getState().recordRun({ error: !!o.error || o.tsDiagnostics.length > 0, timeout: o.timedOut, splash: o.sim?.drowned, gems: o.sim?.gems, goblins: o.sim?.goblins, offByOne: !!o.sim?.offByOne && !o.sim.escaped });
    if (!o.passed) play(o.error || o.tsDiagnostics.length ? 'error' : 'wrong');
    return { correct: o.passed };
  };

  return {
    h: H,
    ready: () => true,
    check: run,
    hint: null,
    destroy: () => {},
  };
}

function consoleEl(ws: CodeWs, lines: { text: string; level: string; line: number }[], empty: string) {
  if (!ws.__console) { ws.__console = document.createElement('div'); ws.__console.className = 'dom-panel console-box'; }
  const el = ws.__console;
  el.innerHTML = '';
  if (!lines.length) { const d = document.createElement('div'); d.className = 'muted'; d.textContent = empty; el.appendChild(d); }
  for (const l of lines) {
    const d = document.createElement('div');
    d.className = 'line ' + l.level;
    if (l.line) { const s = document.createElement('span'); s.className = 'ln'; s.textContent = `line ${l.line} `; d.appendChild(s); }
    d.appendChild(document.createTextNode(l.text));
    el.appendChild(d);
  }
  return el;
}

function oracleText(o: RunOutcome): string | null {
  const e = o.error;
  const ts = o.tsDiagnostics;
  if (!e && !ts.length && !o.oracle) return o.passed ? null : '**Almost!** Your code ran without errors, but some objectives are not done yet.';
  const parts: string[] = [];
  if (e) parts.push(`**${e.name === 'Timeout' ? 'Endless loop!' : e.name}**${e.line ? ` on line ${e.line}` : ''}${e.file ? ` in ${e.file}` : ''}: ${e.message}`);
  for (const d of ts.slice(0, 3)) parts.push(`**Type error** on line ${d.line}: ${d.message}`);
  if (o.oracle) parts.push(`**Lumi says:** ${o.oracle}`);
  return parts.join('\n\n');
}

// ---------------- SQL ----------------
interface SqlWs { query?: string; mine?: { result: SqlTable | null; error: string | null } | null; expected?: SqlTable | null; ok?: boolean | null; tab?: Tab; schema?: { name: string; table: SqlTable }[]; hint?: boolean; solShown?: number; __editor?: CodeEditor }

function sqlWidget(x: ExCtx, ex: Sql, showSolution: number, H: number): ExWidget {
  const { scene, w } = x;
  const ws = x.ws as SqlWs;
  const s = useGame.getState();
  ws.query ??= ex.starter;
  ws.tab ??= 'task';
  const rebuild = () => (scene as unknown as { rebuild: () => void }).rebuild();
  if (!ws.schema) void describeDb(ex.db).then((sc) => { ws.schema = sc; rebuild(); });
  const narrow = w < 1000;
  const top = x.c.y + x.y, left = x.c.x + x.x;
  let panelY = top, panelH = H;
  if (narrow) { tabs(scene, left, top, w, ws.tab, (t) => { ws.tab = t; play('click'); rebuild(); }, 'Rows'); panelY += 54; panelH -= 54; }
  const infoW = narrow ? w : 380;
  const restW = narrow ? w : w - infoW - 12;
  const edW = narrow ? w : Math.floor(restW * 0.5);
  const outW = narrow ? w : restW - edW - 12;
  if (!narrow || ws.tab === 'task') {
    UI.area(scene, 'code.task', left, panelY, infoW, panelH, 'The task');
    infoPanel(scene, left, panelY, infoW, panelH, (c, iw, sv) => {
      let y = 0;
      c.add(text(scene, 0, y, 'SQL CHALLENGE', 15, '#b67d12', { fontStyle: 'bold' })); y += 22;
      const tt = text(scene, 0, y, ex.title, 24, C.ink, { fontStyle: 'bold', wordWrap: { width: iw } }); c.add(tt); y += tt.height + 8;
      const t = richTexture(scene, ex.task, { width: iw, size: 17 }); c.add(scene.add.image(0, y, t.key).setOrigin(0, 0)); y += t.h + 12;
      if (ex.hint) {
        if (ws.hint) { const h = richTexture(scene, ex.hint, { width: iw - 20, size: 16 }); const g = scene.add.graphics(); g.fillStyle(N('#d6ebfb')).fillRect(0, y, iw, h.h + 14); c.add([g, scene.add.image(10, y + 7, h.key).setOrigin(0, 0)]); y += h.h + 22; }
        else { c.add(new Button(scene, 0, y, 'Hint', () => { ws.hint = true; play('page'); rebuild(); }, { variant: 'ghost', icon: 'hint', size: 16, h: 38, id: 'sql.hint', clip: sv })); y += 48; }
      }
      c.add(text(scene, 0, y, 'The archive (tables)', 20, C.ink, { fontStyle: 'bold' })); y += 28;
      for (const sc of ws.schema ?? []) {
        c.add(text(scene, 0, y, sc.name, 20, C.ink, { fontFamily: CODE_FONT, fontStyle: 'bold' })); y += 24;
        y += tableView(scene, c, 0, y, sc.table, 6, iw) + 8;
      }
      if (!ws.schema) { c.add(text(scene, 0, y, 'Opening the archive…', 16, C.muted)); y += 24; }
      return y;
    });
  }
  if (!ws.__editor) {
    ws.__editor = new CodeEditor([{ name: 'query.sql', lang: 'sql', code: ex.starter }], { 'query.sql': ws.query! }, s.settings.fontSize);
    ws.__editor.onChange = (_n, v) => { ws.query = v; };
  }
  const ed = ws.__editor;
  ed.onRun = () => (scene as unknown as { checkNow?: () => void }).checkNow?.();
  if (showSolution && ws.solShown !== showSolution) { ws.solShown = showSolution; ws.query = ex.solution; ed.setValues({ 'query.sql': ex.solution }); }
  const edX = narrow ? left : left + infoW + 12;
  if (!narrow || ws.tab === 'code') {
    domAt(scene, ed.el, edX, panelY, edW, panelH - 40);
    UI.area(scene, 'code.editor', edX, panelY, edW, panelH - 40, 'The editor');
    const bar = scene.add.graphics(); bar.fillStyle(0x2a1d14).fillRect(edX, panelY + panelH - 40, edW, 40);
    text(scene, edX + 10, panelY + panelH - 30, 'Ctrl+Enter runs your query', 15, '#cbb99a');
  }
  const outX = narrow ? left : edX + edW + 12;
  if (!narrow || ws.tab === 'result') {
    UI.area(scene, 'code.output', outX, panelY, outW, panelH, 'The result');
    infoPanel(scene, outX, panelY, outW, panelH, (c, iw) => {
      let y = 0;
      c.add(text(scene, 0, y, 'Result', 20, C.ink, { fontStyle: 'bold' })); y += 30;
      if (!ws.mine) { c.add(text(scene, 0, y, 'Run your query to see the rows it returns.', 16, C.muted, { wordWrap: { width: iw } })); y += 40; }
      else if (ws.mine.error) { const t = richTexture(scene, `**SQL error:** ${ws.mine.error}`, { width: iw - 20, size: 16, color: '#3f2470' }); const g = scene.add.graphics(); g.fillStyle(N('#efe3ff')).fillRect(0, y, iw, t.h + 14); c.add([g, scene.add.image(10, y + 7, t.key).setOrigin(0, 0)]); y += t.h + 22; }
      else if (ws.mine.result) y += tableView(scene, c, 0, y, ws.mine.result, 12, iw);
      if (ws.ok === false && ws.expected) {
        c.add(text(scene, 0, y + 6, 'Not quite. The expected result looks like this:', 16, C.redDark, { fontStyle: 'bold', wordWrap: { width: iw } })); y += 34;
        y += tableView(scene, c, 0, y, ws.expected, 12, iw);
      }
      return y;
    }, 'paper');
  }
  const run = async (): Promise<Verdict> => {
    play('cast');
    if (narrow) ws.tab = 'result';
    const [a, b] = await Promise.all([runSql(ex.db, ws.query!, ex.after), runSql(ex.db, ex.solution, ex.after)]);
    ws.mine = { result: a.result, error: a.error };
    ws.expected = b.result;
    ws.ok = !a.error && sameTable(a.result, b.result, ex.ordered);
    if (!ws.ok) play('wrong');
    return { correct: ws.ok };
  };
  return { h: H, ready: () => true, check: run, hint: null };
}

// ---------------- terminal ----------------
interface TermWs { shell?: Shell; lines?: { prompt?: string; text: string }[]; done?: boolean; hint?: boolean; solShown?: number; hist?: number; __el?: HTMLDivElement; __input?: HTMLInputElement; __log?: HTMLDivElement; __prompt?: HTMLSpanElement }

function terminalWidget(x: ExCtx, ex: Terminal, showSolution: number, H: number, onAuto: (v: Verdict) => void): ExWidget {
  const { scene, w, c } = x;
  const ws = x.ws as TermWs;
  ws.shell ??= new Shell(ex.setup, ex.cwd);
  ws.lines ??= [{ text: 'Welcome to the realm terminal. Type commands and press Enter. Try: help' }];
  ws.hist ??= -1;
  const shell = ws.shell;
  const rebuild = () => (scene as unknown as { rebuild: () => void }).rebuild();
  let y = x.y;
  c.add(scene.add.image(x.x, y + 2, iconTex(scene, 'terminal2', '#2f7d4f', 1)).setOrigin(0, 0));
  c.add(text(scene, x.x + 18, y, 'TERMINAL CHALLENGE', 15, '#2f7d4f', { fontStyle: 'bold' }));
  y += 24;
  const t = richTexture(scene, ex.task, { width: w, size: 22, bold: true });
  c.add(scene.add.image(x.x, y, t.key).setOrigin(0, 0));
  y += t.h + 12;
  if (ex.hint) {
    if (ws.hint) { const h = richTexture(scene, ex.hint, { width: w - 20, size: 17 }); const g = scene.add.graphics(); g.fillStyle(N('#d6ebfb')).fillRect(x.x, y, w, h.h + 14); c.add([g, scene.add.image(x.x + 10, y + 7, h.key).setOrigin(0, 0)]); y += h.h + 22; }
    else { c.add(new Button(scene, x.x, y, 'Hint', () => { ws.hint = true; play('page'); rebuild(); }, { variant: 'ghost', icon: 'hint', size: 16, h: 38, id: 'term.hint', clip: x.clip })); y += 48; }
  }
  if (showSolution && ws.solShown !== showSolution) { ws.solShown = showSolution; ws.lines.push({ text: `Lumi whispers: try these commands:\n  ${ex.solution.join('\n  ')}` }); }
  if (!ws.__el) {
    const el = document.createElement('div');
    el.className = 'term-box';
    const log = document.createElement('div');
    const form = document.createElement('form');
    const pr = document.createElement('span'); pr.className = 'pr';
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Command'); input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('autocapitalize', 'off');
    input.dataset.ui = 'term.input';
    form.append(pr, input);
    el.append(log, form);
    el.addEventListener('click', () => input.focus());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'ArrowUp') { const h = Math.min(shell.history.length - 1, ws.hist! + 1); ws.hist = h; input.value = shell.history[shell.history.length - 1 - h] ?? ''; e.preventDefault(); }
      if (e.key === 'ArrowDown') { const h = Math.max(-1, ws.hist! - 1); ws.hist = h; input.value = h < 0 ? '' : shell.history[shell.history.length - 1 - h] ?? ''; e.preventDefault(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = input.value;
      if (!cmd.trim()) return;
      input.value = ''; ws.hist = -1;
      const prompt = shell.prompt();
      const out = shell.run(cmd);
      if (out === '\u0000clear') ws.lines = [];
      else ws.lines!.push({ prompt, text: cmd }, ...(out ? [{ text: out }] : []));
      play('tick');
      render();
      if (!ws.done && ex.check(shell)) { ws.done = true; setTimeout(() => onAuto({ correct: true }), 400); }
    });
    ws.__el = el; ws.__input = input; ws.__log = log; ws.__prompt = pr;
  }
  const render = () => {
    const log = ws.__log!;
    log.innerHTML = '';
    for (const l of ws.lines!) {
      const d = document.createElement('div'); d.className = 'out';
      if (l.prompt) { const p = document.createElement('span'); p.className = 'pr'; p.textContent = l.prompt + ' '; d.appendChild(p); }
      d.appendChild(document.createTextNode(l.text));
      log.appendChild(d);
    }
    ws.__prompt!.textContent = shell.prompt();
    ws.__el!.scrollTop = ws.__el!.scrollHeight;
  };
  render();
  const th = Math.max(240, H - (y - x.y) - 10);
  const dom = scene.add.dom(x.c.x + x.x, x.c.y + y, ws.__el).setOrigin(0, 0);
  Object.assign(ws.__el.style, { width: `${w}px`, height: `${th}px` });
  void dom;
  setTimeout(() => ws.__input?.focus(), 60);
  const tz = scene.add.zone(x.x, y, w, th).setOrigin(0, 0);
  c.add(tz);
  UI.reg(scene, 'term.box', tz, 'Terminal');
  if (ws.done) c.add(text(scene, x.x, y + th + 6, 'Goal reached!', 18, C.greenDark, { fontStyle: 'bold' }));
  return { h: y - x.y + th + 30, ready: () => true, check: () => ({ correct: ex.check(shell) }), hint: null };
}
