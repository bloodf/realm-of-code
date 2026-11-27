// Developer page: proves the content works. Open #/dev/verify (or #/dev/verify/<course>).
// - coding challenges: the solution passes every objective (incl. bonus), the starter does not
// - SQL: the solution returns rows; the starter does not already match
// - terminal: the solution commands reach the goal; the start state does not
// - quick exercises: well-formed, and "what does this print" answers are checked by running the code
import { COURSES } from '../course';
import type { Exercise } from '../course/types';
import type { Lesson } from '../content/types';
import { runLesson, solutionFiles, lessonFiles } from '../runners/engine';
import { runJs } from '../runners/code';
import { runPoly } from '../runners/poly';
import { runSql, sameTable } from '../runners/sql';
import { Shell } from '../runners/shell';

interface Row { id: string; ok: boolean; note: string }
declare global { interface Window { __verify?: { done: boolean; rows: Row[]; counts: Record<string, number> } } }

function structural(ex: Exercise): string | null {
  switch (ex.t) {
    case 'choice':
      if (ex.answer < 0 || ex.answer >= ex.options.length) return 'answer index out of range';
      if (new Set(ex.options).size !== ex.options.length) return 'duplicate options';
      return null;
    case 'fill': {
      const blanks = ex.code.split('___').length - 1;
      if (blanks !== ex.answers.length) return `${blanks} blanks but ${ex.answers.length} answers`;
      return null;
    }
    case 'order': return ex.lines.length < 2 ? 'needs 2+ lines' : null;
    case 'match': {
      if (ex.pairs.length < 2) return 'needs 2+ pairs';
      if (new Set(ex.pairs.map((p) => p[0])).size !== ex.pairs.length || new Set(ex.pairs.map((p) => p[1])).size !== ex.pairs.length) return 'duplicate match items';
      return null;
    }
    case 'type': return ex.answers.length ? null : 'no answers';
    case 'bug': return ex.line >= 1 && ex.line <= ex.code.split('\n').length ? null : 'bug line out of range';
    case 'teach': return ex.body.length > 10 ? null : 'empty teach card';
    default: return null;
  }
}

/** Builds the verifier page inside `root` and runs every check. */
export function runVerify(root: HTMLElement, filter?: string) {
  root.className = 'verify-page';
  const h = document.createElement('h2');
  h.textContent = 'Content verifier · running...';
  const frameEl = document.createElement('iframe');
  frameEl.title = 'verify';
  Object.assign(frameEl.style, { width: '800px', height: '500px', background: 'white', float: 'right' });
  frameEl.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
  const list = document.createElement('div');
  root.append(h, frameEl, list);
  const frame = { current: frameEl };
  const counts: Record<string, number> = { lessons: 0, exercises: 0, code: 0, sql: 0, terminal: 0, output: 0 };
  window.__verify = { done: false, rows: [], counts };
  const push = (r: Row) => {
    window.__verify!.rows.push(r);
    const d = document.createElement('div');
    d.style.color = r.ok ? '#3a7a2c' : '#a8332f';
    d.style.whiteSpace = 'pre-wrap';
    d.textContent = `${r.ok ? 'OK ' : 'BAD'} ${r.id} ${r.note}`;
    list.appendChild(d);
    h.textContent = `Content verifier · running (${window.__verify!.rows.length})...`;
  };
  void (async () => {
      const seenCode = new Set<string>();
      for (const course of COURSES) {
        if (filter && course.id !== filter) continue;
        for (const unit of course.units) for (const node of unit.lessons) {
          counts.lessons++;
          const problems: string[] = [];
          for (const [i, ex] of node.exercises.entries()) {
            counts.exercises++;
            const tag = `${node.id}#${i} (${ex.t})`;
            const s = structural(ex);
            if (s) problems.push(`${tag}: ${s}`);
            try {
              if (ex.t === 'choice' && ex.run && ex.code) {
                counts.output++;
                const r = ex.lang === 'py' || ex.lang === 'php' ? await runPoly(ex.lang, ex.code, undefined, 15000) : await runJs({ kind: 'console', code: ex.code });
                const printed = r.logs.map((l) => l.text).join('\n');
                if (r.error) problems.push(`${tag}: code error ${r.error.message}`);
                else if (printed !== ex.options[ex.answer]) problems.push(`${tag}: prints ${JSON.stringify(printed)} but the answer is ${JSON.stringify(ex.options[ex.answer])}`);
                const alsoRight = ex.options.filter((o, k) => k !== ex.answer && o === printed);
                if (alsoRight.length) problems.push(`${tag}: another option is also correct`);
              }
              if (ex.t === 'code' && !seenCode.has(ex.lesson.id)) {
                seenCode.add(ex.lesson.id);
                counts.code++;
                const l: Lesson = ex.lesson;
                const sol = await runLesson(l, solutionFiles(l), frame.current);
                const st = await runLesson(l, Object.fromEntries(lessonFiles(l).map((f) => [f.name, f.code])), frame.current);
                if (!sol.passed) problems.push(`${tag} ${l.id}: solution fails: ${sol.results.filter((r) => !r.pass).map((r) => r.label).join(' | ')} ${sol.error?.message ?? ''} ${sol.tsDiagnostics.map((d) => d.message).join('; ')} LOGS: ${JSON.stringify(sol.logs.map((x) => x.text)).slice(0, 300)}`);
                else if (!sol.bonusPassed) problems.push(`${tag} ${l.id}: solution misses a bonus objective`);
                if (st.passed) problems.push(`${tag} ${l.id}: starter already passes`);
              }
              if (ex.t === 'sql') {
                counts.sql++;
                const sol = await runSql(ex.db, ex.solution, ex.after);
                const st = await runSql(ex.db, ex.starter, ex.after);
                if (sol.error) problems.push(`${tag}: solution error ${sol.error}`);
                else if (!sol.result || (!sol.result.rows.length && !ex.after)) problems.push(`${tag}: solution returns no rows`);
                if (!st.error && sameTable(st.result, sol.result, ex.ordered)) problems.push(`${tag}: starter already matches`);
              }
              if (ex.t === 'terminal') {
                counts.terminal++;
                const sh = new Shell(ex.setup, ex.cwd);
                if (ex.check(sh)) problems.push(`${tag}: goal already met at start`);
                for (const c of ex.solution) sh.run(c);
                if (!ex.check(sh)) problems.push(`${tag}: solution does not reach the goal`);
              }
            } catch (e) { problems.push(`${tag}: crash ${(e as Error).message}`); }
          }
          if (!node.exercises.length) problems.push('no exercises');
          push({ id: node.id, ok: problems.length === 0, note: problems.join('\n') });
        }
      }
      window.__verify!.done = true;
      const bad = window.__verify!.rows.filter((r) => !r.ok).length;
      h.textContent = `Content verifier · done: ${window.__verify!.rows.length - bad}/${window.__verify!.rows.length} lessons ok`;
  })();
}
