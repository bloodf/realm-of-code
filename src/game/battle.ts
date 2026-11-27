// PvE battles: monsters in five regions beyond the Monster Gate. Your attacks are powered by
// what you learn: answer a question to strike, type a word of code to cast a spell.
import { useGame } from './store';
import { levelFromXp } from './progress';
import type { Rarity } from './types07';
import { now } from './clock';
import { t } from '../i18n';
import { poolsLearned, shuffle } from '../games/pools';
import type { Choice } from '../course/types';
import { COURSE_BY_ID } from '../course';

export interface Mob { id: string; name: string; sprite: string; hp: number; atk: number; xp: number; gold: number; egg?: [Rarity, number]; boss?: boolean; scale?: number; taunt: string }
export interface Region { id: string; name: string; desc: string; biome: string; needLessons: number; mobs: string[]; boss: string; color: string }

export const MOBS: Record<string, Mob> = {
  slime: { id: 'slime', name: 'Green Slime', sprite: 'mob-slime', hp: 30, atk: 4, xp: 8, gold: 6, egg: ['common', 0.06], taunt: 'Bloop! You look tasty.' },
  slimeBlue: { id: 'slimeBlue', name: 'Blue Slime', sprite: 'mob-slimeBlue', hp: 38, atk: 5, xp: 10, gold: 8, egg: ['common', 0.06], taunt: 'Splish! Syntax errors are my favourite snack.' },
  wisp: { id: 'wisp', name: 'Will-o-Wisp', sprite: 'mob-wisp', hp: 34, atk: 6, xp: 10, gold: 8, taunt: 'Follow me... into an endless loop!' },
  mushroomLord: { id: 'mushroomLord', name: 'Mushroom Lord', sprite: 'mob-mushroom', hp: 90, atk: 8, xp: 40, gold: 40, egg: ['uncommon', 0.5], boss: true, scale: 1.3, taunt: 'My spores will fill your code with bugs!' },
  bat: { id: 'bat', name: 'Cave Bat', sprite: 'mob-bat', hp: 40, atk: 7, xp: 12, gold: 10, egg: ['common', 0.08], taunt: 'Screech! Your variables are undefined!' },
  skeleton: { id: 'skeleton', name: 'Skeleton', sprite: 'mob-skeleton', hp: 52, atk: 8, xp: 14, gold: 12, taunt: 'I am all bones and no semicolons.' },
  mimic: { id: 'mimic', name: 'Mimic', sprite: 'mob-mimic', hp: 60, atk: 9, xp: 18, gold: 25, egg: ['uncommon', 0.12], taunt: 'Surprise! I was never a treasure chest.' },
  boneKing: { id: 'boneKing', name: 'Bone King', sprite: 'mob-skeleton', hp: 140, atk: 11, xp: 60, gold: 60, egg: ['rare', 0.35], boss: true, scale: 1.4, taunt: 'Kneel before the king of off-by-one errors!' },
  ghost: { id: 'ghost', name: 'Ghost', sprite: 'mob-ghost', hp: 58, atk: 10, xp: 16, gold: 14, taunt: 'Boo! I haunt unclosed tags.' },
  wolf: { id: 'wolf', name: 'Shadow Wolf', sprite: 'mob-wolf', hp: 66, atk: 11, xp: 18, gold: 15, egg: ['uncommon', 0.1], taunt: 'Grrr. I smell a missing bracket.' },
  mushroom: { id: 'mushroom', name: 'Sporeling', sprite: 'mob-mushroom', hp: 54, atk: 10, xp: 15, gold: 13, taunt: 'Spores! Spores everywhere!' },
  alphaWolf: { id: 'alphaWolf', name: 'Alpha Wolf', sprite: 'mob-wolf', hp: 190, atk: 14, xp: 90, gold: 90, egg: ['rare', 0.45], boss: true, scale: 1.5, taunt: 'The pack never forgets a failing test.' },
  golem: { id: 'golem', name: 'Stone Golem', sprite: 'mob-golem', hp: 90, atk: 13, xp: 24, gold: 20, taunt: 'I. AM. HARD. CODED.' },
  bigMimic: { id: 'bigMimic', name: 'Greedy Mimic', sprite: 'mob-mimic', hp: 80, atk: 14, xp: 26, gold: 45, egg: ['rare', 0.1], taunt: 'Gold! Give me all your gold!' },
  titan: { id: 'titan', name: 'Stone Titan', sprite: 'mob-golem', hp: 260, atk: 17, xp: 130, gold: 130, egg: ['rare', 0.6], boss: true, scale: 1.6, taunt: 'Nothing gets past my firewall.' },
  whelp: { id: 'whelp', name: 'Dragon Whelp', sprite: 'mob-whelp', hp: 110, atk: 16, xp: 32, gold: 30, egg: ['uncommon', 0.15], taunt: 'Rawr! I am small but my bugs are big.' },
  dragon: { id: 'dragon', name: 'Fire Dragon', sprite: 'mob-dragon', hp: 150, atk: 19, xp: 45, gold: 45, egg: ['rare', 0.15], taunt: 'I will burn your legacy code!' },
  blackDragon: { id: 'blackDragon', name: 'Black Dragon', sprite: 'mob-dragonBlack', hp: 360, atk: 22, xp: 220, gold: 220, egg: ['ultra', 0.5], boss: true, scale: 1.7, taunt: 'I am every bug you ever wrote. Face me!' },
  elder: { id: 'elder', name: 'Elder Dragon of Bugs', sprite: 'mob-dragonBlack', hp: 480, atk: 24, xp: 400, gold: 400, egg: ['ultra', 1], boss: true, scale: 2, taunt: 'Prove you are ready to be a Junior Developer!' },
};

export const REGIONS: Region[] = [
  { id: 'meadow', name: 'Slime Meadow', desc: 'Soft green hills full of bouncy slimes. A good place to start.', biome: 'web', needLessons: 0, mobs: ['slime', 'slimeBlue', 'wisp'], boss: 'mushroomLord', color: '#6cc04a' },
  { id: 'caves', name: 'Bat Caves', desc: 'Dark tunnels. Bats, skeletons and chests that bite.', biome: 'tools', needLessons: 8, mobs: ['bat', 'skeleton', 'mimic'], boss: 'boneKing', color: '#6a5a8a' },
  { id: 'woods', name: 'Haunted Woods', desc: 'Ghosts between the trees and wolves in the shadows.', biome: 'js', needLessons: 20, mobs: ['ghost', 'wolf', 'mushroom'], boss: 'alphaWolf', color: '#3d6b3a' },
  { id: 'quarry', name: 'Golem Quarry', desc: 'Stone giants guard the old mines.', biome: 'css', needLessons: 40, mobs: ['golem', 'bigMimic', 'skeleton'], boss: 'titan', color: '#8d8a94' },
  { id: 'peak', name: "Dragon's Peak", desc: 'Dragons are not our friends. Only the bravest coders climb here.', biome: 'node', needLessons: 70, mobs: ['whelp', 'dragon'], boss: 'blackDragon', color: '#d9482a' },
];
export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

/** The Junior Trial: the final exam of your path, as a boss fight. */
export const TRIAL = { id: 'trial', mob: 'elder', needPct: 85 };

export const mobName = (id: string) => t(MOBS[id]?.name ?? id);

export function playerStats() {
  const s = useGame.getState();
  const level = levelFromXp(s.xp).level;
  return { level, hp: 60 + level * 8, atk: 10 + level * 2 };
}

export function regionOpen(r: Region) {
  return useGame.getState().stats.lessons >= r.needLessons || useGame.getState().dev.on;
}

/** Monster strength grows a little with the hero, so early regions stay fair. */
export function scaledMob(id: string) {
  const m = MOBS[id];
  const lv = playerStats().level;
  const k = m.boss ? 1 + Math.min(0.6, lv * 0.02) : 1 + Math.min(0.5, lv * 0.015);
  return { ...m, hp: Math.round(m.hp * k), atk: Math.round(m.atk * k) };
}

// ---------------- questions and words ----------------
/** Starter questions, so a brand-new hero can fight before finishing any lesson. */
const STARTER: () => Choice[] = () => [
  { t: 'choice', q: t('What does a programmer write?'), options: [t('Code'), t('Poems'), t('Recipes')], answer: 0 },
  { t: 'choice', q: t('Which language builds the structure of a web page?'), options: ['HTML', 'CSS', 'SQL'], answer: 0 },
  { t: 'choice', q: t('Which language makes a web page colourful?'), options: ['CSS', 'HTML', 'Python'], answer: 0 },
  { t: 'choice', q: t('What is a bug?'), options: [t('A mistake in a program'), t('A fast computer'), t('A kind of cable')], answer: 0 },
  { t: 'choice', q: t('A computer follows instructions...'), options: [t('exactly, in order'), t('only when it wants'), t('backwards')], answer: 0 },
  { t: 'choice', q: t('What does a browser do?'), options: [t('Shows web pages'), t('Cooks food'), t('Stores electricity')], answer: 0 },
  { t: 'choice', q: t('Which one is a programming language?'), options: ['JavaScript', 'Photoshop', 'Keyboard'], answer: 0 },
  { t: 'choice', q: t('A list of steps to solve a problem is an...'), options: [t('algorithm'), t('antenna'), t('avatar')], answer: 0 },
  { t: 'choice', q: t('What is a loop for?'), options: [t('Repeating steps'), t('Deleting files'), t('Drawing circles only')], answer: 0 },
  { t: 'choice', q: t('Where do you type code?'), options: [t('In an editor'), t('In a calculator'), t('In a photo')], answer: 0 },
  { t: 'choice', q: t('What does "debugging" mean?'), options: [t('Finding and fixing mistakes'), t('Adding bugs'), t('Turning the computer off')], answer: 0 },
  { t: 'choice', q: t('Which is a good habit when stuck?'), options: [t('Read the error message'), t('Give up'), t('Delete everything')], answer: 0 },
] as Choice[];

export function battleQuestions(): Choice[] {
  const s = useGame.getState();
  const learned = poolsLearned(s.pathId ?? 'explore', s.done).choices.filter((c) => c.options.length >= 2 && c.options.every((o) => o.length < 60));
  return shuffle(learned.length >= 8 ? learned : [...learned, ...STARTER()]);
}

const WORDS: Record<string, string[]> = {
  web: ['browser', 'server', 'url', 'http', 'https', 'domain', 'request', 'response'],
  html: ['<p>', '<div>', '<h1>', 'href', 'alt', '<img>', '<ul>', '<li>', '<a>', 'body', 'head', 'title', '<form>', 'input'],
  css: ['color', 'margin', 'padding', 'border', 'display', 'flex', 'grid', 'font-size', 'width', '.card', '#menu', 'hover'],
  js: ['let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'true', 'false', 'null', 'console.log', 'push', 'length', '=>', 'await'],
  ts: ['string', 'number', 'boolean', 'interface', 'type', 'readonly', 'enum', 'unknown'],
  python: ['print', 'def', 'import', 'elif', 'range', 'len', 'True', 'None', 'return', 'lambda', 'append', 'dict'],
  php: ['echo', '<?php', '$name', 'foreach', 'isset', 'array', 'function', 'strlen'],
  sql: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INSERT', 'UPDATE', 'DELETE', 'ORDER BY', 'LIMIT', 'COUNT'],
  tools: ['git add', 'git commit', 'git push', 'branch', 'merge', 'clone', 'ls', 'cd', 'npm install'],
  react: ['useState', 'props', 'useEffect', 'className', 'onClick', 'key'],
  node: ['express', 'app.get', 'req', 'res', 'require', 'npm', 'json'],
  nosql: ['find', 'insertOne', 'document', 'collection', '$gt', 'updateOne'],
  algo: ['stack', 'queue', 'sort', 'binary', 'recursion', 'O(n)'],
};
/** Words to type: from the sections you have started (always some easy ones). */
export function typingWords(): string[] {
  const s = useGame.getState();
  const started = Object.keys(s.skillXp).filter((k) => WORDS[k]);
  const pool = [...WORDS.web, ...WORDS.html.slice(0, 6), ...started.flatMap((k) => WORDS[k])];
  return shuffle([...new Set(pool)]);
}
export const courseTitle = (id: string) => COURSE_BY_ID[id]?.title ?? id;

// ---------------- results ----------------
export interface BattleReward { xp: number; gold: number; egg: Rarity | null; item: string | null; first: boolean }

export function winBattle(mobId: string, regionId: string | null, turns: number, invader?: string): BattleReward {
  const m = MOBS[mobId];
  const s = useGame.getState();
  const first = !s.battle.kills[mobId];
  let egg: Rarity | null = null;
  if (m.egg && (Math.random() < m.egg[1] || (m.boss && first))) egg = m.egg[0];
  const item = Math.random() < 0.25 ? (['bulb', 'torch', 'potion'] as const)[Math.floor(Math.random() * 3)] : null;
  const xp = m.xp, gold = m.gold + (invader ? 10 : 0);
  useGame.setState((st) => ({
    gold: st.gold + gold,
    battle: {
      ...st.battle,
      wins: st.battle.wins + 1,
      kills: { ...st.battle.kills, [mobId]: (st.battle.kills[mobId] ?? 0) + 1 },
      cleared: m.boss && regionId ? { ...st.battle.cleared, [regionId]: (st.battle.cleared[regionId] ?? 0) + 1 } : st.battle.cleared,
      best: m.boss && regionId ? { ...st.battle.best, [regionId]: Math.min(turns, st.battle.best[regionId] ?? 999) } : st.battle.best,
      invaders: invader ? st.battle.invaders.filter((x) => x.uid !== invader) : st.battle.invaders,
    },
    stats: { ...st.stats, battlesWon: st.stats.battlesWon + 1, bossesWon: st.stats.bossesWon + (m.boss ? 1 : 0) },
    decay: invader ? Math.max(0, st.decay - 0.1) : st.decay,
  }));
  if (item) useGame.getState().addItems({ [item]: 1 });
  useGame.getState().gainXp(xp);
  useGame.getState().bumpQuest('battles');
  useGame.getState().checkAchievements();
  return { xp, gold, egg, item, first };
}

export function loseBattle() {
  useGame.setState((st) => ({ battle: { ...st.battle, losses: st.battle.losses + 1 } }));
}

/** After a long absence, monsters wander into the village. */
export function spawnInvaders(n: number) {
  const spots = [[16, 22], [27, 23], [30, 16], [14, 17], [25, 27], [34, 25], [19, 30], [8, 13], [39, 14]];
  const mobs = ['slime', 'slimeBlue', 'bat', 'wisp', 'ghost', 'skeleton'];
  useGame.setState((st) => {
    const have = st.battle.invaders.length;
    const add = Array.from({ length: Math.max(0, Math.min(n, spots.length) - have) }, (_, i) => {
      const [x, y] = spots[(have + i) % spots.length];
      return { uid: 'i' + now().toString(36) + i, mob: mobs[(have + i) % mobs.length], x, y };
    });
    return { battle: { ...st.battle, invaders: [...st.battle.invaders, ...add] } };
  });
}
