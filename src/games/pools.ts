// Content for minigames, taken from lessons the player has already reached, so every
// game reviews what they just learned.
import { pathNodes, COURSE_BY_ID, type NodeRef } from '../course';
import type { Bug, Choice } from '../course/types';

export interface Pair { a: string; b: string }
export interface Pools { pairs: Pair[]; choices: Choice[]; bugs: Bug[]; corpus: string }

const short = (s: string, n: number) => s.length <= n && !s.includes('\n');

function collect(refs: NodeRef[]): Pools {
  const pairs: Pair[] = [];
  const choices: Choice[] = [];
  const bugs: Bug[] = [];
  const seen = new Set<string>();
  const text: string[] = [];
  for (const r of refs) {
    for (const ex of r.node.exercises) {
      text.push(JSON.stringify(ex));
      if (ex.t === 'match') {
        for (const [a, b] of ex.pairs) {
          if (!short(a, 40) || !short(b, 40) || seen.has(a)) continue;
          seen.add(a);
          pairs.push({ a, b });
        }
      } else if (ex.t === 'choice' && ex.options.length <= 4 && ex.options.every((o) => short(o, 48)) && !ex.code?.includes('\n\n') && ex.q.length < 160) {
        choices.push(ex);
      } else if (ex.t === 'bug' && ex.code.split('\n').length <= 8) {
        bugs.push(ex);
      }
    }
  }
  // The same left word can't be paired twice with different meanings in one round.
  const uniqB = new Set<string>();
  return { pairs: pairs.filter((p) => (uniqB.has(p.b) ? false : (uniqB.add(p.b), true))), choices, bugs, corpus: text.join('\n') };
}

/** Lessons before `beforeIndex` in the path: the same course first, then earlier ones if needed. */
export function poolsFor(pathId: string, courseId: string, beforeIndex: number, min = 8): Pools {
  const nodes = pathNodes(pathId).slice(0, beforeIndex);
  const same = nodes.filter((n) => n.course.id === courseId);
  let p = collect(same);
  if (p.pairs.length < min || p.choices.length < min) {
    const more = collect(nodes.filter((n) => n.course.id !== courseId).slice(-40));
    p = {
      pairs: p.pairs.length < min ? [...p.pairs, ...more.pairs.filter((x) => !p.pairs.some((y) => y.a === x.a || y.b === x.b))] : p.pairs,
      choices: p.choices.length < min ? [...p.choices, ...more.choices] : p.choices,
      bugs: p.bugs.length < 5 ? [...p.bugs, ...more.bugs] : p.bugs,
      corpus: p.corpus + '\n' + more.corpus,
    };
  }
  return p;
}

/** Everything learned so far on the path (the tavern arcade reviews all of it). */
export function poolsLearned(pathId: string, done: Record<string, unknown>): Pools {
  return collect(pathNodes(pathId).filter((n) => done[n.node.id]));
}

/** Everything from a course (for the arcade, where there is no path position). */
export function poolsForCourse(courseId: string, done: Record<string, unknown>): Pools {
  const c = COURSE_BY_ID[courseId];
  if (!c) return { pairs: [], choices: [], bugs: [], corpus: '' };
  const refs: NodeRef[] = [];
  c.units.forEach((u, ui) => u.lessons.forEach((n, li) => { if (done[n.id]) refs.push({ node: n, unit: u, course: c, unitIndex: ui, lessonIndex: li }); }));
  return collect(refs);
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
