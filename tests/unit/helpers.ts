// Shared helpers for the unit tests: a fresh save and the game clock.
import { useGame } from '../../src/game/store';
import { setTimeOffset } from '../../src/game/clock';
import { ACHIEVEMENT_BY_ID, TIER_GOLD } from '../../src/game/achievements';

/** A brand-new save with a hero, and the clock back to the real time. */
export function freshGame() {
  setTimeOffset(0);
  localStorage.clear();
  useGame.getState().resetAll();
  useGame.getState().createProfile({ name: 'Ada', avatar: 'knight', tunic: 'royal' });
  useGame.setState({ pathId: 'trainee', toasts: [] });
  return useGame;
}

/** Moves the game clock forward (like the developer-mode time skip). */
export const skip = (() => {
  let offset = 0;
  const fn = (ms: number) => { offset += ms; setTimeOffset(offset); };
  fn.reset = () => { offset = 0; setTimeOffset(0); };
  return fn;
})();

export const lesson = (nodeId: string, over: Partial<Parameters<ReturnType<typeof useGame.getState>['finishLesson']>[0]> = {}) =>
  useGame.getState().finishLesson({ nodeId, courseId: 'web', correct: 5, total: 5, mistakes: 0, kind: 'lesson', seconds: 60, ...over });

/** Gold paid so far by unlocked achievements (each tier pays a bonus), to check other rewards exactly. */
export const achGold = () => Object.keys(useGame.getState().achievements).reduce((a, id) => a + (TIER_GOLD[ACHIEVEMENT_BY_ID[id]?.tier] ?? 0), 0);
