// Runs Python (Pyodide) and PHP (php-wasm) code in a worker. Both are WebAssembly builds
// loaded from our own site (public/py, public/php), so they work offline.
/// <reference lib="webworker" />

export interface PolyRequest { id: number; lang: 'py' | 'php'; code: string; probe?: string; base: string }
export interface PolyLog { text: string; level: 'log' | 'error'; line: number }
export interface PolyResponse { id: number; ready?: boolean; logs: PolyLog[]; values: Record<string, unknown>; error: { name: string; message: string; line: number } | null }

type Py = { runPythonAsync: (c: string, o?: unknown) => Promise<unknown>; runPython: (c: string, o?: unknown) => unknown; setStdout: (o: unknown) => void; setStderr: (o: unknown) => void; setStdin: (o: unknown) => void; globals: { get: (k: string) => unknown }; toPy: (o: unknown) => unknown };
let py: Py | null = null;
let php: { run: (c: string) => Promise<number>; addEventListener: (t: string, f: (e: { detail: string[] | string }) => void) => void; refresh?: () => Promise<void> } | null = null;
let out: string[] = [];
let err: string[] = [];

async function loadPy(base: string) {
  if (py) return py;
  const mod = await import(/* @vite-ignore */ base + 'py/pyodide.mjs');
  py = (await mod.loadPyodide({ indexURL: base + 'py/' })) as Py;
  py.setStdout({ batched: (s: string) => out.push(s) });
  py.setStderr({ batched: (s: string) => err.push(s) });
  py.setStdin({ stdin: () => null });
  return py;
}
async function loadPhp(base: string) {
  if (php) return php;
  // php-wasm was built for web pages: give it the few page objects it touches
  const g = self as unknown as Record<string, unknown>;
  if (!g.document) g.document = { currentScript: null, getElementById: () => null, querySelector: () => null, body: { style: {} }, documentElement: { style: {} }, addEventListener: () => {}, removeEventListener: () => {} };
  if (!g.window) g.window = self;
  const mod = await import(/* @vite-ignore */ base + 'php/PhpWeb.mjs');
  const p = new mod.PhpWeb({ version: '8.3' });
  p.addEventListener('output', (e: { detail: string[] | string }) => out.push(...([] as string[]).concat(e.detail)));
  p.addEventListener('error', (e: { detail: string[] | string }) => err.push(...([] as string[]).concat(e.detail)));
  php = p;
  return p;
}

async function runPy(req: PolyRequest): Promise<Omit<PolyResponse, 'id'>> {
  const p = await loadPy(req.base);
  out = []; err = [];
  const ns = p.runPython('dict()') as { destroy?: () => void };
  let error: PolyResponse['error'] = null;
  try {
    await p.runPythonAsync(req.code, { globals: ns, filename: '<main.py>' });
  } catch (e) {
    const msg = String((e as Error).message ?? e);
    const lines = msg.trim().split('\n');
    const last = lines[lines.length - 1] ?? msg;
    const m = [...msg.matchAll(/File "<main\.py>", line (\d+)/g)].pop();
    const [name, ...rest] = last.split(':');
    error = { name: name.trim() || 'Error', message: rest.join(':').trim() || last, line: m ? Number(m[1]) : 0 };
  }
  let values: Record<string, unknown> = {};
  if (!error && req.probe) {
    try {
      const json = await p.runPythonAsync(req.probe + '\nimport json as __j\n__j.dumps(__probe, default=str)', { globals: ns });
      values = JSON.parse(String(json));
    } catch (e) { values = { __probeError: String((e as Error).message ?? e).split('\n').pop() }; }
  }
  ns.destroy?.();
  const logs: PolyLog[] = [...out.join('\n').split('\n').filter((l, i, a) => l !== '' || i < a.length - 1).map((text) => ({ text, level: 'log' as const, line: 0 })), ...err.map((text) => ({ text, level: 'error' as const, line: 0 }))];
  return { logs: out.length ? logs : logs.filter((l) => l.text !== ''), values, error };
}

async function runPhp(req: PolyRequest): Promise<Omit<PolyResponse, 'id'>> {
  const p = await loadPhp(req.base);
  if (p.refresh) await p.refresh();
  out = []; err = [];
  let code = req.code.trim();
  if (!code.startsWith('<?php')) code = '<?php\n' + code;
  const marker = '@@PROBE@@';
  if (req.probe) code += `\n?><?php echo "\\n${marker}" . json_encode(${req.probe});`;
  await p.run(code);
  const all = out.join('');
  const [text, probe] = all.split(marker);
  let values: Record<string, unknown> = {};
  if (probe !== undefined) { try { values = JSON.parse(probe.trim()) ?? {}; } catch { values = {}; } }
  const m = text.match(/(Fatal error|Parse error):\s*([\s\S]*?) in php-wasm run script(?: on line |:)(\d+)/);
  const error = m ? { name: m[1] === 'Parse error' ? 'ParseError' : 'Error', message: m[2].replace(/^Uncaught \w+: /, '').replace(/\s+/g, ' ').trim(), line: Number(m[3]) } : err.length ? { name: 'Error', message: err.join(' ').trim(), line: 0 } : null;
  const clean = (m ? text.slice(0, m.index) : text).replace(/ in php-wasm run script on line (\d+)/g, ' (line $1)').replace(/\n+$/, '');
  const lines = clean ? clean.split('\n') : [];
  return { logs: lines.map((t) => ({ text: t, level: (/^(Warning|Notice|Deprecated):/.test(t) ? 'error' : 'log') as PolyLog['level'], line: 0 })), values: error ? {} : values, error };
}

self.onmessage = async (e: MessageEvent<PolyRequest | { id: number; warm: 'py' | 'php'; base: string }>) => {
  const d = e.data;
  try {
    if ('warm' in d) { if (d.warm === 'py') await loadPy(d.base); else await loadPhp(d.base); (self as unknown as Worker).postMessage({ id: d.id, ready: true, logs: [], values: {}, error: null }); return; }
    const r = d.lang === 'py' ? await runPy(d) : await runPhp(d);
    (self as unknown as Worker).postMessage({ id: d.id, ...r });
  } catch (x) {
    (self as unknown as Worker).postMessage({ id: d.id, logs: [], values: {}, error: { name: 'Error', message: String((x as Error).message ?? x), line: 0 } });
  }
};
