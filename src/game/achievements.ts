// Achievements: 100+ goals in 11 categories, with bronze, silver, gold and legendary tiers.
// Some are secret until you find them. Names and descriptions are English keys for t().
import type { GameState } from './store';
import { levelFromXp } from './progress';
import { learnerPace } from '../course/adaptive';
import { SPECIES } from './petData';
import { courseProgress, COURSES, PATHS, pathProgress } from '../course';

export type Tier = 'bronze' | 'silver' | 'gold' | 'legend';
export type Category = 'learn' | 'code' | 'streak' | 'hero' | 'games' | 'farm' | 'home' | 'pets' | 'battle' | 'career' | 'secret';
export interface Achievement { id: string; name: string; desc: string; icon: string; cat: Category; tier: Tier; secret?: boolean; gold?: number; check?: (s: GameState) => boolean }

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'learn', name: 'Learning', icon: 'scroll' }, { id: 'code', name: 'Coding', icon: 'code' }, { id: 'streak', name: 'Streaks', icon: 'flame' },
  { id: 'hero', name: 'Your hero', icon: 'helm' }, { id: 'games', name: 'Minigames', icon: 'rune' }, { id: 'farm', name: 'Code Farm', icon: 'tree' },
  { id: 'home', name: 'Homestead', icon: 'home' }, { id: 'pets', name: 'Pets', icon: 'heart' }, { id: 'battle', name: 'Battles', icon: 'sword' },
  { id: 'career', name: 'Career', icon: 'briefcase' }, { id: 'secret', name: 'Secrets', icon: 'key' },
];
export const TIER_COLOR: Record<Tier, string> = { bronze: '#c07a3a', silver: '#a8b0c0', gold: '#e7a72c', legend: '#a66be0' };
export const TIER_GOLD: Record<Tier, number> = { bronze: 10, silver: 25, gold: 60, legend: 150 };

const stars = (s: GameState) => Object.values(s.games ?? {}).reduce((a, g) => a + g.stars, 0);
const lessons = (s: GameState) => s.stats.lessons;
const farmStars = (s: GameState) => Object.values(s.farm ?? {}).reduce((a, f) => a + f.stars, 0);
const dexCount = (s: GameState) => Object.keys(s.pets?.dex ?? {}).length;
const shinies = (s: GameState) => Object.values(s.pets?.dex ?? {}).reduce((a, d) => a + d.shiny, 0);
const hasRarity = (s: GameState, r: string) => SPECIES.some((sp) => sp.rarity === r && s.pets?.dex?.[sp.id]);
const maxPetLevel = (s: GameState) => Math.max(0, ...(s.pets?.list ?? []).map((p) => p.level));
const courseDone = (s: GameState, id: string) => { const p = courseProgress(id, s.done); return p.total > 0 && p.done >= p.total; };
const coursesDone = (s: GameState) => COURSES.filter((c) => courseDone(s, c.id)).length;
const bestPath = (s: GameState) => Math.max(0, ...PATHS.map((p) => pathProgress(p.id, s.done).pct));
const kills = (s: GameState, id: string) => s.battle?.kills?.[id] ?? 0;
const animals = (s: GameState, kind?: string) => (s.home?.animals ?? []).filter((a) => !kind || a.kind === kind).length;
const A = (a: Achievement) => a;

export const ACHIEVEMENTS: Achievement[] = [
  // ---- learning ----
  A({ id: 'first_lesson', name: 'First Steps', desc: 'Complete your first lesson.', icon: 'boot', cat: 'learn', tier: 'bronze', check: (s) => lessons(s) >= 1 }),
  A({ id: 'lessons10', name: 'Apprentice', desc: 'Complete 10 lessons.', icon: 'scroll', cat: 'learn', tier: 'bronze', check: (s) => lessons(s) >= 10 }),
  A({ id: 'lessons25', name: 'Bookworm', desc: 'Complete 25 lessons.', icon: 'book', cat: 'learn', tier: 'silver', check: (s) => lessons(s) >= 25 }),
  A({ id: 'lessons50', name: 'Journeyman', desc: 'Complete 50 lessons.', icon: 'shield', cat: 'learn', tier: 'silver', check: (s) => lessons(s) >= 50 }),
  A({ id: 'lessons100', name: 'Scholar', desc: 'Complete 100 lessons.', icon: 'book2', cat: 'learn', tier: 'gold', check: (s) => lessons(s) >= 100 }),
  A({ id: 'lessons150', name: 'Master Craftsman', desc: 'Complete 150 lessons.', icon: 'hammer', cat: 'learn', tier: 'gold', check: (s) => lessons(s) >= 150 }),
  A({ id: 'lessons250', name: 'Living Library', desc: 'Complete 250 lessons.', icon: 'crown', cat: 'learn', tier: 'legend', check: (s) => lessons(s) >= 250 }),
  A({ id: 'perfect1', name: 'Flawless', desc: 'Finish a lesson with no mistakes.', icon: 'star', cat: 'learn', tier: 'bronze', check: (s) => s.stats.perfect >= 1 }),
  A({ id: 'perfect20', name: 'Sharp Mind', desc: 'Finish 20 lessons with no mistakes.', icon: 'eye', cat: 'learn', tier: 'silver', check: (s) => s.stats.perfect >= 20 }),
  A({ id: 'perfect75', name: 'Perfectionist', desc: 'Finish 75 lessons with no mistakes.', icon: 'eye', cat: 'learn', tier: 'gold', check: (s) => s.stats.perfect >= 75 }),
  A({ id: 'exercises100', name: 'Warming Up', desc: 'Answer 100 exercises correctly.', icon: 'heart', cat: 'learn', tier: 'bronze', check: (s) => s.stats.exercises >= 100 }),
  A({ id: 'exercises500', name: 'Tireless', desc: 'Answer 500 exercises correctly.', icon: 'heart', cat: 'learn', tier: 'silver', check: (s) => s.stats.exercises >= 500 }),
  A({ id: 'exercises1500', name: 'Unstoppable', desc: 'Answer 1500 exercises correctly.', icon: 'bolt', cat: 'learn', tier: 'gold', check: (s) => s.stats.exercises >= 1500 }),
  A({ id: 'unit_test', name: 'Gatecrasher', desc: 'Skip ahead by passing a unit test.', icon: 'key', cat: 'learn', tier: 'silver', check: (s) => s.stats.unitTests >= 1 }),
  A({ id: 'practice5', name: 'Practice Makes Perfect', desc: 'Finish 5 practice sessions.', icon: 'target', cat: 'learn', tier: 'bronze', check: (s) => s.stats.practices >= 5 }),
  A({ id: 'practice25', name: 'Drill Sergeant', desc: 'Finish 25 practice sessions.', icon: 'target', cat: 'learn', tier: 'silver', check: (s) => s.stats.practices >= 25 }),
  A({ id: 'back_on_track', name: 'Back on Track', desc: 'Finish a review stop on your path.', icon: 'reset', cat: 'learn', tier: 'bronze', check: (s) => Object.values(s.reviews ?? {}).some((r) => r.done) }),
  A({ id: 'on_a_roll', name: 'On a Roll', desc: 'Get so good that lessons turn into express lessons.', icon: 'bolt', cat: 'learn', tier: 'silver', check: (s) => learnerPace(s.history ?? []).pace === 'strong' }),
  A({ id: 'polyglot', name: 'Polyglot', desc: 'Earn XP in 5 different skills.', icon: 'book', cat: 'learn', tier: 'silver', check: (s) => Object.values(s.skillXp).filter((x) => x > 0).length >= 5 }),
  A({ id: 'polyglot10', name: 'Renaissance Coder', desc: 'Earn XP in 10 different skills.', icon: 'book2', cat: 'learn', tier: 'gold', check: (s) => Object.values(s.skillXp).filter((x) => x > 0).length >= 10 }),
  A({ id: 'bright_idea', name: 'Bright Idea', desc: 'Use your first lightbulb.', icon: 'hint', cat: 'learn', tier: 'bronze', check: (s) => (s.stats.bulbsUsed ?? 0) >= 1 }),
  A({ id: 'second_wind', name: 'Second Wind', desc: 'Burn a torch to try again.', icon: 'flame', cat: 'learn', tier: 'bronze', check: (s) => (s.stats.torchesUsed ?? 0) >= 1 }),
  A({ id: 'potion1', name: 'Bottoms Up', desc: 'Drink a potion to get a heart back.', icon: 'heart', cat: 'learn', tier: 'bronze', check: (s) => (s.stats.potionsUsed ?? 0) >= 1 }),
  // ---- coding ----
  A({ id: 'challenge1', name: 'First Spell', desc: 'Solve your first coding challenge.', icon: 'wand', cat: 'code', tier: 'bronze', check: (s) => s.stats.challenges >= 1 }),
  A({ id: 'challenge10', name: 'Spell Apprentice', desc: 'Solve 10 coding challenges.', icon: 'wand', cat: 'code', tier: 'silver', check: (s) => s.stats.challenges >= 10 }),
  A({ id: 'challenge25', name: 'Spellslinger', desc: 'Solve 25 coding challenges.', icon: 'bolt', cat: 'code', tier: 'silver', check: (s) => s.stats.challenges >= 25 }),
  A({ id: 'challenge60', name: 'Archmage of Code', desc: 'Solve 60 coding challenges.', icon: 'bolt2', cat: 'code', tier: 'gold', check: (s) => s.stats.challenges >= 60 }),
  A({ id: 'project1', name: 'Giant Slayer', desc: 'Finish your first project.', icon: 'dragon', cat: 'code', tier: 'silver', check: (s) => s.stats.projects >= 1 }),
  A({ id: 'project5', name: 'Builder', desc: 'Finish 5 projects.', icon: 'hammer', cat: 'code', tier: 'gold', check: (s) => s.stats.projects >= 5 }),
  A({ id: 'first_error', name: 'Everyone Starts Somewhere', desc: 'Meet your first error. Every master has seen thousands.', icon: 'skull', cat: 'code', tier: 'bronze', check: (s) => s.stats.errors >= 1 }),
  A({ id: 'errors50', name: 'Thick Skin', desc: 'See 50 errors and keep going.', icon: 'shield', cat: 'code', tier: 'silver', check: (s) => s.stats.errors >= 50 }),
  A({ id: 'runs100', name: 'Run, Run, Run', desc: 'Run your code 100 times.', icon: 'play', cat: 'code', tier: 'silver', check: (s) => s.stats.runs >= 100 }),
  A({ id: 'goblin_slayer', name: 'Goblin Slayer', desc: 'Defeat 10 goblins on the hero map.', icon: 'goblin', cat: 'code', tier: 'silver', check: (s) => s.stats.goblins >= 10 }),
  A({ id: 'gem_hoarder', name: 'Gem Hoarder', desc: 'Collect 50 gems on the hero map.', icon: 'gem', cat: 'code', tier: 'silver', check: (s) => s.stats.gems >= 50 }),
  A({ id: 'html_done', name: 'Tag Master', desc: 'Finish the HTML section.', icon: 'code', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'html') }),
  A({ id: 'css_done', name: 'Style Sorcerer', desc: 'Finish the CSS section.', icon: 'code', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'css') }),
  A({ id: 'js_done', name: 'Script Knight', desc: 'Finish the JavaScript section.', icon: 'code', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'js') }),
  A({ id: 'python_done', name: 'Snake Charmer', desc: 'Finish the Python section.', icon: 'code', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'python') }),
  A({ id: 'php_done', name: 'Elephant Rider', desc: 'Finish the PHP section.', icon: 'code', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'php') }),
  A({ id: 'sql_done', name: 'Keeper of Records', desc: 'Finish the SQL section.', icon: 'database', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'sql') }),
  A({ id: 'algo_done', name: 'Algorithm Alchemist', desc: 'Finish the Algorithms section.', icon: 'loop', cat: 'code', tier: 'gold', check: (s) => courseDone(s, 'algo') }),
  A({ id: 'sections3', name: 'Triple Crown', desc: 'Finish 3 whole sections.', icon: 'trophy', cat: 'code', tier: 'gold', check: (s) => coursesDone(s) >= 3 }),
  A({ id: 'sections8', name: 'Grand Master', desc: 'Finish 8 whole sections.', icon: 'crown', cat: 'code', tier: 'legend', check: (s) => coursesDone(s) >= 8 }),
  // ---- streaks ----
  A({ id: 'streak3', name: 'Kindled', desc: 'Keep a 3-day streak.', icon: 'flame', cat: 'streak', tier: 'bronze', check: (s) => s.streak.best >= 3 }),
  A({ id: 'streak7', name: 'Week of Fire', desc: 'Keep a 7-day streak.', icon: 'flame', cat: 'streak', tier: 'silver', check: (s) => s.streak.best >= 7 }),
  A({ id: 'streak14', name: 'Fortnight Flame', desc: 'Keep a 14-day streak.', icon: 'flame', cat: 'streak', tier: 'silver', check: (s) => s.streak.best >= 14 }),
  A({ id: 'streak30', name: 'Eternal Flame', desc: 'Keep a 30-day streak.', icon: 'flame', cat: 'streak', tier: 'gold', check: (s) => s.streak.best >= 30 }),
  A({ id: 'streak100', name: 'The Hundred Days', desc: 'Keep a 100-day streak.', icon: 'sun', cat: 'streak', tier: 'legend', check: (s) => s.streak.best >= 100 }),
  A({ id: 'freeze', name: 'Ice Mage', desc: 'Own a streak freeze.', icon: 'snow', cat: 'streak', tier: 'bronze', check: (s) => s.streak.freezes >= 1 }),
  A({ id: 'days7', name: 'Regular', desc: 'Play on 7 different days.', icon: 'sun', cat: 'streak', tier: 'bronze', check: (s) => s.stats.daysActive >= 7 }),
  A({ id: 'days30', name: 'Local Legend', desc: 'Play on 30 different days.', icon: 'sun', cat: 'streak', tier: 'silver', check: (s) => s.stats.daysActive >= 30 }),
  A({ id: 'days100', name: 'Pillar of the Village', desc: 'Play on 100 different days.', icon: 'castle', cat: 'streak', tier: 'gold', check: (s) => s.stats.daysActive >= 100 }),
  A({ id: 'goal_done', name: 'Goal Getter', desc: 'Reach your daily goal.', icon: 'target', cat: 'streak', tier: 'bronze', check: (s) => Object.values(s.xpByDay).some((x) => x >= s.dailyGoal) }),
  A({ id: 'comeback', name: 'The Return', desc: 'Come back after a long break and clean up the village.', icon: 'reset', cat: 'streak', tier: 'silver', check: (s) => s.stats.comebacks >= 1 }),
  A({ id: 'quest_taker', name: 'Quest Taker', desc: 'Finish 5 daily quests.', icon: 'board', cat: 'streak', tier: 'bronze', check: (s) => s.stats.questsDone >= 5 }),
  A({ id: 'quest_master', name: 'Quest Master', desc: 'Finish 30 daily quests.', icon: 'board', cat: 'streak', tier: 'silver', check: (s) => s.stats.questsDone >= 30 }),
  A({ id: 'quest_legend', name: 'Hero of the Guild', desc: 'Finish 100 daily quests.', icon: 'banner', cat: 'streak', tier: 'gold', check: (s) => s.stats.questsDone >= 100 }),
  // ---- your hero ----
  A({ id: 'level5', name: 'Squire', desc: 'Reach level 5.', icon: 'helm', cat: 'hero', tier: 'bronze', check: (s) => levelFromXp(s.xp).level >= 5 }),
  A({ id: 'level10', name: 'Knight', desc: 'Reach level 10.', icon: 'helm', cat: 'hero', tier: 'silver', check: (s) => levelFromXp(s.xp).level >= 10 }),
  A({ id: 'level15', name: 'Knighted', desc: 'Reach level 15.', icon: 'crown', cat: 'hero', tier: 'silver', check: (s) => levelFromXp(s.xp).level >= 15 }),
  A({ id: 'level25', name: 'Legend of Codehaven', desc: 'Reach level 25.', icon: 'crown', cat: 'hero', tier: 'gold', check: (s) => levelFromXp(s.xp).level >= 25 }),
  A({ id: 'level40', name: 'Myth', desc: 'Reach level 40.', icon: 'crown', cat: 'hero', tier: 'legend', check: (s) => levelFromXp(s.xp).level >= 40 }),
  A({ id: 'treasury', name: 'Royal Treasury', desc: 'Hold 500 gold at once.', icon: 'coin', cat: 'hero', tier: 'silver', check: (s) => s.gold >= 500 }),
  A({ id: 'treasury2', name: 'Dragon Hoard', desc: 'Hold 2000 gold at once.', icon: 'coin', cat: 'hero', tier: 'gold', check: (s) => s.gold >= 2000 }),
  A({ id: 'satchel', name: 'Well Prepared', desc: 'Carry 10 lightbulbs.', icon: 'hint', cat: 'hero', tier: 'silver', check: (s) => (s.items.bulb ?? 0) >= 10 }),
  A({ id: 'fashion', name: 'Fashionable', desc: 'Change your tunic colour.', icon: 'helm', cat: 'hero', tier: 'bronze' }),
  // ---- minigames ----
  A({ id: 'first_star', name: 'Tavern Regular', desc: 'Win your first minigame star.', icon: 'star', cat: 'games', tier: 'bronze', check: (s) => stars(s) >= 1 }),
  A({ id: 'stars15', name: 'Star Collector', desc: 'Win 15 minigame stars.', icon: 'trophy', cat: 'games', tier: 'silver', check: (s) => stars(s) >= 15 }),
  A({ id: 'stars50', name: 'Constellation', desc: 'Win 50 minigame stars.', icon: 'trophy', cat: 'games', tier: 'gold', check: (s) => stars(s) >= 50 }),
  A({ id: 'games10', name: 'Game Night', desc: 'Play 10 minigames.', icon: 'rune', cat: 'games', tier: 'bronze', check: (s) => s.stats.minigames >= 10 }),
  A({ id: 'games50', name: 'Arcade Champion', desc: 'Play 50 minigames.', icon: 'rune', cat: 'games', tier: 'silver', check: (s) => s.stats.minigames >= 50 }),
  A({ id: 'sharpshooter', name: 'Sharpshooter', desc: 'Clear every target in Selector Archery.', icon: 'bow', cat: 'games', tier: 'gold', check: (s) => s.stats.archeryBest >= 12 }),
  A({ id: 'bug_hunter', name: 'Bug Hunter', desc: 'Find 8 bugs in one Bug Hunt.', icon: 'bug', cat: 'games', tier: 'silver', check: (s) => s.stats.bugHuntBest >= 8 }),
  A({ id: 'gem_combo', name: 'Jeweller', desc: 'Score 1500 points in Gem Forge.', icon: 'gem', cat: 'games', tier: 'silver', check: (s) => s.stats.gemBest >= 1500 }),
  A({ id: 'gem_master', name: 'Crown Jeweller', desc: 'Score 4000 points in Gem Forge.', icon: 'gem', cat: 'games', tier: 'gold', check: (s) => s.stats.gemBest >= 4000 }),
  A({ id: 'typist', name: 'Swift Fingers', desc: 'Type 15 words in one Rune Typist game.', icon: 'scroll', cat: 'games', tier: 'silver', check: (s) => s.stats.typingBest >= 15 }),
  A({ id: 'typist2', name: 'Keyboard Wizard', desc: 'Type 30 words in one Rune Typist game.', icon: 'bolt', cat: 'games', tier: 'gold', check: (s) => s.stats.typingBest >= 30 }),
  // ---- code farm ----
  A({ id: 'farm1', name: 'Seedling', desc: 'Finish your first field on Greenhollow Farm.', icon: 'tree', cat: 'farm', tier: 'bronze', check: (s) => Object.keys(s.farm ?? {}).length >= 1 }),
  A({ id: 'green_thumb', name: 'Green Thumb', desc: 'Finish 10 fields on Greenhollow Farm.', icon: 'tree', cat: 'farm', tier: 'silver', check: (s) => Object.keys(s.farm ?? {}).length >= 10 }),
  A({ id: 'master_farmer', name: 'Master of the Valley', desc: 'Finish all 30 fields of the Code Farm.', icon: 'crown', cat: 'farm', tier: 'gold', check: (s) => Object.keys(s.farm ?? {}).length >= 30 }),
  A({ id: 'farm_stars', name: 'Golden Harvest', desc: 'Earn all 90 stars on the Code Farm.', icon: 'star', cat: 'farm', tier: 'legend', check: (s) => farmStars(s) >= 90 }),
  // ---- homestead ----
  A({ id: 'harvest1', name: 'First Harvest', desc: 'Harvest a crop in your garden.', icon: 'tree', cat: 'home', tier: 'bronze', check: (s) => s.stats.harvests >= 1 }),
  A({ id: 'harvest50', name: 'Market Gardener', desc: 'Harvest 50 crops.', icon: 'tree', cat: 'home', tier: 'silver', check: (s) => s.stats.harvests >= 50 }),
  A({ id: 'harvest250', name: 'Breadbasket', desc: 'Harvest 250 crops.', icon: 'tree', cat: 'home', tier: 'gold', check: (s) => s.stats.harvests >= 250 }),
  A({ id: 'animal1', name: 'Old MacDonald', desc: 'Get your first farm animal.', icon: 'home', cat: 'home', tier: 'bronze', check: (s) => animals(s) >= 1 }),
  A({ id: 'animal5', name: 'Full Barn', desc: 'Keep 5 farm animals.', icon: 'home', cat: 'home', tier: 'silver', check: (s) => animals(s) >= 5 }),
  A({ id: 'dog_cat', name: 'Best Friends', desc: 'Keep both a dog and a cat.', icon: 'heart', cat: 'home', tier: 'silver', check: (s) => animals(s, 'dog') > 0 && animals(s, 'cat') > 0 }),
  A({ id: 'products25', name: 'Farm Fresh', desc: 'Collect 25 eggs, milk, wool or truffles.', icon: 'chest', cat: 'home', tier: 'silver', check: (s) => s.stats.products >= 25 }),
  A({ id: 'products150', name: 'Rancher', desc: 'Collect 150 animal products.', icon: 'chest', cat: 'home', tier: 'gold', check: (s) => s.stats.products >= 150 }),
  A({ id: 'big_garden', name: 'Land Owner', desc: 'Open all 12 garden plots.', icon: 'map', cat: 'home', tier: 'gold', check: (s) => (s.home?.size ?? 0) >= 12 }),
  // ---- pets ----
  A({ id: 'pet1', name: 'New Friend', desc: 'Hatch your first pet.', icon: 'heart', cat: 'pets', tier: 'bronze', check: (s) => (s.pets?.list.length ?? 0) >= 1 }),
  A({ id: 'pets5', name: 'Pet Parade', desc: 'Find 5 kinds of pets.', icon: 'heart', cat: 'pets', tier: 'silver', check: (s) => dexCount(s) >= 5 }),
  A({ id: 'pets10', name: 'Menagerie', desc: 'Find 10 kinds of pets.', icon: 'heart', cat: 'pets', tier: 'gold', check: (s) => dexCount(s) >= 10 }),
  A({ id: 'pets20', name: 'Pet Encyclopedia', desc: 'Find all 20 kinds of pets.', icon: 'book2', cat: 'pets', tier: 'legend', check: (s) => dexCount(s) >= 20 }),
  A({ id: 'pet_rare', name: 'Rare Find', desc: 'Hatch a rare pet.', icon: 'gem', cat: 'pets', tier: 'silver', check: (s) => hasRarity(s, 'rare') }),
  A({ id: 'pet_ultra', name: 'Legendary Bond', desc: 'Hatch an ultra rare pet.', icon: 'crown', cat: 'pets', tier: 'gold', check: (s) => hasRarity(s, 'ultra') }),
  A({ id: 'pet_shiny', name: 'Something Shiny', desc: 'Hatch a shiny pet.', icon: 'star', cat: 'pets', tier: 'gold', check: (s) => shinies(s) >= 1 }),
  A({ id: 'pet_shiny5', name: 'Sparkle Collector', desc: 'Hatch 5 shiny pets.', icon: 'star', cat: 'pets', tier: 'legend', check: (s) => shinies(s) >= 5 }),
  A({ id: 'pet_fed', name: 'Good Keeper', desc: 'Feed your pets 25 times.', icon: 'heart', cat: 'pets', tier: 'silver', check: (s) => s.stats.petsFed >= 25 }),
  A({ id: 'pet_play', name: 'Playtime', desc: 'Play with your pets 50 times.', icon: 'heart', cat: 'pets', tier: 'silver', check: (s) => s.stats.petPlays >= 50 }),
  A({ id: 'pet_level', name: 'Best Buddy', desc: 'Raise a pet to level 10.', icon: 'crown', cat: 'pets', tier: 'gold', check: (s) => maxPetLevel(s) >= 10 }),
  // ---- battles ----
  A({ id: 'battle1', name: 'First Blood... er, Goo', desc: 'Win your first battle.', icon: 'sword', cat: 'battle', tier: 'bronze', check: (s) => (s.battle?.wins ?? 0) >= 1 }),
  A({ id: 'battle25', name: 'Monster Hunter', desc: 'Win 25 battles.', icon: 'sword', cat: 'battle', tier: 'silver', check: (s) => (s.battle?.wins ?? 0) >= 25 }),
  A({ id: 'battle100', name: 'Hero of the Realm', desc: 'Win 100 battles.', icon: 'sword', cat: 'battle', tier: 'gold', check: (s) => (s.battle?.wins ?? 0) >= 100 }),
  A({ id: 'slimes20', name: 'Slime Sweeper', desc: 'Defeat 20 slimes.', icon: 'wave', cat: 'battle', tier: 'bronze', check: (s) => kills(s, 'slime') + kills(s, 'slimeBlue') >= 20 }),
  A({ id: 'boss1', name: 'Boss Breaker', desc: 'Defeat a region boss.', icon: 'skull', cat: 'battle', tier: 'silver', check: (s) => (s.stats.bossesWon ?? 0) >= 1 }),
  A({ id: 'boss_all', name: 'Warden of the Wilds', desc: 'Defeat the boss of every region.', icon: 'skull', cat: 'battle', tier: 'gold', check: (s) => Object.keys(s.battle?.cleared ?? {}).length >= 5 }),
  A({ id: 'dragon_slayer', name: 'Dragon Slayer', desc: 'Defeat the Black Dragon.', icon: 'dragon', cat: 'battle', tier: 'gold', check: (s) => kills(s, 'blackDragon') >= 1 }),
  A({ id: 'defender', name: 'Defender of Codehaven', desc: 'Chase monsters out of the village.', icon: 'shield', cat: 'battle', tier: 'silver', check: (s) => Object.entries(s.battle?.kills ?? {}).length > 0 && (s.stats.comebacks ?? 0) >= 1 }),
  // ---- career ----
  A({ id: 'trainee', name: 'Trainee', desc: 'Reach 30% of a career path.', icon: 'briefcase', cat: 'career', tier: 'silver', check: (s) => bestPath(s) >= 30 }),
  A({ id: 'halfway', name: 'Halfway There', desc: 'Reach 50% of a career path.', icon: 'briefcase', cat: 'career', tier: 'silver', check: (s) => bestPath(s) >= 50 }),
  A({ id: 'job_ready', name: 'Job Ready', desc: 'Finish a whole career path.', icon: 'briefcase', cat: 'career', tier: 'legend', check: (s) => bestPath(s) >= 100 }),
  A({ id: 'junior', name: 'Junior Developer', desc: 'Pass the Junior Trial against the Elder Dragon of Bugs.', icon: 'crown', cat: 'career', tier: 'legend', check: (s) => kills(s, 'elder') >= 1 }),
  A({ id: 'portfolio', name: 'Portfolio Piece', desc: 'Finish 3 projects you can show in interviews.', icon: 'chest', cat: 'career', tier: 'gold', check: (s) => s.stats.projects >= 3 }),
  // ---- secrets ----
  A({ id: 'ouroboros', name: 'Ouroboros', desc: 'Write a loop that never ends. (We stopped it for you.)', icon: 'loop', cat: 'secret', tier: 'bronze', secret: true, check: (s) => s.stats.timeouts >= 1 }),
  A({ id: 'off_by_one', name: 'Off By One', desc: 'Stop exactly one step before the gate. The most famous bug in history!', icon: 'one', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'splash', name: 'Swimming Lessons', desc: 'Walk your hero into the water.', icon: 'wave', cat: 'secret', tier: 'bronze', secret: true, check: (s) => s.stats.splashes >= 1 }),
  A({ id: 'night_owl', name: 'Night Owl', desc: 'Learn between midnight and 5 a.m.', icon: 'moon', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'early_bird', name: 'Early Bird', desc: 'Learn between 5 and 8 a.m.', icon: 'sun', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'fled', name: 'Tactical Retreat', desc: 'Run away from a battle. Sometimes that is wise.', icon: 'boot', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'lumi_friend', name: "Lumi's Friend", desc: 'Ask Lumi for help 10 times.', icon: 'hint', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'weekend', name: 'Weekend Warrior', desc: 'Finish a lesson on a Saturday or Sunday.', icon: 'sun', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'pet_name', name: 'What a Name!', desc: 'Give your pet a new name.', icon: 'scroll', cat: 'secret', tier: 'bronze', secret: true }),
  A({ id: 'rich_farmer', name: 'Truffle Tycoon', desc: 'Sell a truffle at the market.', icon: 'coin', cat: 'secret', tier: 'bronze', secret: true }),
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Career rank shown on your hero: from Apprentice to Junior Developer. */
export function careerRank(s: GameState): { id: string; name: string; next: string | null; pct: number } {
  const pct = Math.max(0, ...PATHS.map((p) => pathProgress(p.id, s.done).pct));
  const junior = (s.battle?.kills?.elder ?? 0) >= 1;
  if (junior) return { id: 'junior', name: 'Junior Developer', next: null, pct };
  if (pct >= 100) return { id: 'candidate', name: 'Junior Candidate', next: 'Pass the Junior Trial', pct };
  if (pct >= 30) return { id: 'trainee', name: 'Trainee', next: 'Finish your path', pct };
  if (pct >= 5) return { id: 'apprentice', name: 'Apprentice', next: 'Reach 30% of your path', pct };
  return { id: 'newcomer', name: 'Newcomer', next: 'Finish your first lessons', pct };
}
