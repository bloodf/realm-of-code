// Daily quests: three small tasks per day, picked with a seed based on the date.
export type QuestMetric = 'xp' | 'lessons' | 'perfect' | 'challenges' | 'practice' | 'battles' | 'harvest' | 'petcare' | 'games';

export interface QuestTemplate { id: string; text: string; metric: QuestMetric; goal: number; gold: number }

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: 'xp20', text: 'Earn 20 XP', metric: 'xp', goal: 20, gold: 15 },
  { id: 'xp50', text: 'Earn 50 XP', metric: 'xp', goal: 50, gold: 30 },
  { id: 'lessons2', text: 'Complete 2 lessons', metric: 'lessons', goal: 2, gold: 15 },
  { id: 'lessons4', text: 'Complete 4 lessons', metric: 'lessons', goal: 4, gold: 30 },
  { id: 'perfect', text: 'Finish a lesson with no mistakes', metric: 'perfect', goal: 1, gold: 20 },
  { id: 'perfect2', text: 'Finish 2 perfect lessons', metric: 'perfect', goal: 2, gold: 30 },
  { id: 'challenge', text: 'Solve a coding challenge', metric: 'challenges', goal: 1, gold: 25 },
  { id: 'practice', text: 'Practice a skill or play a minigame', metric: 'practice', goal: 1, gold: 20 },
  { id: 'battle2', text: 'Win 2 battles at the Monster Gate', metric: 'battles', goal: 2, gold: 30 },
  { id: 'harvest5', text: 'Harvest 5 crops at your homestead', metric: 'harvest', goal: 5, gold: 25 },
  { id: 'petcare3', text: 'Feed or play with your pet 3 times', metric: 'petcare', goal: 3, gold: 20 },
  { id: 'games2', text: 'Play 2 minigames', metric: 'games', goal: 2, gold: 25 },
];

export interface DailyQuest { id: string; progress: number; claimed: boolean }

export function questsForDay(date: string): DailyQuest[] {
  let seed = [...date].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const pool = QUEST_TEMPLATES.slice();
  const picked: DailyQuest[] = [{ id: pool[seed % 2].id, progress: 0, claimed: false }];   // always one XP quest
  pool.splice(0, 2);
  while (picked.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const i = seed % pool.length;
    if (!picked.some((p) => QUEST_BY_ID[p.id]?.metric === pool[i].metric)) picked.push({ id: pool[i].id, progress: 0, claimed: false });
    pool.splice(i, 1);
  }
  return picked;
}

export const QUEST_BY_ID: Record<string, QuestTemplate> = Object.fromEntries(QUEST_TEMPLATES.map((q) => [q.id, q]));
