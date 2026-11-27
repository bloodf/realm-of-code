// Main-thread API for the SQL worker.
import type { SqlResponse, SqlTable } from './sql.worker';
import SqlWorker from './sql.worker?worker';

export type { SqlTable };

let worker: Worker | null = null;
let seq = 0;

export function runSql(setup: string, query: string, after?: string, timeoutMs = 15000): Promise<Omit<SqlResponse, 'id'>> {
  if (!worker) worker = new SqlWorker();
  const w = worker;
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate();
      worker = null;
      resolve({ result: null, error: 'The query ran for too long and was stopped.' });
    }, timeoutMs);
    const on = (e: MessageEvent<SqlResponse>) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', on);
      resolve(e.data);
    };
    w.addEventListener('message', on);
    w.postMessage({ id, setup, query, after });
  });
}

const norm = (v: unknown) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);

/** True when two result tables contain the same rows (in order if `ordered`). */
export function sameTable(a: SqlTable | null, b: SqlTable | null, ordered = false) {
  if (!a || !b) return false;
  if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
  const ra = a.rows.map((r) => JSON.stringify(r.map(norm)));
  const rb = b.rows.map((r) => JSON.stringify(r.map(norm)));
  if (!ordered) { ra.sort(); rb.sort(); }
  return ra.every((r, i) => r === rb[i]);
}

/** Lists the tables of a setup script with their columns and rows (for the schema preview). */
export async function describeDb(setup: string) {
  const names = await runSql(setup, "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY rowid");
  const tables: { name: string; table: SqlTable }[] = [];
  for (const [name] of names.result?.rows ?? []) {
    const t = await runSql(setup, `SELECT * FROM "${String(name)}"`);
    if (t.result) tables.push({ name: String(name), table: t.result });
  }
  return tables;
}
