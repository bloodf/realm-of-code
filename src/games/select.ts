// Which minigame to play and with what content: path stops use what you learned before
// the stop; the tavern arcade uses everything you learned.
import { useGame, type GameId } from '../game/store';
import { currentIndex, pathNodes, UNIT_BY_ID } from '../course';
import { planUnit, GAME_INFO } from '../course/adaptive';
import { poolsFor, poolsLearned, type Pools } from './pools';
import { BUGS } from './bugs';
import type { BugRound } from './data';

export function bugsFrom(pools: Pools, arcade: boolean): BugRound[] {
  const mine = pools.bugs.map((b) => ({ code: b.code, line: b.line, why: b.explain ?? '', lang: b.lang }));
  return arcade ? [...mine, ...BUGS] : mine;
}

/** Why a tavern game is still locked (null when it is open). */
export function arcadeLock(game: GameId, pools: Pools): string | null {
  switch (game) {
    case 'link': return pools.pairs.length >= 6 ? null : 'Unlocks after a few more lessons.';
    case 'memory': return pools.pairs.filter((p) => p.a.length <= 24 && p.b.length <= 24).length >= 6 ? null : 'Unlocks after a few more lessons.';
    case 'torchrun': return pools.choices.length >= 4 ? null : 'Unlocks after your first lessons.';
    case 'bughunt': return pools.bugs.length >= 2 || /console\.log/.test(pools.corpus) ? null : 'Unlocks when you start JavaScript.';
    case 'archery': return /\.[a-z][\w-]*\s*\{|#[a-z][\w-]*\s*\{/.test(pools.corpus) ? null : 'Unlocks when you learn CSS selectors.';
    case 'archive': return /SELECT/.test(pools.corpus) ? null : 'Unlocks when you start SQL.';
    case 'loop': return /for \(|while \(/.test(pools.corpus) ? null : 'Unlocks when you learn loops.';
    case 'gemforge': return null;
    case 'typist': return null;
  }
}

export function arcadePools() {
  const s = useGame.getState();
  const pathId = s.pathId ?? 'explore';
  const nodes = pathNodes(pathId);
  const cur = currentIndex(pathId, s.done);
  const courseId = nodes[Math.max(0, Math.min(cur, nodes.length) - 1)]?.course.id ?? nodes[0]?.course.id ?? 'web';
  return { pools: poolsLearned(pathId, s.done), courseId };
}

export interface GameSetup { game: GameId; stopId?: string; courseId: string; unitIndex: number; pools: Pools }

/** Resolves a path stop (game:<unitId>) or an arcade game. Returns a reason when it cannot be played. */
export function setupGame(d: { stop?: string; arcade?: string }): GameSetup | { blocked: string } {
  const s = useGame.getState();
  const pathId = s.pathId ?? 'explore';
  if (d.stop) {
    const stopId = d.stop;
    const unitId = stopId.replace(/^game:/, '');
    const ref = UNIT_BY_ID[unitId];
    if (!ref) return { blocked: 'This minigame is not on your path.' };
    const nodes = pathNodes(pathId);
    const start = nodes.findIndex((n) => n.unit.id === unitId);
    if (start < 0) return { blocked: 'This minigame is not on your path.' };
    const cur = currentIndex(pathId, s.done);
    const stop = planUnit(pathId, ref.course, ref.unit, ref.unitIndex, start, cur, s, null).find((x) => x.id === stopId);
    if (!stop || stop.kind !== 'game') return { blocked: 'This minigame is not on your path.' };
    if (stop.afterIndex >= cur) return { blocked: 'Finish the lessons before this minigame to unlock it.' };
    return { game: stop.game, stopId, courseId: ref.course.id, unitIndex: ref.unitIndex, pools: poolsFor(pathId, ref.course.id, stop.afterIndex + 1) };
  }
  const g = (d.arcade ?? 'bughunt') as GameId;
  if (!GAME_INFO[g]) return { blocked: 'There is no such game in the tavern.' };
  const { pools, courseId } = arcadePools();
  if (arcadeLock(g, pools)) return { blocked: 'Finish a few more lessons to unlock this game.' };
  const bg = g === 'archery' ? 'css' : g === 'archive' ? 'sql' : g === 'loop' ? 'js' : g === 'bughunt' ? 'testing' : courseId;
  return { game: g, courseId: bg, unitIndex: 0, pools };
}
