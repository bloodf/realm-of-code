// Registry of courses and paths, plus progress helpers.
import { now } from '../game/clock';
import type { Course, Exercise, LessonNode, Path, Unit } from './types';
import { COURSES } from './courses';
import { PATHS } from './paths';

export { COURSES, PATHS };

export const COURSE_BY_ID: Record<string, Course> = Object.fromEntries(COURSES.map((c) => [c.id, c]));
export const PATH_BY_ID: Record<string, Path> = Object.fromEntries(PATHS.map((p) => [p.id, p]));

export interface NodeRef { node: LessonNode; unit: Unit; course: Course; unitIndex: number; lessonIndex: number }

export const NODE_BY_ID: Record<string, NodeRef> = {};
export const UNIT_BY_ID: Record<string, { unit: Unit; course: Course; unitIndex: number }> = {};
for (const course of COURSES) {
  course.units.forEach((unit, unitIndex) => {
    UNIT_BY_ID[unit.id] = { unit, course, unitIndex };
    unit.lessons.forEach((node, lessonIndex) => {
      if (NODE_BY_ID[node.id]) console.warn('Duplicate lesson id', node.id);
      NODE_BY_ID[node.id] = { node, unit, course, unitIndex, lessonIndex };
    });
  });
}

type Done = Record<string, unknown>;

/** Every lesson node of a path, in order. */
export function pathNodes(pathId: string): NodeRef[] {
  const path = PATH_BY_ID[pathId] ?? PATHS[0];
  return path.courses.flatMap((cid) => {
    const c = COURSE_BY_ID[cid];
    return c ? c.units.flatMap((u, ui) => u.lessons.map((n, li) => ({ node: n, unit: u, course: c, unitIndex: ui, lessonIndex: li }))) : [];
  });
}

/** Index of the first lesson not done yet (the "current" lesson). */
export function currentIndex(pathId: string, done: Done) {
  const nodes = pathNodes(pathId);
  const i = nodes.findIndex((n) => !done[n.node.id]);
  return i < 0 ? nodes.length : i;
}

export function isNodeOpen(pathId: string, nodeId: string, done: Done) {
  if (done[nodeId]) return true;
  const nodes = pathNodes(pathId);
  const idx = nodes.findIndex((n) => n.node.id === nodeId);
  if (idx < 0) {
    // not in the current path: open if the rest of its course before it is done
    const ref = NODE_BY_ID[nodeId];
    if (!ref) return false;
    const all = ref.course.units.flatMap((u) => u.lessons);
    const j = all.findIndex((n) => n.id === nodeId);
    return all.slice(0, j).every((n) => done[n.id]);
  }
  return idx <= currentIndex(pathId, done);
}

export function courseProgress(courseId: string, done: Done) {
  const c = COURSE_BY_ID[courseId];
  const all = c ? c.units.flatMap((u) => u.lessons) : [];
  const n = all.filter((l) => done[l.id]).length;
  return { done: n, total: all.length, pct: all.length ? Math.round((n / all.length) * 100) : 0 };
}

export function pathProgress(pathId: string, done: Done) {
  const nodes = pathNodes(pathId);
  const n = nodes.filter((x) => done[x.node.id]).length;
  return { done: n, total: nodes.length, pct: nodes.length ? Math.round((n / nodes.length) * 100) : 0 };
}

export function unitDone(unit: Unit, done: Done) {
  return unit.lessons.every((l) => done[l.id]);
}

/** Exercises that can be graded quickly (used for practice and unit tests). */
export const isQuick = (e: Exercise) => e.t === 'choice' || e.t === 'fill' || e.t === 'order' || e.t === 'type' || e.t === 'bug' || e.t === 'match';
export const isGraded = (e: Exercise) => e.t !== 'teach';

export const exKey = (nodeId: string, i: number) => `${nodeId}#${i}`;

export function exerciseByKey(key: string): { ex: Exercise; ref: NodeRef } | null {
  const [nodeId, i] = key.split('#');
  const ref = NODE_BY_ID[nodeId];
  const ex = ref?.node.exercises[Number(i)];
  return ex ? { ex, ref } : null;
}

export const lessonCount = () => Object.keys(NODE_BY_ID).length;
export const exerciseCount = () => Object.values(NODE_BY_ID).reduce((a, r) => a + r.node.exercises.filter(isGraded).length, 0);

/** Level for a skill from its XP (0..10). */
const SKILL_STEPS = [0, 40, 120, 250, 420, 650, 950, 1300, 1750, 2300, 3000];
export function skillLevel(xp: number) {
  let level = 0;
  while (level < 10 && xp >= SKILL_STEPS[level + 1]) level++;
  const from = SKILL_STEPS[level];
  const to = SKILL_STEPS[Math.min(10, level + 1)];
  return { level, into: xp - from, need: Math.max(1, to - from), max: level >= 10 };
}

/** 1..4 bars: how fresh a skill is (practice brings it back to 4). */
export function skillStrength(lastPracticed?: number) {
  if (!lastPracticed) return 0;
  const days = (now() - lastPracticed) / 86400000;
  return days < 3 ? 4 : days < 7 ? 3 : days < 14 ? 2 : 1;
}
