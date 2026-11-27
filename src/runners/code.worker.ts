/// <reference lib="webworker" />
// Runs the player's JavaScript in a Web Worker. The main thread kills this worker
// if it takes too long (infinite loop), so the page never freezes.
import { parse } from 'acorn';
import { createSim, Victory, Defeat } from '../grid/world';
import { createFarm, COMMANDS as FARM_COMMANDS, type FarmDef, type FarmResult } from '../farm/sim.ts';
import { formatValue, toPlain } from './format';
import { makeTestLib, makeExpress, makeFetch, type Lib } from './libs';

export interface RunRequest {
  id: number;
  kind: 'grid' | 'console' | 'farm';
  code: string;
  map?: string[];
  farm?: FarmDef;
  probe?: string;
  libs?: Lib[];
}

export interface RunResponse {
  id: number;
  logs: { text: string; level: string; line: number }[];
  sim?: import('../grid/world').SimResult;
  farm?: FarmResult;
  values: Record<string, unknown>;
  error: { message: string; name: string; line: number } | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as FunctionConstructor;
const SOURCE = '\n//# sourceURL=spell.js';

const LINE_OFFSET = (() => {
  const f = new AsyncFunction('return new Error().stack' + SOURCE);
  let off = 2;
  f().then((s: string) => {
    const m = /spell\.js:(\d+):\d+/.exec(s || '');
    if (m) off = Number(m[1]) - 1;
  });
  return () => off;
})();

function lineFromStack(stack: string | undefined): number {
  const m = /spell\.js:(\d+):\d+/.exec(stack || '');
  return m ? Math.max(0, Number(m[1]) - LINE_OFFSET()) : 0;
}
const callerLine = () => lineFromStack(new Error().stack);

self.onmessage = async (e: MessageEvent<RunRequest>) => {
  const req = e.data;
  const logs: RunResponse['logs'] = [];
  let error: RunResponse['error'] = null;
  let values: Record<string, unknown> = {};

  // 1. Syntax check with acorn so we can point at the exact line.
  try {
    parse(req.code, { ecmaVersion: 'latest', sourceType: 'script', allowAwaitOutsideFunction: true, allowReturnOutsideFunction: true, locations: true });
  } catch (err) {
    const ex = err as SyntaxError & { loc?: { line: number } };
    const msg = ex.message.replace(/\s*\(\d+:\d+\)$/, '');
    (self as unknown as Worker).postMessage({ id: req.id, logs, values, error: { name: 'SyntaxError', message: msg, line: ex.loc?.line ?? 0 } } satisfies RunResponse);
    return;
  }

  const sim = req.kind === 'grid' && req.map ? createSim(req.map, callerLine) : null;
  const farm = req.kind === 'farm' && req.farm ? createFarm(req.farm, callerLine) : null;

  const mk = (level: string) => (...args: unknown[]) => {
    const text = args.map((a) => formatValue(a)).join(' ');
    const line = callerLine();
    logs.push({ text, level, line });
    if (sim) sim.events.push({ t: 'log', text, line });
  };
  const fakeConsole = { log: mk('log'), info: mk('info'), warn: mk('warn'), error: mk('error'), table: mk('log'), debug: mk('log') };

  // Track timers so async lessons (setTimeout, promises) finish before we report.
  let pending = 0;
  const timers = new Map<number, boolean>();
  const st = (fn: () => void, ms?: number, ...a: unknown[]) => {
    pending++;
    const id = self.setTimeout(() => { pending--; timers.delete(id); try { (fn as (...x: unknown[]) => void)(...a); } catch (err) { report(err); } }, Math.min(Number(ms) || 0, 2000));
    timers.set(id, true);
    return id;
  };
  const ct = (id: number) => { if (timers.delete(id)) { pending--; self.clearTimeout(id); } };
  const si = (fn: () => void, ms?: number) => {
    pending++;
    const id = self.setInterval(() => { try { fn(); } catch (err) { report(err); } }, Math.max(Number(ms) || 0, 10));
    timers.set(id, true);
    return id;
  };
  const ci = (id: number) => { if (timers.delete(id)) { pending--; self.clearInterval(id); } };

  function report(err: unknown) {
    if (err instanceof Victory) return;
    const ex = err as Error;
    if (!error) error = { name: ex?.name || 'Error', message: ex?.message ?? String(err), line: lineFromStack(ex?.stack) };
  }

  // Optional libraries for this lesson (test framework, mini Express, mock fetch).
  const libLog = (text: string, level = 'log') => logs.push({ text, level, line: 0 });
  const names: string[] = ['console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'importScripts', 'postMessage'];
  const args: unknown[] = [fakeConsole, st, ct, si, ci, undefined, undefined];
  if (sim) { names.push('hero'); args.push(sim.hero); }
  if (farm) {
    for (const n of [...FARM_COMMANDS, '__hl']) { names.push(n); args.push((farm.api as Record<string, unknown>)[n]); }
    // the farmer's speech also shows up in the console
    const say = farm.api.say;
    args[names.indexOf('say')] = (...v: unknown[]) => { say(...v); logs.push({ text: v.map((a) => formatValue(a)).join(' '), level: 'log', line: callerLine() }); };
  }
  const libs = req.libs ?? [];
  let settle = '';
  if (libs.includes('test')) {
    const t = makeTestLib(libLog);
    names.push('describe', 'test', 'it', 'expect', '__tests', '__settle');
    args.push(t.describe, t.test, t.it, t.expect, t.results, t.settle);
    settle = 'await __settle();';
  }
  if (libs.includes('express')) {
    const ex = makeExpress(libLog);
    const mod = { exports: {} };
    names.push('require', 'module', 'exports', 'request');
    args.push((name: string) => { if (name === 'express') return ex.express; throw new Error(`Cannot find module '${name}' (only "express" is available here)`); }, mod, mod.exports, ex.request);
  }
  if (libs.includes('fetch')) {
    const realmFetch = makeFetch(libLog);
    names.push('fetch');
    // count requests in flight so we wait for them like timers
    args.push((...a: Parameters<typeof realmFetch>) => { pending++; return realmFetch(...a).finally(() => { pending--; }); });
  }

  const body = req.code + '\n;' + settle + 'return (async () => {' + (req.probe || 'return {}') + '\n})();' + SOURCE;
  try {
    const fn = new AsyncFunction(...names, body);
    const out = await fn(...args);
    const start = Date.now();
    while (pending > 0 && Date.now() - start < 2500) await new Promise((r) => self.setTimeout(r, 20));
    values = (out && typeof out === 'object' ? toPlain(out) : {}) as Record<string, unknown>;
  } catch (err) {
    if (!(err instanceof Defeat)) report(err);
    else error = { name: 'Defeat', message: err.message, line: 0 };
  }
  for (const id of timers.keys()) { self.clearTimeout(id); self.clearInterval(id); }

  (self as unknown as Worker).postMessage({ id: req.id, logs, values, error, sim: sim?.result(), farm: farm?.result() } satisfies RunResponse);
};
