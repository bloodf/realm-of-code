// Game state, saved in the browser (localStorage).
import { createStore } from 'zustand/vanilla';
import { now } from './clock';
import type { Lang } from '../i18n';
import type { PetState, HomeState, BattleState } from './types07';
import { initialPets, initialHome, initialBattle, emptyPlot } from './types07';
import { persist } from 'zustand/middleware';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, TIER_GOLD } from './achievements';
import { levelFromXp, today, yesterday } from './progress';
import { questsForDay, QUEST_BY_ID, type DailyQuest, type QuestMetric } from './quests';
import { STARTER_ITEMS, STAR_ITEMS, ITEM_BY_ID, starsFor, type Inventory, type ItemId } from './items';

export type Avatar = 'knight' | 'mage' | 'ranger';

export interface Profile { name: string; avatar: Avatar; tunic: string; createdAt: number }

export interface NodeProgress { times: number; best: number; at: number }   // best = accuracy 0..100

export interface Stats {
  lessons: number; perfect: number; exercises: number; mistakes: number; challenges: number; projects: number;
  runs: number; errors: number; timeouts: number; splashes: number; gems: number; goblins: number;
  archeryBest: number; bugHuntBest: number; minigames: number; questsDone: number; practices: number; unitTests: number;
  bulbsUsed: number; torchesUsed: number; potionsUsed: number;
  gemBest: number; typingBest: number; battlesWon: number; bossesWon: number; harvests: number; products: number; petsFed: number; petPlays: number; eggsHatched: number; comebacks: number; daysActive: number; helpOpens: number;
}

export interface Settings {
  sfx: boolean; music: boolean;
  sageNotes: boolean;       // extra "Sage's notes" for adults / career switchers
  hearts: boolean;          // false = relaxed mode (no hearts)
  speed: number;            // hero replay speed
  fontSize: number;         // editor font size
  classicCode: boolean;     // use a standard monospace font for code instead of the pixel one
  tips: boolean;            // show a guided tour the first time a screen opens
  lang: Lang;               // en, pt, es
  notify: boolean;          // browser notifications (reminders)
  remindHour: number;       // daily reminder hour (0-23), -1 = off
}

export interface Toast { id: number; kind: 'achievement' | 'level' | 'trophy' | 'info' | 'quest' | 'pet' | 'home' | 'battle'; title: string; text: string; icon?: string; sprite?: string }
/** A message in the raven inbox (Duolingo-style notifications). */
export interface Mail { id: number; at: number; kind: string; title: string; text: string; icon?: string; sprite?: string; read?: boolean; to?: string }

export interface LessonResult {
  nodeId: string; courseId: string; correct: number; total: number; mistakes: number;
  kind: 'lesson' | 'challenge' | 'project' | 'practice' | 'test';
  seconds: number; missed?: string[]; unitComplete?: string; courseComplete?: { id: string; name: string } | null; pathComplete?: { id: string; name: string } | null;
}

export interface Reward { xp: number; gold: number; accuracy: number; levelBefore: number; levelAfter: number; streak: number; streakUp: boolean; goalReached: boolean; achievements: string[]; review?: boolean }

/** A review stop the path adds after a lesson that was hard (see course/adaptive.ts). */
export interface ReviewStop { keys: string[]; at: number; done: number }
export interface GameRecord { stars: number; best: number; plays: number }
export interface GameReward { stars: number; newStars: number; items: Partial<Inventory>; gold: number; xp: number; best: boolean; achievements: string[] }
export type GameId = 'link' | 'memory' | 'torchrun' | 'bughunt' | 'archery' | 'archive' | 'loop' | 'gemforge' | 'typist';

export const MAX_HEARTS = 5;
const HEART_MS = 20 * 60 * 1000;     // one heart back every 20 minutes

export interface GameState {
  profile: Profile | null;
  pathId: string | null;
  dailyGoal: number;
  xp: number;
  gold: number;
  hearts: { n: number; at: number };
  done: Record<string, NodeProgress>;          // lesson node id -> progress
  testedOut: Record<string, number>;            // unit id -> time (unit skipped with a test)
  skillXp: Record<string, number>;              // course id -> xp
  practicedAt: Record<string, number>;          // course id -> last time
  xpByDay: Record<string, number>;
  mistakes: Record<string, number>;             // exercise key -> times missed
  drafts: Record<string, Record<string, string>>;
  achievements: Record<string, number>;
  trophies: Record<string, number>;
  stats: Stats;
  streak: { count: number; best: number; last: string; freezes: number };
  daily: { date: string; quests: DailyQuest[] };
  settings: Settings;
  items: Inventory;
  games: Record<string, GameRecord>;            // minigame stop id (or "arcade:<game>") -> record
  reviews: Record<string, ReviewStop>;          // lesson id -> review stop
  history: { id: string; acc: number; at: number }[];   // first tries of recent lessons (for pacing)
  arcadeDay: { date: string; items: number };   // items earned in the arcade today (capped)
  farm: Record<string, { stars: number; size: number; at: number }>;   // Code Farm level id -> best result
  tours: Record<string, number>;                // guided tours already seen (screen -> time)
  toasts: Toast[];
  // ---- v0.7 ----
  lastSeen: number;                             // last time the game was open
  away: { days: number; at: number; seen: boolean } | null;   // the last long absence (welcome back)
  inbox: Mail[];
  pets: PetState;
  home: HomeState;
  battle: BattleState;
  dev: { on: boolean; timeOffset: number };
  decay: number;                                // 0..1: how overgrown the village is (after long absences)
  activeDay: string;                            // last day the game was opened (counts active days)
}

interface Actions {
  createProfile: (p: Omit<Profile, 'createdAt'>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setPath: (id: string) => void;
  setDailyGoal: (n: number) => void;
  loseHeart: () => void;
  refreshHearts: () => number;
  refillHearts: (cost: number) => boolean;
  gainHeart: () => void;
  noteMistake: (key: string) => void;
  clearMistake: (key: string) => void;
  saveDraft: (id: string, files: Record<string, string>) => void;
  recordRun: (r: { error?: boolean; timeout?: boolean; splash?: boolean; gems?: number; goblins?: number; offByOne?: boolean }) => void;
  finishLesson: (r: LessonResult) => Reward;
  markTestedOut: (unitId: string, nodeIds: string[]) => void;
  recordMinigame: (game: 'archery' | 'bughunt', score: number) => string[];
  finishGame: (r: { stopId?: string; game: GameId; score: number; max: number; stars?: number; courseId?: string }) => GameReward;
  useItem: (id: ItemId) => boolean;
  addItems: (inv: Partial<Inventory>) => void;
  buyItem: (id: ItemId) => boolean;
  completeReview: (lessonId: string) => void;
  markTour: (id: string) => void;
  resetTours: () => void;
  finishFarm: (id: string, stars: number, size: number) => { xp: number; gold: number; newStars: number; first: boolean; achievements: string[] };
  claimQuest: (questId: string) => void;
  buyFreeze: () => boolean;
  ensureDaily: () => void;
  unlock: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  dismissToast: (id: number) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
  resetAll: () => void;
  /** XP from any source (battles, homestead, pets...). Counts for quests, eggs and the daily goal. */
  gainXp: (amount: number, courseId?: string) => void;
  /** Checks every achievement; returns the new ones. */
  checkAchievements: () => string[];
  bumpQuest: (metric: QuestMetric, by?: number) => void;
  /** Adds a message to the raven inbox (and a toast). */
  mail: (m: Omit<Mail, 'id' | 'at'>, toast?: boolean) => void;
  readMail: (id?: number) => void;
}

const initialStats: Stats = {
  lessons: 0, perfect: 0, exercises: 0, mistakes: 0, challenges: 0, projects: 0, runs: 0, errors: 0, timeouts: 0,
  splashes: 0, gems: 0, goblins: 0, archeryBest: 0, bugHuntBest: 0, minigames: 0, questsDone: 0, practices: 0, unitTests: 0,
  bulbsUsed: 0, torchesUsed: 0, potionsUsed: 0,
  gemBest: 0, typingBest: 0, battlesWon: 0, bossesWon: 0, harvests: 0, products: 0, petsFed: 0, petPlays: 0, eggsHatched: 0, comebacks: 0, daysActive: 0, helpOpens: 0,
};

const initial = (): GameState => ({
  profile: null, pathId: null, dailyGoal: 20, xp: 0, gold: 50,
  hearts: { n: MAX_HEARTS, at: now() },
  done: {}, testedOut: {}, skillXp: {}, practicedAt: {}, xpByDay: {}, mistakes: {}, drafts: {},
  achievements: {}, trophies: {}, stats: { ...initialStats },
  streak: { count: 0, best: 0, last: '', freezes: 0 },
  daily: { date: today(), quests: questsForDay(today()) },
  settings: { sfx: true, music: false, sageNotes: true, hearts: true, speed: 1, fontSize: 15, classicCode: false, tips: true, lang: 'en', notify: false, remindHour: 19 },
  items: { ...STARTER_ITEMS }, games: {}, reviews: {}, history: [], arcadeDay: { date: '', items: 0 }, farm: {}, tours: {},
  toasts: [],
  lastSeen: now(), away: null, inbox: [], pets: initialPets(), home: initialHome(), battle: initialBattle(), dev: { on: false, timeOffset: 0 }, decay: 0, activeDay: '',
});

let toastSeq = 1;
// other systems (pet eggs) listen to XP
let onXp: (n: number) => void = () => {};
export const setXpListener = (fn: (n: number) => void) => { onXp = fn; };
// finishing a lesson also cleans the village after a long absence (see away.ts)
let onLesson: () => void = () => {};
export const setLessonListener = (fn: () => void) => { onLesson = fn; };
// the pet that follows you gives a small XP bonus in lessons
let xpBonus: () => number = () => 0;
export const setXpBonus = (fn: () => number) => { xpBonus = fn; };

export const useGame = createStore<GameState & Actions>()(
  persist(
    (set, get) => {
      const sweep = (): string[] => {
        const s = get();
        const fresh = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.check?.(s)).map((a) => a.id);
        if (fresh.length) {
          const at = now();
          const bonus = fresh.reduce((a, id) => a + (TIER_GOLD[ACHIEVEMENT_BY_ID[id].tier] ?? 0), 0);
          set((st) => ({
            gold: st.gold + bonus,
            achievements: { ...st.achievements, ...Object.fromEntries(fresh.map((id) => [id, at])) },
            toasts: [...st.toasts, ...fresh.map((id) => ({ id: toastSeq++, kind: 'achievement' as const, title: ACHIEVEMENT_BY_ID[id].name, text: ACHIEVEMENT_BY_ID[id].desc, icon: ACHIEVEMENT_BY_ID[id].icon }))],
          }));
        }
        return fresh;
      };

      const bumpQuest = (metric: QuestMetric, by = 1) => {
        get().ensureDaily();
        set((st) => {
          const fresh: Toast[] = [];
          const quests = st.daily.quests.map((q) => {
            const t = QUEST_BY_ID[q.id];
            if (!t || t.metric !== metric || q.progress >= t.goal) return q;
            const progress = Math.min(t.goal, q.progress + by);
            if (progress >= t.goal) fresh.push({ id: toastSeq++, kind: 'quest', title: 'Quest complete!', text: `${t.text}. Claim your chest on the Quests page.`, icon: 'chest' });
            return { ...q, progress };
          });
          return { daily: { ...st.daily, quests }, toasts: [...st.toasts, ...fresh] };
        });
      };

      const addXp = (amount: number, courseId?: string) => {
        const t = today();
        onXp(amount);
        set((st) => ({
          xp: st.xp + amount,
          xpByDay: { ...st.xpByDay, [t]: (st.xpByDay[t] ?? 0) + amount },
          skillXp: courseId ? { ...st.skillXp, [courseId]: (st.skillXp[courseId] ?? 0) + amount } : st.skillXp,
        }));
        bumpQuest('xp', amount);
      };

      return {
        ...initial(),

        createProfile: (p) => set({ profile: { ...p, createdAt: now() } }),
        updateProfile: (p) => { const was = get().profile?.tunic; set((st) => ({ profile: st.profile ? { ...st.profile, ...p } : st.profile })); if (p.tunic && was && p.tunic !== was) get().unlock('fashion'); },
        setPath: (id) => set({ pathId: id }),
        setDailyGoal: (n) => set({ dailyGoal: n }),

        refreshHearts: () => {
          const { hearts } = get();
          if (hearts.n >= MAX_HEARTS) return hearts.n;
          const gained = Math.floor((now() - hearts.at) / HEART_MS);
          if (gained > 0) {
            const n = Math.min(MAX_HEARTS, hearts.n + gained);
            set({ hearts: { n, at: n >= MAX_HEARTS ? now() : hearts.at + gained * HEART_MS } });
            return n;
          }
          return hearts.n;
        },
        loseHeart: () => {
          if (!get().settings.hearts) return;
          get().refreshHearts();
          set((st) => ({ hearts: { n: Math.max(0, st.hearts.n - 1), at: st.hearts.n >= MAX_HEARTS ? now() : st.hearts.at } }));
        },
        refillHearts: (cost) => {
          if (get().gold < cost) return false;
          set((st) => ({ gold: st.gold - cost, hearts: { n: MAX_HEARTS, at: now() } }));
          return true;
        },
        gainHeart: () => set((st) => ({ hearts: { n: Math.min(MAX_HEARTS, st.hearts.n + 1), at: st.hearts.at } })),

        noteMistake: (key) => set((st) => ({ mistakes: { ...st.mistakes, [key]: (st.mistakes[key] ?? 0) + 1 } })),
        clearMistake: (key) => set((st) => {
          if (!st.mistakes[key]) return {};
          const m = { ...st.mistakes };
          delete m[key];
          return { mistakes: m };
        }),

        saveDraft: (id, files) => set((st) => ({ drafts: { ...st.drafts, [id]: files } })),

        recordRun: (r) => {
          set((st) => ({
            stats: {
              ...st.stats,
              runs: st.stats.runs + 1,
              errors: st.stats.errors + (r.error ? 1 : 0),
              timeouts: st.stats.timeouts + (r.timeout ? 1 : 0),
              splashes: st.stats.splashes + (r.splash ? 1 : 0),
              gems: st.stats.gems + (r.gems ?? 0),
              goblins: st.stats.goblins + (r.goblins ?? 0),
            },
          }));
          if (r.offByOne) get().unlock('off_by_one');
          sweep();
        },

        finishLesson: (r) => {
          const s = get();
          const accuracy = r.total ? Math.round((r.correct / (r.correct + r.mistakes)) * 100) : 100;
          const perfect = r.mistakes === 0;
          const prev = s.done[r.nodeId];
          const base = r.kind === 'project' ? 50 : r.kind === 'challenge' ? 20 : r.kind === 'test' ? 30 : r.kind === 'practice' ? 10 : 15;
          const raw = base + (perfect && r.kind !== 'practice' ? 5 : 0) - (prev && r.kind !== 'practice' ? Math.round(base / 2) : 0);
          const xp = raw + Math.round(raw * xpBonus());
          const gold = r.kind === 'project' ? 30 : prev ? 2 : 5 + (perfect ? 3 : 0);
          const levelBefore = levelFromXp(s.xp).level;
          const dayXpBefore = s.xpByDay[today()] ?? 0;
          addXp(xp, r.courseId);
          const firstTry = r.kind === 'lesson' && !prev;
          const review = firstTry && accuracy < 75 && !!r.missed?.length;
          set((st) => ({
            history: firstTry ? [...st.history, { id: r.nodeId, acc: accuracy, at: now() }].slice(-20) : st.history,
            reviews: review ? { ...st.reviews, [r.nodeId]: { keys: [...new Set(r.missed)], at: now(), done: 0 } } : st.reviews,
            gold: st.gold + gold,
            done: r.kind === 'practice' ? st.done : { ...st.done, [r.nodeId]: { times: (prev?.times ?? 0) + 1, best: Math.max(prev?.best ?? 0, accuracy), at: now() } },
            practicedAt: { ...st.practicedAt, [r.courseId]: now() },
            stats: {
              ...st.stats,
              lessons: st.stats.lessons + (r.kind === 'lesson' && !prev ? 1 : 0),
              perfect: st.stats.perfect + (perfect && r.kind === 'lesson' ? 1 : 0),
              exercises: st.stats.exercises + r.correct,
              mistakes: st.stats.mistakes + r.mistakes,
              challenges: st.stats.challenges + (r.kind === 'challenge' && !prev ? 1 : 0),
              projects: st.stats.projects + (r.kind === 'project' && !prev ? 1 : 0),
              practices: st.stats.practices + (r.kind === 'practice' ? 1 : 0),
            },
          }));

          // streak
          const t = today();
          let streakUp = false;
          set((st) => {
            if (st.streak.last === t) return {};
            streakUp = true;
            let count = 1;
            if (st.streak.last === yesterday()) count = st.streak.count + 1;
            else if (st.streak.last && st.streak.freezes > 0 && st.streak.count > 0) {
              // a streak freeze saves one missed day
              const gap = (Date.parse(t) - Date.parse(st.streak.last)) / 86400000;
              if (gap <= 2) return { streak: { count: st.streak.count + 1, best: Math.max(st.streak.best, st.streak.count + 1), last: t, freezes: st.streak.freezes - 1 } };
            }
            return { streak: { count, best: Math.max(st.streak.best, count), last: t, freezes: st.streak.freezes } };
          });

          const hour = new Date().getHours();
          if ([0, 6].includes(new Date(now()).getDay()) && r.kind !== 'practice') get().unlock('weekend');
          onLesson();
          if (hour < 5) get().unlock('night_owl');
          else if (hour < 8) get().unlock('early_bird');
          if (r.kind !== 'practice') bumpQuest('lessons');
          if (perfect && r.kind === 'lesson') bumpQuest('perfect');
          if (r.kind === 'challenge' || r.kind === 'project') bumpQuest('challenges');
          if (r.kind === 'practice') bumpQuest('practice');
          const after = get();
          const levelAfter = levelFromXp(after.xp).level;
          if (levelAfter > levelBefore) get().pushToast({ kind: 'level', title: `Level ${levelAfter}!`, text: 'Your hero grows stronger.', icon: 'crown' });
          if (r.courseComplete && !after.trophies[r.courseComplete.id]) {
            set((st) => ({ trophies: { ...st.trophies, [r.courseComplete!.id]: now() } }));
            get().pushToast({ kind: 'trophy', title: 'Trophy won!', text: r.courseComplete.name, icon: 'trophy' });
          }
          if (r.pathComplete && !after.trophies[r.pathComplete.id]) {
            set((st) => ({ trophies: { ...st.trophies, [r.pathComplete!.id]: now() } }));
            get().pushToast({ kind: 'trophy', title: 'Legendary trophy!', text: r.pathComplete.name, icon: 'crown' });
          }
          const goal = get().dailyGoal;
          const dayXp = get().xpByDay[today()] ?? 0;
          const achievements = sweep();
          return { xp, gold, accuracy, levelBefore, levelAfter, streak: get().streak.count, streakUp, goalReached: dayXpBefore < goal && dayXp >= goal, achievements, review };
        },

        markTestedOut: (unitId, nodeIds) => set((st) => ({
          testedOut: { ...st.testedOut, [unitId]: now() },
          done: { ...st.done, ...Object.fromEntries(nodeIds.filter((id) => !st.done[id]).map((id) => [id, { times: 0, best: 0, at: now() }])) },
          stats: { ...st.stats, unitTests: st.stats.unitTests + 1 },
        })),

        recordMinigame: (game, score) => {
          set((st) => ({
            stats: {
              ...st.stats,
              minigames: st.stats.minigames + 1,
              archeryBest: game === 'archery' ? Math.max(st.stats.archeryBest, score) : st.stats.archeryBest,
              bugHuntBest: game === 'bughunt' ? Math.max(st.stats.bugHuntBest, score) : st.stats.bugHuntBest,
            },
            gold: st.gold + score * 2,
          }));
          addXp(score);
          bumpQuest('practice');
          return sweep();
        },

        finishGame: ({ stopId, game, score, max, stars: forced, courseId }) => {
          const key = stopId ?? 'arcade:' + game;
          const prev = get().games[key];
          const stars = forced ?? starsFor(score, max);
          const newStars = Math.max(0, stars - (prev?.stars ?? 0));
          const items: Partial<Inventory> = {};
          const add = (inv: Partial<Inventory>) => { for (const [k, v] of Object.entries(inv)) items[k as ItemId] = (items[k as ItemId] ?? 0) + (v ?? 0); };
          if (stopId) {
            for (let s = (prev?.stars ?? 0); s < stars; s++) add(STAR_ITEMS[s]);
          } else if (stars === 3) {
            // arcade games: one lightbulb for a 3-star game, up to 3 a day
            const day = get().arcadeDay.date === today() ? get().arcadeDay.items : 0;
            if (day < 3) { add({ bulb: 1 }); set({ arcadeDay: { date: today(), items: day + 1 } }); }
          }
          const gold = prev ? Math.min(10, score) : 5 * stars + 5;
          const xp = prev ? 5 : 10 + stars * 5;
          set((st) => ({
            games: { ...st.games, [key]: { stars: Math.max(stars, prev?.stars ?? 0), best: Math.max(score, prev?.best ?? 0), plays: (prev?.plays ?? 0) + 1 } },
            gold: st.gold + gold,
            stats: {
              ...st.stats,
              minigames: st.stats.minigames + 1,
              archeryBest: game === 'archery' ? Math.max(st.stats.archeryBest, score) : st.stats.archeryBest,
              bugHuntBest: game === 'bughunt' ? Math.max(st.stats.bugHuntBest, score) : st.stats.bugHuntBest,
            },
          }));
          get().addItems(items);
          addXp(xp, courseId);
          bumpQuest('practice');
          bumpQuest('games');
          const achievements = sweep();
          return { stars, newStars, items, gold, xp, best: !prev || score > prev.best, achievements };
        },

        useItem: (id) => {
          if ((get().items[id] ?? 0) <= 0) return false;
          const stat = id === 'bulb' ? 'bulbsUsed' : id === 'torch' ? 'torchesUsed' : 'potionsUsed';
          set((st) => ({ items: { ...st.items, [id]: st.items[id] - 1 }, stats: { ...st.stats, [stat]: (st.stats[stat] ?? 0) + 1 } }));
          if (id === 'potion') get().gainHeart();
          sweep();
          return true;
        },
        addItems: (inv) => set((st) => {
          const items = { ...st.items };
          for (const [k, v] of Object.entries(inv)) items[k as ItemId] = (items[k as ItemId] ?? 0) + (v ?? 0);
          return { items };
        }),
        buyItem: (id) => {
          const price = ITEM_BY_ID[id]?.price ?? Infinity;
          if (get().gold < price) return false;
          set((st) => ({ gold: st.gold - price, items: { ...st.items, [id]: (st.items[id] ?? 0) + 1 } }));
          return true;
        },
        finishFarm: (id, stars, size) => {
          const prev = get().farm[id];
          const newStars = Math.max(0, stars - (prev?.stars ?? 0));
          const first = !prev;
          const xp = first ? 15 + stars * 5 : newStars * 5 + 2;
          const gold = first ? 5 + stars * 3 : newStars * 3;
          set((st) => ({
            farm: { ...st.farm, [id]: { stars: Math.max(stars, prev?.stars ?? 0), size: Math.min(size, prev?.size ?? Infinity), at: now() } },
            gold: st.gold + gold,
            stats: { ...st.stats, challenges: st.stats.challenges + (first ? 1 : 0) },
          }));
          addXp(xp, 'js');
          if (first) bumpQuest('challenges');
          return { xp, gold, newStars, first, achievements: sweep() };
        },

        markTour: (id) => set((st) => ({ tours: { ...st.tours, [id]: now() } })),
        resetTours: () => set({ tours: {} }),

        completeReview: (lessonId) => {
          set((st) => (st.reviews[lessonId] ? { reviews: { ...st.reviews, [lessonId]: { ...st.reviews[lessonId], done: now() } } } : {}));
          sweep();
        },

        claimQuest: (questId) => {
          const t = QUEST_BY_ID[questId];
          const q = get().daily.quests.find((x) => x.id === questId);
          if (!t || !q || q.claimed || q.progress < t.goal) return;
          set((st) => ({
            gold: st.gold + t.gold,
            daily: { ...st.daily, quests: st.daily.quests.map((x) => (x.id === questId ? { ...x, claimed: true } : x)) },
            stats: { ...st.stats, questsDone: st.stats.questsDone + 1 },
          }));
          sweep();
        },

        buyFreeze: () => {
          if (get().gold < 100 || get().streak.freezes >= 2) return false;
          set((st) => ({ gold: st.gold - 100, streak: { ...st.streak, freezes: st.streak.freezes + 1 } }));
          return true;
        },

        ensureDaily: () => {
          const t = today();
          if (get().daily.date !== t) set({ daily: { date: t, quests: questsForDay(t) } });
        },

        unlock: (id) => {
          if (get().achievements[id] || !ACHIEVEMENT_BY_ID[id]) return;
          const a = ACHIEVEMENT_BY_ID[id];
          set((st) => ({
            gold: st.gold + (TIER_GOLD[a.tier] ?? 0),
            achievements: { ...st.achievements, [id]: now() },
            toasts: [...st.toasts, { id: toastSeq++, kind: 'achievement', title: a.name, text: a.desc, icon: a.icon }],
          }));
        },

        updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
        dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
        pushToast: (t) => set((st) => ({ toasts: [...st.toasts, { ...t, id: toastSeq++ }] })),
        resetAll: () => set({ ...initial() }),
        gainXp: (amount, courseId) => { addXp(amount, courseId); },
        checkAchievements: () => sweep(),
        bumpQuest: (metric, by) => bumpQuest(metric, by),
        mail: (m, toast = true) => set((st) => ({
          inbox: [{ ...m, id: toastSeq++, at: now() }, ...st.inbox].slice(0, 60),
          toasts: toast ? [...st.toasts, { id: toastSeq++, kind: 'info', title: m.title, text: m.text, icon: m.icon, sprite: m.sprite }] : st.toasts,
        })),
        readMail: (id) => set((st) => ({ inbox: st.inbox.map((x) => (id === undefined || x.id === id ? { ...x, read: true } : x)) })),
      };
    },
    {
      name: 'realm-of-code-save',
      version: 2,
      // Saves from v0.1 (kingdom map) keep the hero, XP and gold; lesson progress starts fresh.
      migrate: (old, version) => {
        const base = initial();
        if (version < 2 && old && typeof old === 'object') {
          const o = old as Partial<GameState> & { settings?: Partial<Settings> };
          return { ...base, profile: o.profile ?? null, xp: o.xp ?? 0, gold: o.gold ?? 50, achievements: o.achievements ?? {}, streak: { ...base.streak, ...(o.streak ?? {}) }, settings: { ...base.settings, sfx: o.settings?.sfx ?? true, music: o.settings?.music ?? false, sageNotes: o.settings?.sageNotes ?? true } };
        }
        return old as GameState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) }, stats: { ...current.stats, ...(p.stats ?? {}) }, streak: { ...current.streak, ...(p.streak ?? {}) }, items: { ...current.items, ...(p.items ?? {}) }, farm: p.farm ?? {}, tours: p.tours ?? {},
          pets: { ...current.pets, ...(p.pets ?? {}) }, home: { ...current.home, ...(p.home ?? {}), inv: { ...(p.home?.inv ?? current.home.inv) }, plots: Array.from({ length: 12 }, (_, i) => ({ ...emptyPlot(), ...(p.home?.plots?.[i] ?? {}) })) }, battle: { ...current.battle, ...(p.battle ?? {}) },
          dev: { ...current.dev, ...(p.dev ?? {}) }, inbox: p.inbox ?? [], lastSeen: p.lastSeen ?? now(),
        };
      },
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { toasts, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<GameState>;
      },
    },
  ),
);
