// Small in-browser stand-ins for real tools, used by lessons inside the code worker:
//  - a test framework with the same API shape as Vitest/Jest (describe/test/expect)
//  - a mini Express (routing, params, query, JSON body, middleware, errors)
//  - a mock REST API for fetch() at https://api.realm.dev
import { formatValue } from './format';
import { eq } from './format';

export type Lib = 'test' | 'express' | 'fetch';

type Log = (text: string, level?: string) => void;

// ---------------- Test framework ----------------
export interface TestResult { name: string; pass: boolean; error?: string }

export function makeTestLib(log: Log) {
  const results: TestResult[] = [];
  const pending: Promise<unknown>[] = [];
  const prefix: string[] = [];

  function describe(name: string, fn: () => void) {
    prefix.push(name);
    try { fn(); } finally { prefix.pop(); }
  }

  function test(name: string, fn: () => unknown) {
    const full = [...prefix, name].join(' › ');
    const ok = () => { results.push({ name: full, pass: true }); log('✓ ' + full); };
    const bad = (e: unknown) => { const msg = (e as Error)?.message ?? String(e); results.push({ name: full, pass: false, error: msg }); log('✗ ' + full + '\n    ' + msg, 'error'); };
    try {
      const r = fn();
      if (r && typeof (r as Promise<unknown>).then === 'function') pending.push((r as Promise<unknown>).then(ok, bad));
      else ok();
    } catch (e) { bad(e); }
  }

  function expect(actual: unknown) {
    const show = (v: unknown) => formatValue(v, 0, false);
    const make = (negate: boolean) => {
      const check = (pass: boolean, msg: string) => {
        if (pass === negate) throw new Error((negate ? 'Expected NOT: ' : '') + msg);
      };
      return {
        toBe: (e: unknown) => check(Object.is(actual, e), `expected ${show(actual)} to be ${show(e)}`),
        toEqual: (e: unknown) => check(eq(JSON.parse(JSON.stringify(actual ?? null)), JSON.parse(JSON.stringify(e ?? null))), `expected ${show(actual)} to equal ${show(e)}`),
        toBeTruthy: () => check(!!actual, `expected ${show(actual)} to be truthy`),
        toBeFalsy: () => check(!actual, `expected ${show(actual)} to be falsy`),
        toBeNull: () => check(actual === null, `expected ${show(actual)} to be null`),
        toBeUndefined: () => check(actual === undefined, `expected ${show(actual)} to be undefined`),
        toBeDefined: () => check(actual !== undefined, `expected value to be defined`),
        toContain: (e: unknown) => check((typeof actual === 'string' || Array.isArray(actual)) && (actual as string | unknown[]).includes(e as never), `expected ${show(actual)} to contain ${show(e)}`),
        toHaveLength: (n: number) => check((actual as { length?: number })?.length === n, `expected length ${n}, got ${(actual as { length?: number })?.length}`),
        toBeGreaterThan: (n: number) => check((actual as number) > n, `expected ${show(actual)} to be greater than ${n}`),
        toBeLessThan: (n: number) => check((actual as number) < n, `expected ${show(actual)} to be less than ${n}`),
        toThrow: (m?: string) => {
          let threw = false; let msg = '';
          try { (actual as () => unknown)(); } catch (e) { threw = true; msg = (e as Error)?.message ?? ''; }
          check(threw && (!m || msg.includes(m)), m ? `expected function to throw "${m}"` : 'expected function to throw');
        },
      };
    };
    return Object.assign(make(false), { not: make(true) });
  }

  return { describe, test, it: test, expect, results, settle: () => Promise.all(pending) };
}

// ---------------- Mini Express ----------------
interface Route { method: string; path: string; handlers: Handler[] }
type Handler = (...args: unknown[]) => unknown;

export interface FakeResponse { status: number; body: unknown; headers: Record<string, string> }

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function makeExpress(log: Log) {
  function express() {
    const routes: Route[] = [];
    const middleware: { path: string; fn: Handler }[] = [];
    const add = (method: string) => (path: string, ...handlers: Handler[]) => { routes.push({ method, path, handlers }); return app; };
    const app = {
      use(a: string | Handler, b?: Handler) {
        if (typeof a === 'function') middleware.push({ path: '', fn: a });
        else if (b) middleware.push({ path: a, fn: b });
        return app;
      },
      get: add('GET'), post: add('POST'), put: add('PUT'), patch: add('PATCH'), delete: add('DELETE'),
      listen(port: number, cb?: () => void) { log(`🏰 Server listening on port ${port}`); cb?.(); return { close() {} }; },
      async handle(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<FakeResponse> {
        const u = new URL(url, 'http://localhost');
        const req = {
          method, url: u.pathname + u.search, path: u.pathname, params: {} as Record<string, string>,
          query: Object.fromEntries(u.searchParams), body: body ?? {}, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
          get(name: string) { return (this.headers as Record<string, string>)[name.toLowerCase()]; },
        };
        const out: FakeResponse = { status: 200, body: undefined, headers: {} };
        let finished = false;
        const res = {
          statusCode: 200,
          status(code: number) { out.status = code; res.statusCode = code; return res; },
          json(data: unknown) { out.body = JSON.parse(JSON.stringify(data ?? null)); out.headers['content-type'] = 'application/json'; finished = true; return res; },
          send(data: unknown) { out.body = data; finished = true; return res; },
          sendStatus(code: number) { out.status = code; out.body = String(code); finished = true; return res; },
          set(name: string, value: string) { out.headers[name.toLowerCase()] = value; return res; },
          end() { finished = true; return res; },
        };
        // Build the chain: middleware whose path prefix matches, then matching routes.
        const chain: { fn: Handler; params?: Record<string, string> }[] = [];
        for (const m of middleware) if (!m.path || u.pathname.startsWith(m.path)) chain.push({ fn: m.fn });
        for (const r of routes) {
          if (r.method !== method) continue;
          const params = matchPath(r.path, u.pathname);
          if (params) for (const h of r.handlers) chain.push({ fn: h, params });
        }
        let i = 0;
        let error: unknown = null;
        const run = async (): Promise<void> => {
          while (i < chain.length && !finished) {
            const { fn, params } = chain[i++];
            if (params) req.params = params;
            const isErrorHandler = fn.length === 4;
            if (error ? !isErrorHandler : isErrorHandler) continue;
            let calledNext = false;
            const next = (err?: unknown) => { calledNext = true; if (err) error = err; };
            try {
              await (error ? fn(error, req, res, next) : fn(req, res, next));
              if (error && isErrorHandler && !calledNext) error = null;
            } catch (e) { error = e; }
            if (!calledNext && !error) break;
          }
        };
        await run();
        if (error && !finished) {
          out.status = 500; out.body = { error: (error as Error)?.message ?? String(error) };
          log(`💥 ${method} ${u.pathname}: ${(error as Error)?.message ?? error}`, 'error');
        } else if (!finished && out.body === undefined) {
          out.status = 404; out.body = `Cannot ${method} ${u.pathname}`;
        }
        log(`→ ${method} ${req.url}${body !== undefined ? ' ' + formatValue(body, 0, false) : ''}   ← ${out.status} ${typeof out.body === 'string' ? out.body : formatValue(out.body, 0, false)}`);
        return out;
      },
    };
    return app;
  }
  express.json = () => (_req: unknown, _res: unknown, next: () => void) => next();
  express.urlencoded = () => (_req: unknown, _res: unknown, next: () => void) => next();

  /** Send a fake HTTP request to an app: `await request(app, "GET", "/knights")`. */
  const request = (app: { handle: (m: string, u: string, b?: unknown, h?: Record<string, string>) => Promise<FakeResponse> }, method: string, url: string, body?: unknown, headers?: Record<string, string>) =>
    app.handle(method.toUpperCase(), url, body, headers);

  return { express, request };
}

// ---------------- Mock REST API for fetch ----------------
export function makeFetch(log: Log) {
  const knights = [
    { id: 1, name: 'Ada', house: 'Lovelace', level: 12 },
    { id: 2, name: 'Bors', house: 'Ironhill', level: 7 },
    { id: 3, name: 'Cyra', house: 'Lovelace', level: 9 },
  ];
  const quests = [
    { id: 1, title: 'Slay the dragon', reward: 500, done: false },
    { id: 2, title: 'Find the lost goat', reward: 5, done: true },
    { id: 3, title: 'Deliver the royal letter', reward: 50, done: false },
  ];
  let nextId = 4;
  return async function fetch(input: string, init: { method?: string; body?: string; headers?: Record<string, string> } = {}) {
    const method = (init.method ?? 'GET').toUpperCase();
    log(`🕊 ${method} ${input}`);
    await new Promise((r) => setTimeout(r, 30));
    let status = 200;
    let data: unknown = null;
    const url = new URL(String(input), 'https://api.realm.dev');
    if (url.hostname !== 'api.realm.dev') throw new TypeError('Failed to fetch (only https://api.realm.dev works in this realm)');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'knights' && parts.length === 1 && method === 'GET') {
      const house = url.searchParams.get('house');
      data = house ? knights.filter((k) => k.house === house) : knights;
    } else if (parts[0] === 'knights' && parts.length === 2 && method === 'GET') {
      const k = knights.find((x) => x.id === Number(parts[1]));
      if (k) data = k; else { status = 404; data = { error: 'Knight not found' }; }
    } else if (parts[0] === 'knights' && parts.length === 1 && method === 'POST') {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(init.body ?? '{}'); } catch { status = 400; data = { error: 'Body must be JSON' }; }
      if (status === 200) {
        if (!body.name) { status = 400; data = { error: 'name is required' }; }
        else { status = 201; data = { id: nextId++, level: 1, ...body }; }
      }
    } else if (parts[0] === 'quests' && method === 'GET') {
      data = quests;
    } else if (parts[0] === 'weather') {
      data = { town: 'Codeshire', sky: 'cloudy', temperature: 14 };
    } else { status = 404; data = { error: 'Not found' }; }
    const text = JSON.stringify(data);
    return {
      ok: status >= 200 && status < 300, status, statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : status === 404 ? 'Not Found' : 'Bad Request',
      headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null) },
      json: async () => JSON.parse(text),
      text: async () => text,
    };
  };
}
