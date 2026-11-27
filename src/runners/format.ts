// Turns any JS value into a short readable string, similar to Node's console.log.
export function formatValue(v: unknown, depth = 0, top = true): string {
  if (typeof v === 'string') return top ? v : JSON.stringify(v);
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return `[Function: ${v.name || 'anonymous'}]`;
  if (typeof v === 'bigint') return v.toString() + 'n';
  if (typeof v !== 'object') return String(v);
  if (depth > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (Array.isArray(v)) {
    const parts = v.slice(0, 50).map((x) => formatValue(x, depth + 1, false));
    if (v.length > 50) parts.push(`... ${v.length - 50} more`);
    return `[ ${parts.join(', ')} ]`.replace('[  ]', '[]');
  }
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (v instanceof Map) return `Map(${v.size}) { ${[...v].map(([k, x]) => `${formatValue(k, depth + 1, false)} => ${formatValue(x, depth + 1, false)}`).join(', ')} }`;
  if (v instanceof Set) return `Set(${v.size}) { ${[...v].map((x) => formatValue(x, depth + 1, false)).join(', ')} }`;
  const entries = Object.entries(v as Record<string, unknown>);
  if (!entries.length) return '{}';
  const name = (v as object).constructor && (v as object).constructor !== Object ? (v as object).constructor.name + ' ' : '';
  return `${name}{ ${entries.map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${formatValue(x, depth + 1, false)}`).join(', ')} }`;
}

// Makes a value safe to send between threads (functions/classes become markers).
export function toPlain(v: unknown, depth = 0): unknown {
  if (v === undefined) return { __undef: true };
  if (v === null || typeof v !== 'object') {
    if (typeof v === 'function') return { __fn: (v as { name?: string }).name || 'anonymous' };
    if (typeof v === 'bigint') return Number(v);
    return v;
  }
  if (depth > 6) return null;
  if (Array.isArray(v)) return v.map((x) => toPlain(x, depth + 1));
  if (v instanceof Map) return { __map: [...v].map(([k, x]) => [toPlain(k), toPlain(x, depth + 1)]) };
  if (v instanceof Set) return { __set: [...v].map((x) => toPlain(x, depth + 1)) };
  if (v instanceof Error) return { __error: v.message };
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = toPlain(x, depth + 1);
  return out;
}

// Deep equality used by lesson checks.
export function eq(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => eq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
