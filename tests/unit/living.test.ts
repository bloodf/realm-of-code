// The v0.7 "living realm": pets, the homestead, battles and what happens when you are away.
import { beforeEach, describe, expect, test } from 'vitest';
import { useGame } from '../../src/game/store';
import { DAY, HOUR, MIN } from '../../src/game/clock';
import { SPECIES, RARITY, RARITIES, EGG_ODDS, SHINY_CHANCE, updatePet, mood, giveEgg, hatch, spawnPet, feedPet, playWithPet, petXpBonus, buyEgg } from '../../src/game/pets';
import { CROPS, ANIMALS, MAX_ANIMALS, plant, water, harvest, tickHome, updatePlot, plotStage, buyAnimal, feedAnimal, collect, sell, clearPlot, SELL } from '../../src/game/home';
import { MOBS, REGIONS, TRIAL, winBattle, loseBattle, spawnInvaders, scaledMob } from '../../src/game/battle';
import { checkAbsence, cleanDecay, markSeen } from '../../src/game/away';
import type { Pet } from '../../src/game/types07';
import { freshGame, skip, lesson, achGold } from './helpers';

const S = () => useGame.getState();
beforeEach(() => { skip.reset(); freshGame(); });

describe('pets', () => {
  test('20 species: 8 common, 5 uncommon, 4 rare, 3 ultra rare', () => {
    expect(SPECIES).toHaveLength(20);
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(20);
    const count = (r: string) => SPECIES.filter((s) => s.rarity === r).length;
    expect([count('common'), count('uncommon'), count('rare'), count('ultra')]).toEqual([8, 5, 4, 3]);
  });
  test('egg odds add up to 1 and rarer pets give a bigger XP bonus', () => {
    for (const r of RARITIES) expect(Object.values(EGG_ODDS[r]).reduce((a, b) => a + b!, 0)).toBeCloseTo(1, 5);
    const bonus = RARITIES.map((r) => RARITY[r].bonus);
    expect([...bonus].sort((a, b) => a - b)).toEqual(bonus);
    expect(SHINY_CHANCE).toBeGreaterThan(0);
    expect(SHINY_CHANCE).toBeLessThan(0.2);
  });
  test('pets get hungry and lonely over time', () => {
    const p: Pet = { uid: 'p', species: 'fox', shiny: false, name: 'Fox', level: 1, xp: 0, full: 80, joy: 80, tick: 0, born: 0 };
    expect(mood(p)).toBe('happy');
    const later = updatePet(p, 20 * HOUR);
    expect(later.full).toBeLessThan(p.full);
    expect(mood(later)).toBe('hungry');
  });
  test('an egg hatches after enough XP', () => {
    const egg = giveEgg('common');
    expect(hatch(egg.uid)).toBeNull();             // not warm yet
    S().gainXp(RARITY.common.need);
    const pet = hatch(egg.uid)!;
    expect(pet).not.toBeNull();
    expect(S().pets.list).toHaveLength(1);
    expect(S().pets.active).toBe(pet.uid);
    expect(S().pets.dex[pet.species].n).toBe(1);
    expect(S().inbox.some((m) => m.kind === 'pet')).toBe(true);
  });
  test('every species can be normal or shiny (developer mode spawns them)', () => {
    for (const sp of SPECIES) {
      expect(spawnPet(sp.id, false)!.shiny).toBe(false);
      expect(spawnPet(sp.id, true)!.shiny).toBe(true);
    }
    expect(Object.keys(S().pets.dex)).toHaveLength(20);
    for (const id of ['pet1', 'pets20', 'pet_rare', 'pet_ultra', 'pet_shiny', 'pet_shiny5']) expect(S().achievements[id], id).toBeGreaterThan(0);
  });
  test('feeding with a favourite food and playing makes a pet happy', () => {
    const pet = spawnPet('bunny', false)!;
    useGame.setState((s) => ({ pets: { ...s.pets, list: s.pets.list.map((p) => ({ ...p, full: 30, joy: 30 })) }, home: { ...s.home, inv: { carrot: 2 } } }));
    expect(feedPet(pet.uid, 'carrot')).toBe('ok');
    expect(playWithPet(pet.uid)).toBe(true);
    const p = S().pets.list[0];
    expect(p.full).toBeGreaterThan(60);
    expect(p.joy).toBeGreaterThan(60);
    expect(feedPet(pet.uid, 'truffle')).toBe('none');   // you have none
    expect(petXpBonus()).toBeCloseTo(RARITY.common.bonus);
  });
  test('ultra rare eggs cannot be bought', () => {
    useGame.setState({ gold: 100000 });
    expect(buyEgg('ultra')).toBe(false);
    expect(buyEgg('rare')).toBe(true);
  });
});

describe('homestead', () => {
  test('8 crops and 8 animals, and everything you grow can be sold', () => {
    expect(CROPS).toHaveLength(8);
    expect(ANIMALS).toHaveLength(8);
    expect(MAX_ANIMALS).toBe(8);
    for (const c of CROPS) expect(SELL[c.id]).toBeGreaterThan(c.seed);
    for (const a of ANIMALS) if (a.product) expect(SELL[a.product]).toBeGreaterThan(0);
  });
  test('plant, water, wait, harvest and sell', () => {
    expect(plant(0, 'wheat')).toBe(true);
    expect(plant(0, 'wheat')).toBe(false);           // the plot is busy
    expect(water(0)).toBe(true);
    skip(2 * MIN);
    expect(plotStage(updatePlot(S().home.plots[0]))).not.toBe('ripe');
    skip(2 * MIN);
    expect(plotStage(updatePlot(S().home.plots[0]))).toBe('ripe');
    expect(harvest(0)).toBe('wheat');
    expect(S().home.inv.wheat).toBeGreaterThanOrEqual(1);
    expect(S().stats.harvests).toBe(1);
    const gold = S().gold;
    expect(sell('wheat')).toBe(SELL.wheat);
    expect(S().gold).toBeGreaterThanOrEqual(gold + SELL.wheat);
  });
  test('dry crops grow three times slower', () => {
    plant(0, 'wheat');
    skip(4 * MIN);
    expect(plotStage(updatePlot(S().home.plots[0]))).not.toBe('ripe');
    skip(6 * MIN);
    expect(plotStage(updatePlot(S().home.plots[0]))).toBe('ripe');
  });
  test('ripe crops wither and empty plots get weeds when you stay away', () => {
    tickHome();                                      // the garden starts counting time
    plant(0, 'wheat'); water(0);
    skip(2 * DAY);
    const plots = S().home.plots.map((p) => updatePlot(p));
    expect(plots[0].withered).toBe(true);
    expect(plots[1].weeds).toBe(true);
    useGame.setState((s) => ({ home: { ...s.home, plots } }));
    expect(clearPlot(0)).toBe(true);
  });
  test('a fed chicken lays eggs', () => {
    useGame.setState({ gold: 1000 });
    const hen = buyAnimal('chicken')!;
    expect(S().gold - achGold()).toBe(1000 - 60);
    expect(feedAnimal(hen.uid)).toBe('hay');
    skip(45 * MIN);
    const got = collect(hen.uid)!;
    expect(got.item).toBe('egg');
    expect(got.n).toBeGreaterThanOrEqual(2);
  });
});

describe('battles', () => {
  test('five regions with known monsters; dragons are enemies, and the Junior Trial is a dragon', () => {
    expect(REGIONS).toHaveLength(5);
    for (const r of REGIONS) for (const m of [...r.mobs, r.boss]) expect(MOBS[m]).toBeDefined();
    expect(Object.values(MOBS).filter((m) => /dragon/i.test(m.name)).length).toBeGreaterThanOrEqual(3);
    expect(MOBS[TRIAL.mob].name).toMatch(/Dragon/);
  });
  test('monsters grow a little with the hero', () => {
    const weak = scaledMob('slime').hp;
    useGame.setState({ xp: 20000 });
    expect(scaledMob('slime').hp).toBeGreaterThan(weak);
  });
  test('winning and losing are recorded; a first boss win always drops an egg', () => {
    const r = winBattle('mushroomLord', 'meadow', 7);
    expect(r.first).toBe(true);
    expect(r.egg).toBe('uncommon');
    expect(S().battle.wins).toBe(1);
    expect(S().battle.cleared.meadow).toBe(1);
    expect(S().battle.best.meadow).toBe(7);
    expect(S().stats.bossesWon).toBe(1);
    loseBattle();
    expect(S().battle.losses).toBe(1);
  });
});

describe('coming back after a long time (Duolingo style)', () => {
  test('a short break changes nothing', () => {
    markSeen();
    skip(2 * HOUR);
    expect(checkAbsence()).toBeNull();
  });
  test('three days away: the streak breaks, pets get hungry, monsters come, the village decays, Lumi writes', () => {
    lesson('web-1-1');
    spawnPet('fox', false);
    markSeen();
    skip(3 * DAY + HOUR);
    const r = checkAbsence()!;
    expect(r.days).toBe(3);
    expect(r.streakLost).toBe(true);
    expect(r.hungryPets).toHaveLength(1);
    expect(r.invaders).toBe(3);
    expect(S().decay).toBeCloseTo(0.3);
    expect(S().away).toMatchObject({ days: 3, seen: false });
    expect(S().inbox[0].kind).toBe('away');
  });
  test('chasing invaders and learning again clean the village and pay a comeback bonus', () => {
    markSeen();
    skip(4 * DAY);
    checkAbsence();
    const inv = S().battle.invaders[0];
    winBattle(inv.mob, null, 3, inv.uid);
    expect(S().battle.invaders).toHaveLength(3);
    cleanDecay(); cleanDecay();
    expect(S().decay).toBe(0);
    expect(S().stats.comebacks).toBe(1);
  });
  test('monsters are capped', () => {
    spawnInvaders(50);
    expect(S().battle.invaders.length).toBeLessThanOrEqual(9);
  });
});
