import { beforeEach, describe, expect, test } from 'vitest';
import { useGame, MAX_HEARTS } from '../../src/game/store';
import { DAY, MIN } from '../../src/game/clock';
import { today } from '../../src/game/progress';
import { QUEST_BY_ID } from '../../src/game/quests';
import { freshGame, skip, lesson, achGold } from './helpers';

const S = () => useGame.getState();

beforeEach(() => { skip.reset(); freshGame(); });

describe('finishing lessons', () => {
  test('a perfect first lesson gives XP, gold, progress and starts the streak', () => {
    const r = lesson('web-1-1');
    expect(r.xp).toBe(20);                    // 15 + 5 for a perfect lesson
    expect(r.accuracy).toBe(100);
    expect(r.streak).toBe(1);
    expect(r.streakUp).toBe(true);
    expect(S().xp).toBe(20);
    expect(S().gold - achGold()).toBe(50 + 8);
    expect(S().done['web-1-1']).toMatchObject({ times: 1, best: 100 });
    expect(S().stats.lessons).toBe(1);
    expect(S().achievements.first_lesson).toBeGreaterThan(0);
    expect(S().xpByDay[today()]).toBe(20);
  });
  test('repeating a lesson gives less XP and does not count as a new lesson', () => {
    lesson('web-1-1');
    const r = lesson('web-1-1');
    expect(r.xp).toBe(20 - 8);
    expect(S().stats.lessons).toBe(1);
    expect(S().done['web-1-1'].times).toBe(2);
  });
  test('a hard first try adds a review stop with the missed exercises', () => {
    const r = lesson('web-1-2', { correct: 3, mistakes: 3, missed: ['web-1-2#1', 'web-1-2#1', 'web-1-2#3'] });
    expect(r.review).toBe(true);
    expect(S().reviews['web-1-2'].keys).toEqual(['web-1-2#1', 'web-1-2#3']);
  });
  test('projects pay more than lessons', () => {
    expect(lesson('c-py-13', { kind: 'project', courseId: 'python' }).xp).toBe(55);
    expect(S().stats.projects).toBe(1);
    expect(S().skillXp.python).toBe(55);
  });
});

describe('streaks', () => {
  test('grows on consecutive days and restarts after a missed day', () => {
    lesson('a');
    skip(DAY); expect(lesson('b').streak).toBe(2);
    skip(DAY); expect(lesson('c').streak).toBe(3);
    skip(3 * DAY); expect(lesson('d').streak).toBe(1);
    expect(S().streak.best).toBe(3);
  });
  test('only the first lesson of the day raises the streak', () => {
    lesson('a');
    expect(lesson('b').streakUp).toBe(false);
    expect(S().streak.count).toBe(1);
  });
  test('a streak freeze saves one missed day', () => {
    useGame.setState({ gold: 500 });
    lesson('a');
    expect(S().buyFreeze()).toBe(true);
    skip(2 * DAY);
    expect(lesson('b').streak).toBe(2);
    expect(S().streak.freezes).toBe(0);
  });
  test('at most two freezes, 100 gold each', () => {
    useGame.setState({ gold: 1000 });
    expect(S().buyFreeze()).toBe(true);
    expect(S().buyFreeze()).toBe(true);
    expect(S().buyFreeze()).toBe(false);
    expect(S().gold).toBe(800);
  });
});

describe('hearts', () => {
  test('a mistake costs a heart and hearts come back every 20 minutes', () => {
    S().loseHeart(); S().loseHeart();
    expect(S().hearts.n).toBe(MAX_HEARTS - 2);
    skip(21 * MIN);
    expect(S().refreshHearts()).toBe(MAX_HEARTS - 1);
    skip(20 * MIN);
    expect(S().refreshHearts()).toBe(MAX_HEARTS);
  });
  test('relaxed mode: no hearts are lost', () => {
    S().updateSettings({ hearts: false });
    S().loseHeart();
    expect(S().hearts.n).toBe(MAX_HEARTS);
  });
  test('a potion gives a heart back', () => {
    S().loseHeart();
    expect(S().useItem('potion')).toBe(true);
    expect(S().hearts.n).toBe(MAX_HEARTS);
    expect(S().items.potion).toBe(0);
    expect(S().useItem('potion')).toBe(false);
  });
  test('refilling costs gold', () => {
    S().loseHeart();
    expect(S().refillHearts(1000)).toBe(false);
    expect(S().refillHearts(30)).toBe(true);
    expect(S().hearts.n).toBe(MAX_HEARTS);
    expect(S().gold).toBe(20);
  });
});

describe('minigames, items and quests', () => {
  test('a 3-star minigame stop gives the items of every star once', () => {
    const r = S().finishGame({ stopId: 'stop-1', game: 'link', score: 10, max: 10 });
    expect(r.stars).toBe(3);
    expect(r.items).toEqual({ bulb: 2, torch: 1, potion: 1 });
    expect(S().items).toEqual({ bulb: 5, torch: 2, potion: 2 });
    const again = S().finishGame({ stopId: 'stop-1', game: 'link', score: 10, max: 10 });
    expect(again.newStars).toBe(0);
    expect(again.items).toEqual({});
  });
  test('arcade games give at most 3 lightbulbs a day', () => {
    for (let i = 0; i < 5; i++) S().finishGame({ game: 'gemforge', score: 10, max: 10 });
    expect(S().items.bulb).toBe(3 + 3);
  });
  test('the merchant sells items for gold', () => {
    useGame.setState({ gold: 20 });
    expect(S().buyItem('torch')).toBe(false);
    expect(S().buyItem('bulb')).toBe(true);
    expect(S().gold).toBe(5);
  });
  test('quests fill up and pay out once', () => {
    S().ensureDaily();
    const xpQuest = S().daily.quests[0];
    S().gainXp(100);
    const q = S().daily.quests.find((x) => x.id === xpQuest.id)!;
    expect(q.progress).toBe(QUEST_BY_ID[q.id].goal);
    const gold = S().gold - achGold();
    S().claimQuest(q.id);
    S().claimQuest(q.id);
    expect(S().gold - achGold()).toBe(gold + QUEST_BY_ID[q.id].gold);
    expect(S().stats.questsDone).toBe(1);
  });
});

describe('inbox and save', () => {
  test('mail goes to the inbox (newest first) and can be read', () => {
    S().mail({ kind: 'info', title: 'One', text: 'a' });
    S().mail({ kind: 'info', title: 'Two', text: 'b' }, false);
    expect(S().inbox.map((m) => m.title)).toEqual(['Two', 'One']);
    expect(S().toasts).toHaveLength(1);
    S().readMail();
    expect(S().inbox.every((m) => m.read)).toBe(true);
  });
  test('the game is saved in localStorage without the toasts', () => {
    lesson('web-1-1');
    const saved = JSON.parse(localStorage.getItem('realm-of-code-save')!);
    expect(saved.version).toBe(2);
    expect(saved.state.xp).toBe(20);
    expect(saved.state.toasts).toBeUndefined();
  });
});
