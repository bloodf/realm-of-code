/// <reference lib="webworker" />
// Type-checks TypeScript lessons with the real TypeScript compiler (loaded only
// when a TypeScript lesson is opened). Execution uses Sucrase on the main thread.
import ts from 'typescript';

const libs = import.meta.glob('/node_modules/typescript/lib/lib.{es,decorators}*.d.ts', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const LIB_TEXT = new Map<string, string>();
for (const [p, text] of Object.entries(libs)) LIB_TEXT.set(p.split('/').pop()!, text);

const GLOBALS = `
declare const console: {
  log(...data: any[]): void; info(...data: any[]): void; warn(...data: any[]): void;
  error(...data: any[]): void; table(...data: any[]): void; debug(...data: any[]): void;
};
declare const hero: {
  moveRight(steps?: number): void; moveLeft(steps?: number): void;
  moveUp(steps?: number): void; moveDown(steps?: number): void;
  move(dir: "up" | "down" | "left" | "right", steps?: number): void;
  attack(dir: "up" | "down" | "left" | "right"): boolean;
  look(dir: "up" | "down" | "left" | "right"): "empty" | "wall" | "tree" | "water" | "goblin" | "gem" | "exit" | "door" | "key";
  say(...msg: unknown[]): void;
  readonly x: number; readonly y: number; readonly gems: number; readonly keys: number;
};
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
`;

const options: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'], strict: true, noEmit: true,
  types: [], noUnusedLocals: false, allowUnreachableCode: true,
};

const cache = new Map<string, ts.SourceFile>();

function check(code: string) {
  const files: Record<string, string> = { 'spell.ts': code, 'globals.d.ts': GLOBALS };
  const host: ts.CompilerHost = {
    getSourceFile(name, lang) {
      if (files[name] !== undefined) return ts.createSourceFile(name, files[name], lang, true);
      const text = LIB_TEXT.get(name);
      if (text === undefined) return undefined;
      let sf = cache.get(name);
      if (!sf) { sf = ts.createSourceFile(name, text, lang, true); cache.set(name, sf); }
      return sf;
    },
    getDefaultLibFileName: () => 'lib.es2022.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (n) => files[n] !== undefined || LIB_TEXT.has(n),
    readFile: (n) => files[n] ?? LIB_TEXT.get(n),
    getCanonicalFileName: (n) => n,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };
  const program = ts.createProgram(['spell.ts', 'globals.d.ts'], options, host);
  const sf = program.getSourceFile('spell.ts')!;
  const diags = [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)];
  return diags.map((d) => {
    const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: -1 };
    return { line: pos.line + 1, message: ts.flattenDiagnosticMessageText(d.messageText, '\n'), code: d.code };
  });
}

self.onmessage = (e: MessageEvent<{ id: number; code: string }>) => {
  try {
    (self as unknown as Worker).postMessage({ id: e.data.id, diagnostics: check(e.data.code) });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: e.data.id, diagnostics: [{ line: 0, message: 'Type checker failed: ' + String(err), code: 0 }] });
  }
};
