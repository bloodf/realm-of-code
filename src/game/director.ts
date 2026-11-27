// Maps the address (#/learn, #/lesson/web-1-1, ...) to game scenes.
// The village (World) and the HUD stay alive under building windows; full-screen
// scenes (lessons, minigames, farm levels, title...) put them to sleep.
import type Phaser from 'phaser';
import { useGame } from './store';

export type Kind = 'full' | 'window' | 'world';
export interface Target { kind: Kind; scene: string; data?: Record<string, unknown> }

export const WINDOWS: Record<string, string> = {
  learn: 'W:learn', farm: 'W:farm', practice: 'W:practice', quests: 'W:quests', skills: 'W:skills',
  trophies: 'W:trophies', profile: 'W:profile', settings: 'W:settings', paths: 'W:paths', help: 'W:help',
  pets: 'W:pets', battle: 'W:battle', inbox: 'W:inbox', 'welcome-back': 'W:welcome',
};
export const FULL = ['Title', 'Create', 'Lesson', 'Minigame', 'FarmLevel', 'Verify', 'Homestead', 'HomeHud', 'Battle'];
export const OVERLAYS = ['HelpPanel', 'Tour', 'Debug'];

export function parseHash(): string[] {
  return (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function resolve(parts: string[]): Target {
  const [page, a, b] = parts;
  const profile = useGame.getState().profile;
  if (page === 'dev' && a === 'verify') return { kind: 'full', scene: 'Verify', data: { course: b } };
  if (!page) return profile ? { kind: 'world', scene: 'World' } : { kind: 'full', scene: 'Title' };
  if (page === 'welcome' || !profile) return { kind: 'full', scene: page === 'welcome' || !profile ? 'Create' : 'Title' };
  if (page === 'world') return { kind: 'world', scene: 'World' };
  if (page === 'farm' && a) return { kind: 'full', scene: 'FarmLevel', data: { id: a } };
  if (page === 'home') return { kind: 'full', scene: 'Homestead' };
  if (page === 'battle' && a === 'trial') return { kind: 'full', scene: 'Battle', data: { trial: true } };
  if (page === 'battle' && a === 'invader' && b) return { kind: 'full', scene: 'Battle', data: { invader: b } };
  if (page === 'battle' && a && b) return { kind: 'full', scene: 'Battle', data: { region: a, mob: b } };
  if (page === 'lesson' && a) return { kind: 'full', scene: 'Lesson', data: { mode: 'lesson', id: a } };
  if (page === 'practice' && a) return { kind: 'full', scene: 'Lesson', data: { mode: 'practice', course: a } };
  if (page === 'review') return { kind: 'full', scene: 'Lesson', data: { mode: 'mistakes' } };
  if (page === 'review-stop' && a) return { kind: 'full', scene: 'Lesson', data: { mode: 'review', id: a } };
  if (page === 'test' && a) return { kind: 'full', scene: 'Lesson', data: { mode: 'test', unit: a } };
  if (page === 'dev' && a === 'ex') return { kind: 'full', scene: 'Lesson', data: { mode: 'preview', id: b, index: Number(parts[3] ?? 0) } };
  if (page === 'game' && a) return { kind: 'full', scene: 'Minigame', data: { stop: a } };
  if (page === 'arcade' || page === 'tavern') return { kind: 'full', scene: 'Minigame', data: { arcade: a ?? 'bughunt' } };
  if (WINDOWS[page]) return { kind: 'window', scene: WINDOWS[page], data: { sub: a } };
  return { kind: 'world', scene: 'World' };
}

let current: Target | null = null;
export const currentTarget = () => current;

export function show(game: Phaser.Game, t: Target) {
  const sm = game.scene;
  const running = (k: string) => !!sm.getScene(k) && (sm.isActive(k) || sm.isPaused(k) || sm.isSleeping(k));
  // the same screen again (e.g. "" then "#/world"): keep it, and any tour or help open over it
  const sameData = () => { try { return JSON.stringify(current!.data ?? {}) === JSON.stringify(t.data ?? {}); } catch { return false; } };
  if (current && current.scene === t.scene && current.kind === t.kind && sameData() && running(t.scene)) return;
  for (const k of [...FULL, ...Object.values(WINDOWS), ...OVERLAYS, 'FarmStage']) if (running(k)) sm.stop(k);
  current = t;
  if (t.kind === 'full') {
    // (a paused scene cannot be put to sleep: resume it first, or it stays visible)
    for (const k of ['World', 'Hud']) {
      if (!running(k)) continue;
      if (sm.isPaused(k)) sm.resume(k);
      if (!sm.isSleeping(k)) sm.sleep(k);
    }
    sm.start(t.scene, t.data ?? {});
  } else {
    if (!running('World')) sm.start('World'); else if (sm.isSleeping('World')) sm.wake('World');
    if (!running('Hud')) sm.start('Hud'); else if (sm.isSleeping('Hud')) sm.wake('Hud');
    if (t.kind === 'window') {
      sm.start(t.scene, t.data ?? {});
      sm.bringToTop(t.scene);
    }
    sm.bringToTop('Hud');
    game.events.emit('director:world', t.kind === 'world');
  }
  sm.bringToTop('Coach');
  sm.bringToTop('Toasts');
  sm.bringToTop('DevBadge');
  game.events.emit('director:show', t);
}
