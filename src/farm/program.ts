// A tiny tree format for block programs. Level solutions are written in it, and it can be
// turned into JavaScript (for the checker) or into Blockly's JSON (to show a solution).
import type { Crop, Dir } from './sim.ts';

export type Cond = ['isDry'] | ['isRipe'] | ['hasCrop'] | ['hasWeed'] | ['isGrass'] | ['isField'] | ['canMove', Dir] | ['not', Cond];
export type Stmt =
  | ['move', Dir] | ['plant', Crop] | ['water'] | ['sleep'] | ['harvest'] | ['till'] | ['pullWeed'] | ['nextRow'] | ['refill'] | ['say', string]
  | ['repeat', number, Stmt[]] | ['while', Cond, Stmt[]] | ['if', Cond, Stmt[]] | ['ifelse', Cond, Stmt[], Stmt[]];

function cond(c: Cond): string {
  switch (c[0]) {
    case 'not': return `!${cond(c[1])}`;
    case 'canMove': return `canMove("${c[1]}")`;
    default: return `${c[0]}()`;
  }
}

export function toJs(prog: Stmt[], ind = ''): string {
  return prog.map((s) => {
    switch (s[0]) {
      case 'move': return `${ind}move("${s[1]}");`;
      case 'plant': return `${ind}plant("${s[1]}");`;
      case 'say': return `${ind}say(${JSON.stringify(s[1])});`;
      case 'repeat': return `${ind}for (let i = 0; i < ${s[1]}; i++) {\n${toJs(s[2], ind + '  ')}\n${ind}}`;
      case 'while': return `${ind}while (${cond(s[1])}) {\n${toJs(s[2], ind + '  ')}\n${ind}}`;
      case 'if': return `${ind}if (${cond(s[1])}) {\n${toJs(s[2], ind + '  ')}\n${ind}}`;
      case 'ifelse': return `${ind}if (${cond(s[1])}) {\n${toJs(s[2], ind + '  ')}\n${ind}} else {\n${toJs(s[3], ind + '  ')}\n${ind}}`;
      default: return `${ind}${s[0]}();`;
    }
  }).join('\n');
}

const condCount = (c: Cond): number => (c[0] === 'not' ? 1 + condCount(c[1]) : 1);

/** Number of blocks (not counting the "when run" block or number fields). */
export function blockCount(prog: Stmt[]): number {
  return prog.reduce((n, s) => {
    switch (s[0]) {
      case 'repeat': return n + 1 + blockCount(s[2]);
      case 'while': case 'if': return n + 1 + condCount(s[1]) + blockCount(s[2]);
      case 'ifelse': return n + 1 + condCount(s[1]) + blockCount(s[2]) + blockCount(s[3]);
      default: return n + 1;
    }
  }, 0);
}

/** Lines that count for the "short code" star: no blank lines, comments or lone braces. */
export function codeLines(code: string): number {
  return code.split('\n').map((l) => l.replace(/\/\/.*$/, '').trim()).filter((l) => l && !/^[{}();]+$/.test(l)).length;
}

// ---------- Blockly JSON (serialization format) ----------
type BJ = Record<string, unknown>;

function condJson(c: Cond): BJ {
  switch (c[0]) {
    case 'not': return { type: 'logic_negate', inputs: { BOOL: { block: condJson(c[1]) } } };
    case 'canMove': return { type: 'farm_can_move', fields: { DIR: c[1] } };
    default: return { type: 'farm_' + c[0].replace(/[A-Z]/g, (m) => '_' + m.toLowerCase()) };
  }
}

function stmtJson(s: Stmt): BJ {
  switch (s[0]) {
    case 'move': return { type: 'farm_move', fields: { DIR: s[1] } };
    case 'plant': return { type: 'farm_plant', fields: { CROP: s[1] } };
    case 'say': return { type: 'farm_say', fields: { TEXT: s[1] } };
    case 'repeat': return { type: 'farm_repeat', fields: { TIMES: s[1] }, inputs: chain(s[2], 'DO') };
    case 'while': return { type: 'farm_while', inputs: { COND: { block: condJson(s[1]) }, ...chain(s[2], 'DO') } };
    case 'if': return { type: 'farm_if', inputs: { COND: { block: condJson(s[1]) }, ...chain(s[2], 'DO') } };
    case 'ifelse': return { type: 'farm_ifelse', inputs: { COND: { block: condJson(s[1]) }, ...chain(s[2], 'DO'), ...chain(s[3], 'ELSE') } };
    case 'pullWeed': return { type: 'farm_pull_weed' };
    case 'nextRow': return { type: 'farm_next_row' };
    default: return { type: 'farm_' + s[0] };
  }
}

function linked(prog: Stmt[]): BJ | undefined {
  if (!prog.length) return undefined;
  const [first, ...rest] = prog;
  const b = stmtJson(first);
  const next = linked(rest);
  if (next) b.next = { block: next };
  return b;
}

function chain(prog: Stmt[], input: string): BJ {
  const b = linked(prog);
  return b ? { [input]: { block: b } } : {};
}

/** A whole workspace: the "when run" block with the program under it. */
export function toBlocklyJson(prog: Stmt[]): BJ {
  const start: BJ = { type: 'farm_start', x: 20, y: 20, deletable: false };
  const body = linked(prog);
  if (body) start.next = { block: body };
  return { blocks: { languageVersion: 0, blocks: [start] } };
}
