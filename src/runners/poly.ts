// Main-thread API for Python and PHP. The interpreters are big (about 12 MB each), so they
// load the first time a Python or PHP exercise opens, and stay warm after that.
import type { PolyRequest, PolyResponse } from './poly.worker';

export type { PolyResponse };
const workers: Partial<Record<'py' | 'php', Worker>> = {};
const loaded: Record<string, boolean> = {};
const ready: Partial<Record<'py' | 'php', Promise<void>>> = {};
let seq = 0;
const base = () => new URL(import.meta.env.BASE_URL, location.href).href;

function worker(lang: 'py' | 'php') {
  if (!workers[lang]) workers[lang] = new Worker(new URL('./poly.worker.ts', import.meta.url), { type: 'module' });
  return workers[lang]!;
}
function ask(lang: 'py' | 'php', msg: Record<string, unknown>, timeout: number): Promise<PolyResponse & { timedOut?: boolean }> {
  const w = worker(lang);
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate(); delete workers[lang]; delete ready[lang];
      resolve({ id, logs: [], values: {}, timedOut: true, error: { name: 'Timeout', line: 0, message: 'Your program ran for too long and was stopped. Does a loop never end?' } });
    }, timeout);
    const on = (e: MessageEvent<PolyResponse>) => { if (e.data.id !== id) return; clearTimeout(timer); w.removeEventListener('message', on); resolve(e.data); };
    w.addEventListener('message', on);
    w.postMessage({ ...msg, id, base: base() });
  });
}

/** Starts loading an interpreter in the background. */
export function warmUp(lang: 'py' | 'php') {
  if (!ready[lang]) ready[lang] = ask(lang, { warm: lang }, 90000).then(() => { loaded[lang] = true; });
  return ready[lang]!;
}
export const isWarm = (lang: 'py' | 'php') => !!loaded[lang];

/** Runs a program. The time limit starts once the interpreter is loaded. */
export async function runPoly(lang: 'py' | 'php', code: string, probe?: string, timeout = 6000): Promise<PolyResponse & { timedOut?: boolean }> {
  await warmUp(lang);
  loaded[lang] = true;
  const r = await ask(lang, { lang, code, probe } satisfies Omit<PolyRequest, 'id' | 'base'>, timeout);
  return r;
}
