// Hooks for automated tests and screenshots (they drive the game like a player).
import type Phaser from 'phaser';
import { NODE_BY_ID, PATHS, pathNodes, exerciseByKey } from './course';
import { linkStyle } from './lesson/adapt';
import { LEVELS as FARM_LEVELS } from './farm/levels';
import { UI } from './ui/widgets';
import { currentTarget } from './game/director';
import { useGame } from './game/store';

export function installDebug(game: Phaser.Game) {
  (window as unknown as Record<string, unknown>).__realmDebug = {
    nodeIds: () => Object.keys(NODE_BY_ID),
    exerciseCount: (id: string) => NODE_BY_ID[id]?.node.exercises.length ?? 0,
    exercise: (key: string) => { const e = exerciseByKey(key)?.ex; return e ? JSON.parse(JSON.stringify(e, (k, v) => (k === 'lesson' || typeof v === 'function' ? undefined : v))) : null; },
    keysOf: (t: string) => Object.entries(NODE_BY_ID).flatMap(([id, r]) => r.node.exercises.map((e, i) => (e.t === t ? `${id}#${i}` : null)).filter(Boolean)),
    linkStyle: (key: string) => { const e = exerciseByKey(key)?.ex; return !!e && e.t === 'match' && linkStyle(key, e.pairs.length); },
    farmLevels: () => FARM_LEVELS.map((l) => l.id),
    pathStats: () => PATHS.map((p) => {
      const nodes = pathNodes(p.id);
      const ex = nodes.flatMap((n) => n.node.exercises);
      return { id: p.id, lessons: nodes.length, challenges: nodes.filter((n) => n.node.kind !== 'lesson').length, exercises: ex.filter((e) => e.t !== 'teach').length, coding: ex.filter((e) => e.t === 'code' || e.t === 'sql' || e.t === 'terminal').length };
    }),
  };
  (window as unknown as Record<string, unknown>).__store = useGame;
  /** The game's UI for tests: every registered button/card with its page rectangle. */
  (window as unknown as Record<string, unknown>).__ui = {
    list: () => UI.list(),
    rect: (id: string) => UI.rect(id),
    click: (id: string) => { const e = UI.get(id); if (!e || !UI.rect(id)) return false; e.click?.(); return true; },
    /** Scroll a list (or move the camera) so the widget is on screen. */
    reveal: (id: string) => { const e = UI.get(id); if (!e?.reveal) return false; e.reveal(); return true; },
    /** Registered widgets, including the ones scrolled out of view (rect null). */
    all: () => UI.all(),
    scene: () => currentTarget()?.scene ?? null,
    active: () => game.scene.getScenes(true).map((s) => s.sys.settings.key),
    registry: (key: string) => game.registry.get(key),
    state: (key: string) => (game.registry.get('debug:' + key) as (() => unknown) | undefined)?.(),
  };
}
