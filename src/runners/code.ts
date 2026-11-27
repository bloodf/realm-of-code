// Main-thread API for running player code in workers.
import { transform } from 'sucrase';
import type { RunRequest, RunResponse } from './code.worker';
import CodeWorker from './code.worker?worker';

export type { RunResponse };
export interface TsDiagnostic { line: number; message: string; code: number }

let worker: Worker | null = null;
let seq = 0;

function getWorker() {
  if (!worker) worker = new CodeWorker();
  return worker;
}

export function runJs(req: Omit<RunRequest, 'id'>, timeoutMs = 4000): Promise<RunResponse & { timedOut?: boolean }> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate();
      worker = null;
      w.removeEventListener('message', onMsg);
      resolve({ id, logs: [], values: {}, timedOut: true, error: { name: 'Timeout', line: 0, message: 'Your spell ran for too long and was stopped. This usually means a loop never ends.' } });
    }, timeoutMs);
    function onMsg(e: MessageEvent<RunResponse>) {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      resolve(e.data);
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ ...req, id });
  });
}

let tsWorker: Worker | null = null;
let tsSeq = 0;
let tsReady = false;

/** True once the TypeScript compiler has finished its first check. */
export const isTsReady = () => tsReady;

export function typeCheck(code: string): Promise<TsDiagnostic[]> {
  if (!tsWorker) tsWorker = new Worker(new URL('./ts.worker.ts', import.meta.url), { type: 'module' });
  const w = tsWorker;
  const id = ++tsSeq;
  return new Promise((resolve) => {
    function onMsg(e: MessageEvent<{ id: number; diagnostics: TsDiagnostic[] }>) {
      if (e.data.id !== id) return;
      w.removeEventListener('message', onMsg);
      tsReady = true;
      resolve(e.data.diagnostics);
    }
    w.addEventListener('message', onMsg);
    w.postMessage({ id, code });
  });
}

/** Start loading the TypeScript compiler early (it is large). */
export function warmTypeScript() {
  void typeCheck('const warm: number = 1;');
}

/** Removes TypeScript types but keeps every line in place (for line highlighting). */
export function stripTypes(code: string): string {
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
}
