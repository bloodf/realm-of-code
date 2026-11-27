/// <reference lib="webworker" />
// Runs SQL on a fresh in-memory SQLite database (sql.js = SQLite compiled to WebAssembly).
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let SQL: Promise<SqlJsStatic> | null = null;

export interface SqlRequest { id: number; setup: string; query: string; after?: string }
export interface SqlTable { columns: string[]; rows: unknown[][] }
export interface SqlResponse { id: number; result: SqlTable | null; error: string | null; changes?: number }

self.onmessage = async (e: MessageEvent<SqlRequest>) => {
  const { id, setup, query, after } = e.data;
  try {
    SQL ??= initSqlJs({ locateFile: () => wasmUrl });
    const S = await SQL;
    const db = new S.Database();
    db.exec(setup);
    let result: SqlTable | null = null;
    let error: string | null = null;
    try {
      const res = db.exec(query);
      const last = res[res.length - 1];
      result = last ? { columns: last.columns, rows: last.values } : { columns: [], rows: [] };
      if (after) {
        const a = db.exec(after);
        const l = a[a.length - 1];
        result = l ? { columns: l.columns, rows: l.values } : { columns: [], rows: [] };
      }
    } catch (err) {
      error = (err as Error).message;
    }
    const changes = db.getRowsModified();
    db.close();
    (self as unknown as Worker).postMessage({ id, result, error, changes } satisfies SqlResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, result: null, error: 'The archive could not open: ' + (err as Error).message } satisfies SqlResponse);
  }
};
