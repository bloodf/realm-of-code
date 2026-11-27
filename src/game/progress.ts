import { now } from './clock';
// XP, levels, titles and rewards.

/** XP needed to go from `level` to `level + 1`. */
export const xpToNext = (level: number) => 50 * level;

export function levelFromXp(xp: number) {
  let level = 1;
  let rest = xp;
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level++;
  }
  return { level, into: rest, need: xpToNext(level) };
}

const TITLES: [number, string][] = [
  [1, 'Peasant'], [3, 'Apprentice'], [5, 'Squire'], [8, 'Knight'], [12, 'Paladin'],
  [16, 'Champion'], [20, 'Archmage'], [25, 'Legend'],
];

export function titleFor(level: number) {
  let t = TITLES[0][1];
  for (const [l, name] of TITLES) if (level >= l) t = name;
  return t;
}

/** XP for a lesson with a given number of stars (first clear). */
export function lessonXp(base: number, stars: number, solutionSeen: boolean) {
  const mult = 1 + 0.25 * (stars - 1);
  return Math.round(base * mult * (solutionSeen ? 0.5 : 1));
}

export const lessonGold = (stars: number) => 10 + 5 * stars;

export const HINT_COST = [5, 10, 20];

export const today = (d = new Date(now())) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function yesterday() {
  const d = new Date(now());
  d.setDate(d.getDate() - 1);
  return today(d);
}
