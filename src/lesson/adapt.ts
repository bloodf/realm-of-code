// Lessons adapt to the player's pace (see course/adaptive.ts for the path side):
//  - struggling: the lesson starts with a warm-up of up to 2 questions they missed before
//  - strong: up to 2 easy true/false questions are skipped (a lesson keeps at least 5 questions)
import type { Exercise } from '../course/types';
import { exerciseByKey, isQuick, NODE_BY_ID } from '../course';
import { learnerPace } from '../course/adaptive';

export interface SessionItem { ex: Exercise; key: string; tag?: 'warmup' | 'refresher' }

const isTf = (e: Exercise) => e.t === 'choice' && e.options.length === 2 && e.options[0] === 'True';

export function adaptLesson(items: SessionItem[], nodeId: string, st: { history: { acc: number }[]; mistakes: Record<string, number>; done: Record<string, unknown> }): { items: SessionItem[]; note: string | null } {
  if (st.done[nodeId]) return { items, note: null };         // replays are never changed
  const { pace } = learnerPace(st.history);
  const courseId = NODE_BY_ID[nodeId]?.course.id;
  if (pace === 'strong') {
    const graded = items.filter((i) => i.ex.t !== 'teach').length;
    const canDrop = Math.min(2, graded - 5);
    if (canDrop <= 0) return { items, note: null };
    const drop = new Set(items.filter((i) => isTf(i.ex)).slice(0, canDrop).map((i) => i.key));
    if (!drop.size) return { items, note: null };
    return { items: items.filter((i) => !drop.has(i.key)), note: `Express lesson: you are on a roll, so ${drop.size === 1 ? 'one easy question was' : 'two easy questions were'} skipped.` };
  }
  if (pace === 'struggling') {
    const warm = Object.keys(st.mistakes)
      .filter((k) => !k.startsWith(nodeId + '#') && NODE_BY_ID[k.split('#')[0]]?.course.id === courseId)
      .map((k) => ({ k, x: exerciseByKey(k) }))
      .filter((w) => w.x && isQuick(w.x.ex) && w.x.ex.t !== 'match')
      .slice(-2)
      .map((w) => ({ ex: w.x!.ex, key: w.k, tag: 'warmup' as const }));
    if (!warm.length) return { items, note: null };
    return { items: [...warm, ...items], note: 'Warm-up first: a quick look at questions you missed before.' };
  }
  return { items, note: null };
}

/** The teach card that comes before an exercise in its lesson (for refreshers). */
export function teachBefore(key: string): SessionItem | null {
  const [nodeId, i] = key.split('#');
  const ex = NODE_BY_ID[nodeId]?.node.exercises;
  if (!ex) return null;
  for (let k = Number(i) - 1; k >= 0; k--) if (ex[k].t === 'teach') return { ex: ex[k], key: `${nodeId}#${k}`, tag: 'refresher' };
  return null;
}

/** Link style (rope board) for half of the matching exercises, so both mechanics appear. */
export function linkStyle(key: string, pairs: number) {
  if (pairs > 6) return false;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 2 === 0;
}
