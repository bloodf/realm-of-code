import { runPoly } from './poly';
import { explainPoly } from './oracle';
// Runs a lesson and evaluates its objectives. Used by the lesson screen and by the
// built-in verifier (#/dev/verify) that proves every lesson is solvable.
import type { Check, ConsoleLesson, GridLesson, WebCtx, WebLesson, Lesson } from '../content/types';
import type { GridEvent, SimResult } from '../grid/world';
import { runJs, stripTypes, typeCheck, type TsDiagnostic } from './code';
import { buildPreview } from './web';
import { explainError, explainTs } from './oracle';

export interface CheckResult { label: string; pass: boolean; bonus?: boolean; fail?: string }

export interface RunOutcome {
  results: CheckResult[];
  passed: boolean;
  bonusPassed: boolean;
  logs: { text: string; level: string; line: number }[];
  error: { name: string; message: string; line: number; file?: string } | null;
  oracle: string | null;
  tsDiagnostics: TsDiagnostic[];
  sim?: SimResult;
  events?: GridEvent[];
  timedOut?: boolean;
}

async function evaluate<C>(checks: Check<C>[], ctx: C): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  for (const c of checks) {
    let pass = false;
    try { pass = !!(await c.test(ctx)); } catch { pass = false; }
    out.push({ label: c.label, pass, bonus: c.bonus, fail: c.fail });
  }
  return out;
}

function summarize(results: CheckResult[]) {
  const req = results.filter((r) => !r.bonus);
  const bonus = results.filter((r) => r.bonus);
  const passed = req.length > 0 && req.every((r) => r.pass);
  return { passed, bonusPassed: passed && bonus.every((r) => r.pass) };
}

/** Code without comments, for checks like "uses a for loop". */
export function stripComments(code: string) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1').replace(/<!--[\s\S]*?-->/g, '');
}

export function codeLines(code: string) {
  return stripComments(code).split('\n').filter((l) => l.trim() && l.trim() !== '}' && l.trim() !== '});').length;
}

export function gridChecks(lesson: GridLesson): Check<{ code: string; result: SimResult; logs: string[] }>[] {
  const checks: Check<{ code: string; result: SimResult; logs: string[] }>[] = [];
  if (lesson.goals.gems) {
    const n = lesson.goals.gems;
    checks.push({ label: n === 'all' ? 'Collect every gem' : `Collect at least ${n} gems`, test: (c) => (n === 'all' ? c.result.gems === c.result.gemsTotal : c.result.gems >= n) });
  }
  if (lesson.goals.goblins) checks.push({ label: 'Defeat every goblin', test: (c) => c.result.goblins === c.result.goblinsTotal });
  if (lesson.goals.exit) checks.push({ label: 'Reach the castle gate', test: (c) => c.result.escaped });
  checks.push(...(lesson.checks ?? []));
  if (lesson.parLines) checks.push({ label: `Use at most ${lesson.parLines} lines of code`, bonus: true, test: (c) => codeLines(c.code) <= lesson.parLines! });
  return checks;
}

export async function runGrid(lesson: GridLesson, source: string): Promise<RunOutcome> {
  let tsDiagnostics: TsDiagnostic[] = [];
  let code = source;
  if (lesson.lang === 'ts') {
    tsDiagnostics = await typeCheck(source);
    code = stripTypes(source);
  }
  const res = await runJs({ kind: 'grid', code, map: lesson.map });
  const sim = res.sim;
  const logs = res.logs;
  const error = res.error && res.error.name !== 'Defeat' ? res.error : null;
  let results: CheckResult[] = [];
  if (sim) {
    results = await evaluate(gridChecks(lesson), { code: source, result: sim, logs: logs.map((l) => l.text) });
  } else {
    results = gridChecks(lesson).map((c) => ({ label: c.label, pass: false, bonus: c.bonus }));
  }
  if (lesson.lang === 'ts') results.unshift({ label: 'No type curses (TypeScript errors)', pass: tsDiagnostics.length === 0 });
  if (error) results.forEach((r) => { r.pass = false; r.fail = undefined; });
  const s = summarize(results);
  const oracle = res.error ? (res.error.name === 'Defeat' ? res.error.message : explainError(res.error.name, res.error.message)) : tsDiagnostics[0] ? explainTs(tsDiagnostics[0].code, tsDiagnostics[0].message) : null;
  return { ...s, results, logs, error: res.error?.name === 'Defeat' ? null : res.error, oracle, tsDiagnostics, sim, events: sim?.events, timedOut: res.timedOut };
}

export async function runConsole(lesson: ConsoleLesson, source: string): Promise<RunOutcome> {
  if (lesson.lang === 'py' || lesson.lang === 'php') {
    const res = await runPoly(lesson.lang, source, lesson.probe);
    const ctx = { code: source, logs: res.logs.filter((l) => l.level === 'log').map((l) => l.text), values: res.values, tsErrors: [], error: res.error?.message ?? null };
    const results = await evaluate(lesson.checks, ctx);
    if (res.error) results.forEach((r) => { r.pass = false; r.fail = undefined; });
    const s = summarize(results);
    return { ...s, results, logs: res.logs, error: res.error, oracle: res.error ? explainPoly(lesson.lang, res.error.name, res.error.message) : null, tsDiagnostics: [], timedOut: res.timedOut };
  }
  let tsDiagnostics: TsDiagnostic[] = [];
  let code = source;
  if (lesson.lang === 'ts') {
    tsDiagnostics = await typeCheck(source);
    try { code = stripTypes(source); } catch (e) {
      return { results: lesson.checks.map((c) => ({ label: c.label, pass: false, bonus: c.bonus })), passed: false, bonusPassed: false, logs: [], error: { name: 'SyntaxError', message: (e as Error).message, line: 0 }, oracle: null, tsDiagnostics };
    }
  }
  const res = await runJs({ kind: 'console', code, probe: lesson.probe, libs: lesson.libs });
  const ctx = { code: source, logs: res.logs.map((l) => l.text), values: res.values, tsErrors: tsDiagnostics.map((d) => d.message), error: res.error?.message ?? null };
  const results = await evaluate(lesson.checks, ctx);
  if (lesson.lang === 'ts') results.unshift({ label: 'No type curses (TypeScript errors)', pass: tsDiagnostics.length === 0 });
  if (res.error) results.forEach((r) => { r.pass = false; r.fail = undefined; });
  const s = summarize(results);
  const oracle = res.error ? explainError(res.error.name, res.error.message) : tsDiagnostics[0] ? explainTs(tsDiagnostics[0].code, tsDiagnostics[0].message) : null;
  return { ...s, results, logs: res.logs, error: res.error, oracle, tsDiagnostics, timedOut: res.timedOut };
}

// ---------------- Web lessons ----------------

function ctxFor(frame: HTMLIFrameElement, files: Record<string, string>): WebCtx {
  const win = frame.contentWindow as Window & typeof globalThis;
  const doc = frame.contentDocument!;
  const rc = (win as unknown as { __rc?: { logs: string[]; errors: string[] } }).__rc ?? { logs: [], errors: [] };
  const el = (t: string | Element | null) => (typeof t === 'string' ? doc.querySelector(t) : t);
  const wait = (ms = 60) => new Promise<void>((r) => setTimeout(r, ms));
  return {
    doc, win, files, logs: rc.logs, errors: rc.errors,
    $: (s) => doc.querySelector(s),
    $$: (s) => Array.from(doc.querySelectorAll(s)),
    css: (t, prop) => { const e = el(t); return e ? win.getComputedStyle(e).getPropertyValue(prop).trim() : ''; },
    text: (s) => (doc.querySelector(s)?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    click: async (t) => { const e = el(t) as HTMLElement | null; e?.click(); await wait(80); },
    type: async (t, value) => {
      const e = el(t) as HTMLInputElement | null;
      if (!e) return;
      const proto = e instanceof win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(e, value);
      e.dispatchEvent(new win.Event('input', { bubbles: true }));
      e.dispatchEvent(new win.Event('change', { bubbles: true }));
      await wait(80);
    },
    wait,
  };
}

/** Loads the preview into the frame and resolves once the page reports it is ready. */
export async function loadPreview(frame: HTMLIFrameElement, lesson: WebLesson, files: Record<string, string>) {
  const built = await buildPreview(lesson.mode, files);
  await new Promise<void>((resolve) => {
    const onLoad = () => { frame.removeEventListener('load', onLoad); resolve(); };
    frame.addEventListener('load', onLoad);
    frame.srcdoc = built.html;
  });
  const start = Date.now();
  for (;;) {
    const rc = (frame.contentWindow as unknown as { __rc?: { ready: boolean; errors: string[] } })?.__rc;
    if (rc?.ready || Date.now() - start > 6000) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await new Promise((r) => setTimeout(r, 30));
  return built;
}

export async function runWeb(lesson: WebLesson, files: Record<string, string>, frame: HTMLIFrameElement): Promise<RunOutcome> {
  const built = await loadPreview(frame, lesson, files);
  if (built.errors.length) {
    const e = built.errors[0];
    return {
      results: lesson.checks.map((c) => ({ label: c.label, pass: false, bonus: c.bonus })), passed: false, bonusPassed: false,
      logs: [], error: { name: 'CompileError', message: e.message, line: e.line, file: e.file }, oracle: explainError('SyntaxError', e.message), tsDiagnostics: [],
    };
  }
  const ctx = ctxFor(frame, files);
  const results = await evaluate(lesson.checks, ctx);
  const errs = ctx.errors;
  const s = summarize(results);
  return {
    ...s, results, logs: ctx.logs.map((t) => ({ text: t, level: 'log', line: 0 })),
    error: errs.length ? { name: 'Error', message: errs[0], line: 0 } : null,
    oracle: errs.length ? explainError('Error', errs[0]) : null, tsDiagnostics: [],
  };
}

export function runLesson(lesson: Lesson, files: Record<string, string>, frame?: HTMLIFrameElement | null): Promise<RunOutcome> {
  if (lesson.kind === 'grid') return runGrid(lesson, files['main.' + lesson.lang] ?? Object.values(files)[0]);
  if (lesson.kind === 'console') return runConsole(lesson, files['main.' + lesson.lang] ?? Object.values(files)[0]);
  if (!frame) throw new Error('A preview frame is needed for web lessons');
  return runWeb(lesson, files, frame);
}

/** The files shown in the editor for a lesson. */
export function lessonFiles(lesson: Lesson) {
  if (lesson.kind === 'web') return lesson.files;
  return [{ name: 'main.' + lesson.lang, lang: lesson.lang, code: lesson.starter }];
}

export function solutionFiles(lesson: Lesson): Record<string, string> {
  if (lesson.kind === 'web') {
    const base = Object.fromEntries(lesson.files.map((f) => [f.name, f.code]));
    return { ...base, ...lesson.solution };
  }
  return { ['main.' + lesson.lang]: lesson.solution };
}
