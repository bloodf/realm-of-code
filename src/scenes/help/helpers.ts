// The help system's glue: which screen the player is on, opening Lumi's help panel,
// first-visit tours, and noticing when the player seems stuck.
import Phaser from 'phaser';
import { currentTarget } from '../../game/director';
import { useGame } from '../../game/store';
import { SCREEN_HELP } from './content';

export interface HelpCtx {
  /** Help page to use (e.g. 'Lesson:code'); defaults to the scene key. */
  screen?: string;
  /** Exercise type in lessons (choice, fill...) or game id in minigames. */
  type?: string;
  game?: string;
  /** What the player is working on (an exercise key, a level id): "stuck" help resets when it changes. */
  item?: string;
  /** True while the player is expected to act (so long idle times count as "stuck"). */
  watch?: boolean;
  /** UI id of this screen's help button (where Lumi peeks from). */
  button?: string;
}

const CTX: Record<string, HelpCtx> = {};
const struggles = new Map<string, number>();

/** Scenes tell the help system what is on screen. */
export function setHelpContext(scene: Phaser.Scene, c: HelpCtx) {
  const key = scene.sys.settings.key;
  const prev = CTX[key];
  if (prev?.item !== c.item) scene.game.events.emit('help:item', c.item);
  CTX[key] = c;
}

/** The help page for what is on screen now. */
export function helpScreen(): { key: string; ctx: HelpCtx; base: string } {
  const t = currentTarget();
  const base = t?.scene ?? 'World';
  const ctx = CTX[base] ?? {};
  let key = ctx.screen ?? base;
  if (!SCREEN_HELP[key]) key = SCREEN_HELP[base] ? base : 'World';
  return { key, ctx, base };
}

export function helpButtonId(): string {
  const { ctx, base } = helpScreen();
  return ctx.button ?? (base === 'Lesson' ? 'lesson.help' : base === 'Minigame' ? 'game.help' : base === 'FarmLevel' ? 'farm.help' : 'hud.help');
}

const busy = (game: Phaser.Game) => game.scene.isActive('HelpPanel') || game.scene.isActive('Tour');

/** Opens Lumi's help panel over the current screen (topic: 'about' | 'stuck' | 'faq'). */
export function openHelp(scene: Phaser.Scene, topic?: string) {
  const sm = scene.game.scene;
  if (busy(scene.game)) return;
  scene.game.events.emit('coach:hide');
  const g = useGame.getState();
  const n = (g.stats.helpOpens ?? 0) + 1;
  useGame.setState({ stats: { ...g.stats, helpOpens: n } });
  if (n >= 10) g.unlock('lumi_friend');
  sm.run('HelpPanel', { topic });
  sm.bringToTop('HelpPanel');
}

/** Starts the step-by-step tour of a screen (default: the current one). */
export function startTour(game: Phaser.Game, screen?: string) {
  const sm = game.scene;
  if (sm.isActive('Tour')) return;
  game.events.emit('coach:hide');
  sm.run('Tour', { screen: screen ?? helpScreen().key });
  sm.bringToTop('Tour');
}

const offered = new Set<string>();

/** The first time a screen opens (and tips are on), Lumi offers a tour. The village's
 *  welcome tour starts by itself. */
export function maybeTour(scene: Phaser.Scene, id: string) {
  const s = useGame.getState();
  if (s.settings.tips === false || s.tours?.[id] || offered.has(id)) return;
  const steps = SCREEN_HELP[id]?.steps ?? [];
  if (!steps.length) return;
  offered.add(id);
  const game = scene.game;
  // a real timer: the scene may rebuild itself in the meantime
  setTimeout(() => {
    if (busy(game) || helpScreen().key !== id) { offered.delete(id); return; }
    useGame.getState().markTour(id);
    if (id === 'World') startTour(game, id);
    else game.events.emit('coach:offer', id);
  }, id === 'World' ? 900 : 700);
}

/** Screens call this when the player fails at something (a wrong answer, a failed run).
 *  After two fails on the same thing, Lumi offers help. */
export function noteStruggle(scene: Phaser.Scene, item: string) {
  const n = (struggles.get(item) ?? 0) + 1;
  struggles.set(item, n);
  if (n === 2 || n === 4) scene.game.events.emit('coach:stuck', 'struggle');
}

/** Pause every running scene under an overlay; returns a function that resumes them. */
export function pauseUnder(game: Phaser.Game, except: string[]) {
  const sm = game.scene;
  const paused: string[] = [];
  for (const s of sm.getScenes(true)) {
    const k = s.sys.settings.key;
    if (except.includes(k) || ['Toasts', 'Coach', 'HelpPanel', 'Tour', 'DevBadge', 'Debug'].includes(k)) continue;
    sm.pause(k);
    paused.push(k);
  }
  return () => { for (const k of paused) if (sm.isPaused(k)) sm.resume(k); };
}

/** DOM pieces (editors, previews, inputs) of the running scenes. */
export function domElements(game: Phaser.Game, except: string[] = []) {
  const out: Phaser.GameObjects.DOMElement[] = [];
  for (const s of game.scene.getScenes(false)) {
    if (except.includes(s.sys.settings.key) || !s.sys.isVisible()) continue;
    if (!(s.sys.isActive() || s.sys.isPaused())) continue;
    for (const o of s.children.list) if (o instanceof Phaser.GameObjects.DOMElement && o.visible && o.node && (o.node as HTMLElement).style.display !== 'none') out.push(o);
  }
  return out;
}

export function domRects(game: Phaser.Game, except: string[] = []) {
  return domElements(game, except).map((d) => { const r = (d.node as HTMLElement).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, el: d }; }).filter((r) => r.w > 0 && r.h > 0);
}

export type Rect = { x: number; y: number; w: number; h: number };
export const overlaps = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Go to a screen, then start its tour once it is open. */
export function goAndTour(game: Phaser.Game, route: string, screen: string) {
  const here = location.hash.replace(/^#\/?/, '') === route || (route === 'world' && currentTarget()?.scene === 'World');
  if (here) { startTour(game, screen); return; }
  game.events.once('director:show', () => setTimeout(() => startTour(game, screen), 450));
  location.hash = '#/' + route;
}

/** Offer the first-visit tours again. */
export function resetTips() {
  offered.clear();
  useGame.getState().resetTours();
}

/** Cuts a rectangular window (page coordinates) out of a DOM element, so a Phaser bubble
 *  under it shows through. Returns a function that undoes it. */
export function cutOut(el: HTMLElement, r: Rect) {
  const b = el.getBoundingClientRect();
  const x = Math.round(r.x - b.left), y = Math.round(r.y - b.top), w = Math.round(r.w), h = Math.round(r.h);
  const W = Math.ceil(b.width), H = Math.ceil(b.height);
  el.style.clipPath = `path(evenodd, 'M0 0 H${W} V${H} H0 Z M${x} ${y} H${x + w} V${y + h} H${x} Z')`;
  return () => { el.style.clipPath = ''; };
}
