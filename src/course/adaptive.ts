// The adaptive path. The course content is fixed, but the path the player walks is built
// from it at run time and changes with how well they are doing:
//  - a lesson finished with under 75% accuracy (first try) adds a REVIEW stop right after it.
//    The review must be done before new lessons open. It never costs hearts.
//  - every unit has a MINIGAME stop in the middle (optional, earns lightbulbs, torches and potions).
//  - a player on a strong run gets a FAST TRACK stop: a short test to skip the rest of the unit.
//  - lessons themselves adapt too (see lesson/adapt.ts): warm-ups for struggling players,
//    fewer easy questions for strong ones, and a refresher card after two misses in a row.
import type { Course, Unit } from './types';
import type { GameId, GameRecord, ReviewStop } from '../game/store';
import { pathNodes, type NodeRef } from '.';
import { poolsFor } from '../games/pools';

export type Pace = 'new' | 'struggling' | 'steady' | 'strong';

export function learnerPace(history: { acc: number }[]): { pace: Pace; avg: number; n: number } {
  const last = history.slice(-5);
  if (last.length < 3) return { pace: 'new', avg: 0, n: last.length };
  const avg = Math.round(last.reduce((a, h) => a + h.acc, 0) / last.length);
  return { pace: avg >= 90 ? 'strong' : avg < 70 ? 'struggling' : 'steady', avg, n: last.length };
}

export const PACE_TEXT: Record<Pace, { title: string; text: string }> = {
  new: { title: 'Getting to know you', text: 'Finish a few lessons and your path will adapt to your pace.' },
  struggling: { title: 'Slow and sure', text: 'Lessons start with a warm-up, tough ones get a review stop, and reviews never cost hearts.' },
  steady: { title: 'Nice and steady', text: 'Tough lessons get a review stop, and a minigame waits in the middle of every unit.' },
  strong: { title: 'You are flying!', text: 'Lessons skip the easiest questions, and shortcuts appear to test out of units.' },
};

export type StopState = 'done' | 'current' | 'open' | 'locked';

export type Stop =
  | { kind: 'lesson'; id: string; ref: NodeRef; index: number }
  | { kind: 'review'; id: string; lessonId: string; pending: boolean }
  | { kind: 'game'; id: string; game: GameId; afterIndex: number; courseId: string }
  | { kind: 'fast'; id: string; targetUnitId: string };

export interface PlanState {
  done: Record<string, unknown>;
  reviews: Record<string, ReviewStop>;
  games: Record<string, GameRecord>;
  history: { acc: number }[];
}

/** The first review stop that is not finished yet (it blocks new lessons). */
export function pendingReview(reviews: Record<string, ReviewStop>): string | null {
  const open = Object.entries(reviews).filter(([, r]) => !r.done).sort((a, b) => a[1].at - b[1].at);
  return open[0]?.[0] ?? null;
}

const SPECIFIC: Record<string, GameId[]> = {
  css: ['archery'], tailwind: ['archery'], sql: ['archive'],
  js: ['loop', 'bughunt'], ts: ['loop', 'bughunt'], react: ['bughunt'], node: ['bughunt'], testing: ['bughunt'], vue: ['bughunt'], svelte: ['bughunt'],
};

/** Which minigame sits in a unit. Games need enough learned content, so some fall back. */
export function gameFor(pathId: string, courseId: string, unitIndex: number, afterIndex: number): GameId {
  const list: GameId[] = [...(SPECIFIC[courseId] ?? []), 'link', 'torchrun', 'gemforge', 'memory', 'typist'];
  const pools = poolsFor(pathId, courseId, afterIndex + 1);
  const ok = (g: GameId) => {
    switch (g) {
      case 'link': return pools.pairs.length >= 6;
      case 'memory': return pools.pairs.filter((p) => p.a.length <= 24 && p.b.length <= 24).length >= 6;
      case 'torchrun': return pools.choices.length >= 4;
      case 'gemforge': return pools.choices.length >= 2;
      case 'bughunt': return pools.bugs.length >= 4;
      case 'loop': return /for \(|while \(/.test(pools.corpus);
      case 'archive': return /WHERE/.test(pools.corpus);
      case 'archery': return /\.[a-z][\w-]*\s*\{|#[a-z][\w-]*\s*\{/.test(pools.corpus);
      default: return true;
    }
  };
  for (let k = 0; k < list.length; k++) {
    const g = list[(unitIndex + k) % list.length];
    if (ok(g)) return g;
  }
  return 'torchrun';
}

export const GAME_INFO: Record<GameId, { name: string; icon: string; color: string; npc: string; blurb: string }> = {
  link: { name: 'Rune Link', icon: 'rune', color: '#3f8fd6', npc: 'react', blurb: 'Link each rune to its meaning before the sand runs out.' },
  memory: { name: 'Memory Crypt', icon: 'skull', color: '#6a5a8a', npc: 'quality', blurb: 'Flip the tiles and find the matching pairs.' },
  torchrun: { name: 'Torch Run', icon: 'flame', color: '#d9782a', npc: 'node', blurb: 'Answer quick questions before your torch burns out. Right answers feed the flame.' },
  bughunt: { name: 'Bug Hunt', icon: 'bug', color: '#3d6b3a', npc: 'testing', blurb: 'Each spell has one broken line. Find it before the torch burns out.' },
  archery: { name: 'Selector Archery', icon: 'bow', color: '#7a5230', npc: 'css', blurb: 'Write CSS selectors that hit every glowing target and nothing else.' },
  archive: { name: 'Archive Hunt', icon: 'database', color: '#a8813a', npc: 'sql', blurb: 'Read the query and pick exactly the rows it returns.' },
  loop: { name: 'Loop Bridge', icon: 'loop', color: '#2f7a46', npc: 'js', blurb: 'Count how many times each loop runs, and the hero builds the bridge plank by plank.' },
  gemforge: { name: 'Gem Forge', icon: 'gem', color: '#a66be0', npc: 'tailwind', blurb: 'Swap gems to make rows of three. Every 600 points a bonus rune asks a question: answer it for more time.' },
  typist: { name: 'Rune Typist', icon: 'scroll', color: '#3d6b9a', npc: 'tools', blurb: 'Monsters march toward the wall carrying code words. Type a word to shoot its monster!' },
};

/**
 * The stops of one unit, in order. `start` is the path index of the unit's first lesson,
 * `cur` the path index of the current lesson.
 */
export function planUnit(pathId: string, course: Course, unit: Unit, unitIndex: number, start: number, cur: number, st: PlanState, nextUnitId: string | null): Stop[] {
  const n = unit.lessons.length;
  const gameAfter = n >= 2 ? Math.ceil(n / 2) - 1 : -1;
  const { pace } = learnerPace(st.history);
  const stops: Stop[] = [];
  unit.lessons.forEach((node, li) => {
    const idx = start + li;
    if (pace === 'strong' && idx === cur && li >= 1 && n - li >= 2 && nextUnitId && !st.done[node.id]) {
      stops.push({ kind: 'fast', id: 'fast:' + unit.id, targetUnitId: nextUnitId });
    }
    stops.push({ kind: 'lesson', id: node.id, ref: { node, unit, course, unitIndex, lessonIndex: li }, index: idx });
    const r = st.reviews[node.id];
    if (r) stops.push({ kind: 'review', id: 'review:' + node.id, lessonId: node.id, pending: !r.done });
    if (li === gameAfter) stops.push({ kind: 'game', id: 'game:' + unit.id, game: gameFor(pathId, course.id, unitIndex, idx), afterIndex: idx, courseId: course.id });
  });
  return stops;
}

/** State of a stop on the map. */
export function stopState(s: Stop, cur: number, st: PlanState, pending: string | null): StopState {
  switch (s.kind) {
    case 'lesson':
      if (st.done[s.id]) return 'done';
      if (s.index === cur) return pending ? 'locked' : 'current';
      return s.index < cur ? 'done' : 'locked';
    case 'review':
      return s.pending ? (s.lessonId === pending ? 'current' : 'open') : 'done';
    case 'game':
      if (st.games[s.id]?.stars) return 'done';
      return s.afterIndex < cur ? 'open' : 'locked';
    case 'fast':
      return 'open';
  }
}

/** The id of the unit that follows `unitId` in the path. */
export function nextUnitOf(pathId: string, unitId: string): string | null {
  const nodes = pathNodes(pathId);
  const last = nodes.map((n) => n.unit.id).lastIndexOf(unitId);
  return last >= 0 && last + 1 < nodes.length ? nodes[last + 1].unit.id : null;
}
