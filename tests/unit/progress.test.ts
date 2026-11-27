import { describe, expect, test } from 'vitest';
import { levelFromXp, xpToNext, titleFor, lessonXp, lessonGold } from '../../src/game/progress';
import { questsForDay, QUEST_BY_ID, QUEST_TEMPLATES } from '../../src/game/quests';
import { starsFor, ITEMS, STARTER_ITEMS } from '../../src/game/items';

describe('levels and XP', () => {
  test('each level needs 50 XP more than the last', () => {
    expect(xpToNext(1)).toBe(50);
    expect(xpToNext(4)).toBe(200);
  });
  test('levelFromXp', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, need: 50 });
    expect(levelFromXp(49).level).toBe(1);
    expect(levelFromXp(50)).toEqual({ level: 2, into: 0, need: 100 });
    expect(levelFromXp(50 + 100 + 30)).toEqual({ level: 3, into: 30, need: 150 });
  });
  test('titles grow with the level', () => {
    expect(titleFor(1)).toBe('Peasant');
    expect(titleFor(8)).toBe('Knight');
    expect(titleFor(99)).toBe('Legend');
  });
  test('lesson XP and gold', () => {
    expect(lessonXp(20, 1, false)).toBe(20);
    expect(lessonXp(20, 3, false)).toBe(30);
    expect(lessonXp(20, 3, true)).toBe(15);   // seeing the solution halves the reward
    expect(lessonGold(3)).toBe(25);
  });
});

describe('daily quests', () => {
  test('three quests a day, the first one about XP, no two with the same goal type', () => {
    for (const day of ['2026-01-01', '2026-02-14', '2026-07-09', '2026-11-22', '2027-03-31']) {
      const qs = questsForDay(day);
      expect(qs).toHaveLength(3);
      expect(QUEST_BY_ID[qs[0].id].metric).toBe('xp');
      expect(new Set(qs.map((q) => QUEST_BY_ID[q.id].metric)).size).toBe(3);
      expect(qs.every((q) => q.progress === 0 && !q.claimed)).toBe(true);
    }
  });
  test('the same day always gives the same quests', () => {
    expect(questsForDay('2026-05-05')).toEqual(questsForDay('2026-05-05'));
  });
  test('quest templates have unique ids and positive goals', () => {
    expect(new Set(QUEST_TEMPLATES.map((q) => q.id)).size).toBe(QUEST_TEMPLATES.length);
    expect(QUEST_TEMPLATES.every((q) => q.goal > 0 && q.gold > 0)).toBe(true);
  });
});

describe('items and stars', () => {
  test('stars from a score', () => {
    expect(starsFor(0, 0)).toBe(0);
    expect(starsFor(3, 10)).toBe(0);
    expect(starsFor(4, 10)).toBe(1);
    expect(starsFor(7, 10)).toBe(2);
    expect(starsFor(9, 10)).toBe(3);
  });
  test('three items, all with a price, and a starter kit', () => {
    expect(ITEMS.map((i) => i.id)).toEqual(['bulb', 'torch', 'potion']);
    expect(ITEMS.every((i) => i.price > 0)).toBe(true);
    expect(STARTER_ITEMS).toEqual({ bulb: 3, torch: 1, potion: 1 });
  });
});
