// Content integrity: every course, lesson and exercise is well formed, and the solutions of
// the exercises that can run outside the browser really solve them. (All 365 lessons are
// also played in a real browser by tests/verify-lessons.cjs.)
import { describe, expect, test } from 'vitest';
import initSqlJs from 'sql.js';
import { transform } from 'sucrase';
import { COURSES, PATHS, NODE_BY_ID, lessonCount, exerciseCount, pathNodes, currentIndex, isNodeOpen, courseProgress } from '../../src/course';
import type { Exercise, Sql, Terminal } from '../../src/course/types';
import type { GridLesson } from '../../src/content/types';
import { ALL_CODE_LESSONS as CODE_LESSONS } from '../../src/content';
import { Shell } from '../../src/runners/shell';
import { formatValue } from '../../src/runners/format';
import { createSim, Victory, Defeat } from '../../src/grid/world';

const all: { id: string; ex: Exercise; i: number }[] = [];
for (const c of COURSES) for (const u of c.units) for (const n of u.lessons) n.exercises.forEach((ex, i) => all.push({ id: `${n.id}#${i}`, ex, i }));
const of = <T extends Exercise['t']>(t: T) => all.filter((x) => x.ex.t === t) as unknown as { id: string; ex: Extract<Exercise, { t: T }> }[];

describe('courses and paths', () => {
  test('20 courses from web basics to career skills', () => {
    expect(COURSES.map((c) => c.id)).toEqual(['web', 'html', 'css', 'js', 'tools', 'api', 'ts', 'tailwind', 'react', 'vue', 'svelte', 'node', 'python', 'php', 'sql', 'nosql', 'algo', 'testing', 'quality', 'career']);
  });
  test('at least 365 lessons and 1,000 graded exercises', () => {
    expect(lessonCount()).toBeGreaterThanOrEqual(365);
    expect(exerciseCount()).toBeGreaterThanOrEqual(1000);
  });
  test('ids are unique', () => {
    const nodes = COURSES.flatMap((c) => c.units.flatMap((u) => u.lessons.map((l) => l.id)));
    expect(new Set(nodes).size).toBe(nodes.length);
    const units = COURSES.flatMap((c) => c.units.map((u) => u.id));
    expect(new Set(units).size).toBe(units.length);
  });
  test('every unit has lessons and a guidebook', () => {
    for (const c of COURSES) for (const u of c.units) {
      expect(u.lessons.length, u.id).toBeGreaterThan(0);
      expect(u.guide.length, u.id).toBeGreaterThan(20);
    }
  });
  test('paths use known courses; the trainee path goes from zero to junior engineer', () => {
    const ids = new Set(COURSES.map((c) => c.id));
    for (const p of PATHS) for (const c of p.courses) expect(ids.has(c), `${p.id}: ${c}`).toBe(true);
    const trainee = PATHS.find((p) => p.id === 'trainee')!;
    expect(trainee.courses[0]).toBe('web');
    expect(trainee.courses).toContain('career');
    expect(PATHS.map((p) => p.id)).toEqual(expect.arrayContaining(['frontend-react', 'backend-node', 'backend-python', 'backend-php', 'fullstack', 'trainee']));
  });
  test('lessons open one after the other along a path', () => {
    const nodes = pathNodes('trainee');
    const done: Record<string, unknown> = {};
    expect(currentIndex('trainee', done)).toBe(0);
    expect(isNodeOpen('trainee', nodes[0].node.id, done)).toBe(true);
    expect(isNodeOpen('trainee', nodes[1].node.id, done)).toBe(false);
    done[nodes[0].node.id] = 1;
    expect(isNodeOpen('trainee', nodes[1].node.id, done)).toBe(true);
    expect(courseProgress(nodes[0].course.id, done).done).toBe(1);
  });
});

describe('exercises are well formed', () => {
  test('multiple choice: the answer exists and options are different', () => {
    for (const { id, ex } of of('choice')) {
      expect(ex.answer, id).toBeGreaterThanOrEqual(0);
      expect(ex.answer, id).toBeLessThan(ex.options.length);
      expect(new Set(ex.options).size, id).toBe(ex.options.length);
    }
  });
  test('fill the blanks: one answer per blank, and distractors are not answers', () => {
    for (const { id, ex } of of('fill')) {
      expect(ex.code.split('___').length - 1, id).toBe(ex.answers.length);
      for (const d of ex.distractors) expect(ex.answers.includes(d), `${id}: ${d}`).toBe(false);
    }
  });
  test('order the lines: at least two lines', () => {
    for (const { id, ex } of of('order')) expect(ex.lines.length, id).toBeGreaterThanOrEqual(2);
  });
  test('match the pairs: at least two pairs, no duplicates', () => {
    for (const { id, ex } of of('match')) {
      expect(ex.pairs.length, id).toBeGreaterThanOrEqual(2);
      expect(new Set(ex.pairs.map((p) => p[0])).size, id).toBe(ex.pairs.length);
    }
  });
  test('type the answer: at least one accepted answer', () => {
    for (const { id, ex } of of('type')) expect(ex.answers.filter((a) => a.trim()).length, id).toBeGreaterThan(0);
  });
  test('find the bug: the line is inside the code', () => {
    for (const { id, ex } of of('bug')) {
      const lines = ex.code.split('\n').length;
      expect(ex.line, id).toBeGreaterThanOrEqual(0);
      expect(ex.line, id).toBeLessThan(lines + 1);
    }
  });
  test('coding challenges have a title, a task, hints and checks', () => {
    for (const l of CODE_LESSONS) {
      expect(l.title && l.task, l.id).toBeTruthy();
      expect(l.hints.length, l.id).toBeGreaterThan(0);
      const checks = l.kind === 'grid' ? Object.keys(l.goals).length + (l.checks?.length ?? 0) : l.checks.length;
      expect(checks, l.id).toBeGreaterThan(0);
    }
  });
  test('every lesson node is reachable by id', () => {
    for (const c of COURSES) for (const u of c.units) for (const n of u.lessons) expect(NODE_BY_ID[n.id].node).toBe(n);
  });
});

describe('solutions that run outside the browser', () => {
  test('terminal lessons: the solution commands reach the goal, and doing nothing does not', () => {
    const list = of('terminal') as { id: string; ex: Terminal }[];
    expect(list.length).toBeGreaterThan(5);
    for (const { id, ex } of list) {
      expect(ex.check(new Shell(ex.setup, ex.cwd)), `${id} passes with no commands`).toBe(false);
      const sh = new Shell(ex.setup, ex.cwd);
      for (const cmd of ex.solution) sh.run(cmd);
      expect(ex.check(sh), `${id}: ${ex.solution.join(' ; ')}`).toBe(true);
    }
  });

  test('SQL lessons: the solution runs on the lesson database and the starter is not already the answer', async () => {
    const SQL = await initSqlJs();
    const run = (ex: Sql, q: string) => {
      const db = new SQL.Database();
      db.exec(ex.db);
      const res = db.exec(q);
      const out = ex.after ? db.exec(ex.after) : res;
      db.close();
      const last = out[out.length - 1];
      return last ? JSON.stringify([last.columns, ex.ordered ? last.values : last.values.map((r) => JSON.stringify(r)).sort()]) : '[]';
    };
    const list = of('sql') as { id: string; ex: Sql }[];
    expect(list.length).toBeGreaterThan(10);
    for (const { id, ex } of list) {
      const want = run(ex, ex.solution);
      expect(want, id).not.toBe('[]');
      let start = 'error';
      try { start = run(ex, ex.starter); } catch { /* an unfinished query */ }
      expect(start, `${id}: the starter already passes`).not.toBe(want);
    }
  });

  test('hero grid lessons: the solution wins and the starter does not', async () => {
    const grids = CODE_LESSONS.filter((l): l is GridLesson => l.kind === 'grid');
    expect(grids.length).toBeGreaterThan(10);
    const play = async (l: GridLesson, source: string) => {
      const code = l.lang === 'ts' ? transform(source, { transforms: ['typescript'] }).code : source;
      const sim = createSim(l.map, () => 0);
      const logs: string[] = [];
      const log = (...a: unknown[]) => { logs.push(a.map((x) => formatValue(x)).join(' ')); };
      const quiet = { log, info: log, warn: log, error: log, table: log, debug: log };
      const AsyncFn = Object.getPrototypeOf(async () => {}).constructor;
      try { await new AsyncFn('hero', 'console', code)(sim.hero, quiet); } catch (e) { if (!(e instanceof Victory) && !(e instanceof Defeat)) return false; }   // an error never wins
      const r = sim.result();
      const g = l.goals;
      const goals = (!g.exit || r.escaped) && (!g.gems || (g.gems === 'all' ? r.gems === r.gemsTotal : r.gems >= g.gems)) && (!g.goblins || r.goblins === r.goblinsTotal);
      const ctx = { code: source, result: r, logs };
      const extra = await Promise.all((l.checks ?? []).filter((c) => !c.bonus).map((c) => c.test(ctx)));
      return goals && extra.every(Boolean);
    };
    for (const l of grids) {
      expect(await play(l, l.solution), `${l.id} solution`).toBe(true);
      expect(await play(l, l.starter), `${l.id} starter already wins`).toBe(false);
    }
  });
});
