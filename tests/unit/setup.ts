// Node has no localStorage: the game's save (zustand persist) and the "last seen" time use
// it, so the tests get a small in-memory one.
class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
// zustand's persist reads window.localStorage
if (typeof (globalThis as { window?: unknown }).window === 'undefined') Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true, writable: true });
