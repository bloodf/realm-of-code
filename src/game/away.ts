// Coming back after a long time: the game remembers when you last played. If you were away,
// weeds grow in the village, monsters wander in, pets get hungry, crops are ready or wither,
// and Lumi writes to you. A "welcome back" screen sums it up and offers a comeback quest.
// Also: reminders (in-game raven mail and, if allowed, browser notifications).
import { useGame, setLessonListener } from './store';
import { now, DAY, HOUR } from './clock';
import { today } from './progress';
import { t } from '../i18n';
import { spawnInvaders } from './battle';
import { updatePet, mood, SPECIES_BY_ID } from './pets';
import { updatePlot, plotStage, updateAnimal } from './home';

export interface AwayReport { days: number; hours: number; streakLost: boolean; hungryPets: string[]; ripe: number; withered: number; weeds: number; animalsReady: number; invaders: number; decay: number }

let lastReport: AwayReport | null = null;
/** What happened during the last long absence (the welcome-back screen shows it once). */
export const awayReport = () => lastReport;

/** Runs when the game starts. Returns what happened while the player was away (or null). */
export function checkAbsence(): AwayReport | null {
  const s = useGame.getState();
  if (!s.profile) return null;
  const at = now();
  const gap = at - (lastSeen() || at);
  markSeen();
  countActiveDay();
  if (gap < 20 * HOUR) return null;
  const days = Math.floor(gap / DAY);
  const report = buildReport(gap);
  const decay = Math.min(1, Math.max(s.decay, days >= 2 ? days / 10 : 0));
  useGame.setState({ away: { days, at, seen: false }, decay });
  if (days >= 2) spawnInvaders(Math.min(6, days));
  report.invaders = useGame.getState().battle.invaders.length;
  report.decay = decay;
  // Lumi's letter
  const lines: string[] = [];
  if (report.streakLost) lines.push(t('Your streak went out, but a new one starts today.'));
  if (report.hungryPets.length) lines.push(t('{names} missed you and {is} hungry.', { names: report.hungryPets.join(', '), is: report.hungryPets.length > 1 ? t('are') : t('is') }));
  if (report.ripe) lines.push(t('{n} crops are ready in your garden.', { n: report.ripe }));
  if (report.withered) lines.push(t('{n} crops withered. Clear them and plant again.', { n: report.withered }));
  if (report.invaders) lines.push(t('Monsters wandered into the village! Chase them away.'));
  lastReport = report;
  useGame.getState().mail({ kind: 'away', title: days >= 2 ? t('We missed you, {name}!', { name: s.profile.name }) : t('Welcome back!'), text: lines.join(' ') || t('Everything is calm. Ready to learn?'), sprite: 'fairySad' }, false);
  return report;
}

export function buildReport(gap: number): AwayReport {
  const s = useGame.getState();
  const at = now();
  const days = Math.floor(gap / DAY);
  const last = s.streak.last;
  const streakLost = s.streak.count > 0 && !!last && (Date.parse(today()) - Date.parse(last)) / DAY > 1 + (s.streak.freezes > 0 ? 1 : 0);
  const pets = s.pets.list.map((p) => updatePet(p, at));
  const plots = s.home.plots.slice(0, s.home.size).map((p) => updatePlot(p, at));
  const animals = s.home.animals.map((a) => updateAnimal(a, at));
  return {
    days, hours: Math.round(gap / HOUR), streakLost,
    hungryPets: pets.filter((p) => mood(p) !== 'happy' && mood(p) !== 'ok').map((p) => p.name || SPECIES_BY_ID[p.species]?.name),
    ripe: plots.filter((p) => plotStage(p) === 'ripe').length,
    withered: plots.filter((p) => p.withered).length,
    weeds: plots.filter((p) => p.weeds).length,
    animalsReady: animals.filter((a) => a.ready > 0).length,
    invaders: s.battle.invaders.length,
    decay: s.decay,
  };
}

function countActiveDay() {
  const s = useGame.getState();
  const key = today();
  if (s.activeDay === key) return;
  useGame.setState({ activeDay: key, stats: { ...s.stats, daysActive: s.stats.daysActive + 1 } });
}

/** Learning again cleans the village: each lesson clears some of the overgrowth. */
export function cleanDecay(by = 0.35) {
  const s = useGame.getState();
  if (s.decay <= 0) return;
  const decay = Math.max(0, s.decay - by);
  useGame.setState({ decay });
  if (decay === 0 && s.away && s.away.days >= 2) {
    useGame.setState((st) => ({ stats: { ...st.stats, comebacks: st.stats.comebacks + 1 }, gold: st.gold + 50 }));
    useGame.getState().mail({ kind: 'away', title: t('The village is clean again!'), text: t('Comeback bonus: +50 gold. Lumi is proud of you.'), sprite: 'fairyCheer' });
    useGame.getState().checkAchievements();
  }
}

// "last seen" lives in its own key, so a closing tab never rewrites the whole save
const SEEN_KEY = 'realm-of-code-seen';
export const lastSeen = () => Number(localStorage.getItem(SEEN_KEY) || useGame.getState().lastSeen || 0);
export const markSeen = (at = now()) => { try { localStorage.setItem(SEEN_KEY, String(at)); } catch { /* private mode */ } };

/** Keeps lastSeen fresh while the game is open. */
export function startPresence() {
  const beat = () => { if (useGame.getState().profile) markSeen(); };
  setInterval(beat, 30_000);
  addEventListener('visibilitychange', () => { beat(); if (document.hidden) scheduleReminder(); else clearReminder(); });
  addEventListener('pagehide', beat);
}

// ---------------- notifications ----------------
export const notifySupported = () => typeof Notification !== 'undefined';
export async function askNotify(): Promise<boolean> {
  if (!notifySupported()) return false;
  const r = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  const ok = r === 'granted';
  useGame.getState().updateSettings({ notify: ok });
  if (ok) void showNotification(t('Reminders are on!'), t('Lumi will remind you to keep your streak.'));
  return ok;
}

export async function showNotification(title: string, body: string) {
  if (!notifySupported() || Notification.permission !== 'granted') return;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    const opts = { body, icon: 'favicon.svg', badge: 'favicon.svg', tag: 'realm-reminder' };
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch { /* notifications are best effort */ }
}

let timer = 0;
/** While the tab is in the background: remind at the chosen hour if today's goal is not done. */
export function scheduleReminder() {
  clearReminder();
  const s = useGame.getState();
  if (!s.settings.notify || s.settings.remindHour < 0) return;
  const d = new Date(now());
  const target = new Date(d); target.setHours(s.settings.remindHour, 0, 0, 0);
  if (target.getTime() <= d.getTime()) target.setTime(target.getTime() + DAY);
  timer = window.setTimeout(() => {
    const st = useGame.getState();
    if ((st.xpByDay[today()] ?? 0) >= st.dailyGoal) return;
    const msg = reminderText();
    void showNotification(msg.title, msg.text);
    st.mail({ kind: 'reminder', title: msg.title, text: msg.text, sprite: 'fairy' }, false);
  }, Math.min(target.getTime() - d.getTime(), 2 ** 31 - 1));
}
export function clearReminder() { clearTimeout(timer); }

/** Duolingo-style nudges, chosen by what is going on. */
export function reminderText(): { title: string; text: string } {
  const s = useGame.getState();
  const pet = s.pets.list.find((p) => p.uid === s.pets.active);
  if (s.streak.count >= 2) return { title: t('Your {n}-day streak is in danger!', { n: s.streak.count }), text: t('One short lesson keeps the flame alive. Lumi believes in you.') };
  if (pet && mood(updatePet(pet)) !== 'happy') return { title: t('{name} is waiting for you', { name: pet.name }), text: t('Your pet is hungry and a little lonely. Come say hi!') };
  const ripe = s.home.plots.slice(0, s.home.size).filter((p) => plotStage(updatePlot(p)) === 'ripe').length;
  if (ripe) return { title: t('Your crops are ready!'), text: t('{n} crops are waiting in your garden.', { n: ripe }) };
  return { title: t('Lumi misses you!'), text: t('Five minutes of learning today? Your next lesson is waiting.') };
}

setLessonListener(() => cleanDecay());
