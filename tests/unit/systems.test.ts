// Achievements, the Code Farm levels, minigame data and the small runner helpers.
import { beforeEach, describe, expect, test } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, CATEGORIES, TIER_GOLD, careerRank } from '../../src/game/achievements';
import { useGame } from '../../src/game/store';
import { LEVELS, starsFor as farmStars } from '../../src/farm/levels';
import { runFarmSync } from '../../src/farm/sim';
import { blockCount, codeLines, toJs } from '../../src/farm/program';
import { countPlanks, makeLoop, makeQuery, KNIGHTS, optionsFor } from '../../src/games/data';
import { BUGS } from '../../src/games/bugs';
import { shuffle } from '../../src/games/pools';
import { formatValue, eq } from '../../src/runners/format';
import { explainError, explainPoly, explainTs } from '../../src/runners/oracle';
import { tokenize } from '../../src/lib/tokens';
import { pathNodes } from '../../src/course';
import { freshGame, skip } from './helpers';

beforeEach(() => { skip.reset(); freshGame(); });

describe('achievements', () => {
  test('124 achievements with unique ids in 11 categories and 4 tiers', () => {
    expect(ACHIEVEMENTS).toHaveLength(124);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(124);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    expect(cats.size).toBe(11);
    for (const a of ACHIEVEMENTS) {
      expect(cats.has(a.cat), a.id).toBe(true);
      expect(TIER_GOLD[a.tier], a.id).toBeGreaterThan(0);
      expect(a.name && a.desc && a.icon, a.id).toBeTruthy();
    }
    for (const c of CATEGORIES) expect(ACHIEVEMENTS.some((a) => a.cat === c.id), c.id).toBe(true);
    for (const t of ['bronze', 'silver', 'gold', 'legend']) expect(ACHIEVEMENTS.some((a) => a.tier === t), t).toBe(true);
    expect(ACHIEVEMENTS.filter((a) => a.secret).length).toBeGreaterThanOrEqual(5);
  });
  test('no check throws on a brand-new save, and none is already unlocked', () => {
    const s = useGame.getState();
    for (const a of ACHIEVEMENTS) expect(a.check?.(s) ?? false, a.id).toBe(false);
  });
  test('unlocking pays gold once', () => {
    const gold = useGame.getState().gold;
    useGame.getState().unlock('first_lesson');
    useGame.getState().unlock('first_lesson');
    expect(useGame.getState().gold).toBe(gold + TIER_GOLD[ACHIEVEMENT_BY_ID.first_lesson.tier]);
  });
  test('career rank: newcomer → apprentice → trainee → candidate → junior developer', () => {
    const nodes = pathNodes('trainee');
    const doneUpTo = (pct: number) => Object.fromEntries(nodes.slice(0, Math.ceil((nodes.length * pct) / 100)).map((n) => [n.node.id, { times: 1, best: 100, at: 1 }]));
    const rank = (done: Record<string, unknown>, elder = 0) => careerRank({ ...useGame.getState(), done, battle: { ...useGame.getState().battle, kills: { elder } } } as never).id;
    expect(rank({})).toBe('newcomer');
    expect(rank(doneUpTo(10))).toBe('apprentice');
    expect(rank(doneUpTo(50))).toBe('trainee');
    expect(rank(doneUpTo(100))).toBe('candidate');
    expect(rank(doneUpTo(100), 1)).toBe('junior');
  });
});

describe('Code Farm', () => {
  test('every level: the reference solution earns 3 stars and an empty program fails', () => {
    expect(LEVELS.length).toBe(30);
    for (const lv of LEVELS) {
      const code = typeof lv.solution === 'string' ? lv.solution : toJs(lv.solution);
      const size = typeof lv.solution === 'string' ? codeLines(lv.solution) : blockCount(lv.solution);
      const { result, error } = runFarmSync(lv.farm, code);
      expect(error, lv.id).toBeFalsy();
      const failed = lv.goals.filter((g) => !g.check(result, lv, code)).map((g) => g.text);
      expect(failed, lv.id).toEqual([]);
      expect(farmStars(lv, true, result.mistakes, size), lv.id).toBe(3);
      const empty = runFarmSync(lv.farm, lv.starter ?? '');
      expect(lv.goals.every((g) => g.check(empty.result, lv, lv.starter ?? '')), `${lv.id} starter passes`).toBe(false);
    }
  });
});

describe('minigame data', () => {
  test('Loop Bridge: the plank count comes from running the loop', () => {
    expect(countPlanks('for (let i = 0; i < 4; i++) { bridge.addPlank(); }')).toBe(4);
    expect(countPlanks('for (let i = 1; i <= 4; i++) { bridge.addPlank(); }')).toBe(4);
    expect(countPlanks('for (let i = 0; i <= 4; i++) { bridge.addPlank(); }')).toBe(5);
    for (let round = 0; round < 8; round++) {
      const r = makeLoop(round, () => true);
      expect(countPlanks(r.code)).toBe(r.count);
      expect(optionsFor(r.count)).toContain(r.count);
    }
  });
  test('Archive: every query names knights that really match', () => {
    for (let round = 0; round < 8; round++) {
      const q = makeQuery(round, () => true);
      expect(q.sql).toMatch(/^SELECT name\s+FROM knights/);
      expect(q.ids.length).toBeGreaterThan(0);
      for (const id of q.ids) expect(KNIGHTS.some((k) => k.id === id)).toBe(true);
    }
  });
  test('Bug Hunt: the buggy line is inside the code', () => {
    for (const b of BUGS) expect(b.line).toBeLessThanOrEqual(b.code.split('\n').length);
  });
  test('shuffle keeps every item', () => {
    const a = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(a.slice()).sort((x, y) => x - y)).toEqual(a);
  });
});

describe('runner helpers', () => {
  test('formatValue prints like console.log', () => {
    expect(formatValue('hi')).toBe('hi');
    expect(formatValue([1, 'a', null])).toBe('[ 1, "a", null ]');
    expect(formatValue({ a: 1, 'b-c': [] })).toBe('{ a: 1, "b-c": [] }');
    expect(formatValue(new Map([[1, 2]]))).toBe('Map(1) { 1 => 2 }');
    expect(formatValue(undefined)).toBe('undefined');
  });
  test('deep equality', () => {
    expect(eq({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(eq([1, 2], [2, 1])).toBe(false);
    expect(eq({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(eq(NaN, NaN)).toBe(true);
  });
  test('the Oracle explains errors in plain words', () => {
    expect(explainError('TypeError', 'hero.moveRigth is not a function')).toContain('hero.moveRight()');
    expect(explainError('ReferenceError', 'score is not defined')).toContain('`score`');
    expect(explainTs(7006, '')).toContain('type');
    expect(explainPoly('py', 'NameError', "name 'x' is not defined")).toContain('`x`');
    expect(explainPoly('py', 'ZeroDivisionError', 'division by zero')).toContain('zero');
    expect(explainPoly('php', 'ParseError', 'syntax error, unexpected end of file, expecting ";"')).toContain(';');
    expect(explainError('Error', 'something nobody knows')).toBeNull();
  });
  test('the code tokenizer keeps the text and finds keywords and strings', () => {
    const code = 'const a = "hi"; // note';
    const toks = tokenize(code, 'js');
    expect(toks.map((t) => t.text).join('')).toBe(code);
    expect(toks.find((t) => t.text === 'const')?.cls).toBe('k');
    expect(toks.find((t) => t.text === '"hi"')?.cls).toBe('s');
  });
});
