# Realm of Code

A free pixel-art RPG that teaches programming, from the first drag-and-drop block to the
skills of a junior developer or software trainee. The whole game runs in the **Phaser 3** game
engine: every screen is a Phaser scene drawn on a canvas. You walk your hero around the village
of **Codehaven**; every building is a part of the game. Pick a career path and switch at any time
(finished lessons count on every path): Frontend (React, Vue or Svelte), Backend (Node.js, Python
or PHP, with SQL), Full-Stack, or the broad **Software Trainee → Junior Engineer** programme.

- **20 sections, 365 lessons, 1,343 exercises**: quizzes, fill-in-the-blank tiles, ordering, matching, find-the-bug, and 128 real coding challenges plus SQL and terminal challenges. New in v0.7: **Python** and **PHP** (real interpreters, Pyodide and php-wasm, run in the browser), **NoSQL** and **Algorithms** (Big-O, searching, sorting, stacks, recursion, interview method)
- **Three languages**: English, Portuguese (Brazil) and Spanish. Menus, help, achievements and all lesson content (teaching cards, questions, answers, explanations) are translated; so are the coding challenges of HTML, CSS, JavaScript, Python, PHP, APIs, testing and accessibility. The challenge instructions of Algorithms, TypeScript, Node, Tailwind, React, Vue and Svelte are still in English (86% of all strings are translated)
- **Lumi the fairy** is your guide on every screen: what the screen is for, a step-by-step guided tour that points at the real buttons, an "I'm stuck" list with advice (and buttons that do it for you) and a searchable FAQ. Dragons are now the enemies
- **Pets**: 20 kinds (8 common, 5 uncommon, 4 rare, 3 ultra rare: phoenix, unicorn, kitsune), each can hatch **shiny** (1 in 20). Eggs hatch with the XP you earn; pets follow you in the village, need food and play, and give an XP bonus when happy. A Petdex to complete
- **Your homestead**: a walkable farm where vegetables grow in real time (wheat in 3 minutes, pumpkins in an hour), and animals to care for: chickens, cows, sheep, pigs, goats, a horse, a dog and a cat. Sell what you grow at the market stall
- **PvE battles** at the Monster Gate: 5 regions with bosses, turn-based fights where **Strike** asks a question from your lessons and **Spell** makes you type a code word before the time runs out; the **Junior Trial** against the Elder Dragon of Bugs is the final exam of your path
- **9 minigames**, including **Gem Forge** (match-3 with bonus questions) and **Rune Typist** (type the word on a monster before it reaches the wall)
- **124 achievements** in 11 categories with bronze/silver/gold/legendary tiers, section trophies, and a career rank (Newcomer → Apprentice → Trainee → Junior Candidate → Junior Developer)
- **Duolingo-style habits**: streaks and freezes, daily goal and quests, a raven inbox, optional **browser notifications** (a daily reminder at the time you choose, streak-in-danger and hungry-pet alerts). Stay away and the realm changes: weeds grow, crops wither, pets get sad, bug monsters wander into the village and the sky turns grey. One lesson cleans it all up and gives a comeback gift
- **Developer mode** (Settings, `?debug`, or the `` ` `` key): a panel to change XP, gold and items, finish lessons or paths, unlock achievements, **travel in time** (to test absence, crops, hunger), hatch or spawn pets (shiny too), grow crops, spawn invaders, test notifications and jump to any screen, plus an overlay of the UI ids used by the test bots
- **Code Farm**: 30 farming puzzles, from **drag-and-drop blocks** (Blockly) to blocks with the JavaScript they make, to typed JavaScript
- **An adaptive path**: a hard lesson adds a review stop, struggling players get warm-ups and refresher cards, strong players get express lessons and shortcuts
- Controls: **WASD or arrow keys** to walk, **Space** (or Enter) to act (enter a door, plant, water, harvest, feed, fight a monster), or just click/tap. Works on phones
- Medieval pixel-art look, all art drawn in code. Everything runs in the browser (no server): JavaScript, TypeScript, React, Vue, Svelte, Tailwind, Python, PHP, SQLite, a mini Express, a test runner and a simulated terminal with Git

See [PLAN.md](PLAN.md) for the full design.

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:5180
```

`npm run build` creates a static site in `dist/` (it can be hosted anywhere, no server needed).
`npm run preview` serves the build on http://127.0.0.1:5181.

## Tests

```bash
npx playwright install chromium   # once, for the end-to-end tests

npm test                 # type check + translation check + 86 unit tests (Vitest, ~5 s)
npm run test:e2e         # production build + every end-to-end bot in headless Chromium (about 30 minutes)
npm run test:e2e:quick   # build + a shorter end-to-end run (a sample of lessons, quizzes and games)
npm run test:all         # npm test, then npm run test:e2e
```

- **Unit tests** (`tests/unit/*.test.ts`, Vitest in Node): XP, levels, quests and items; the saved state
  (lesson rewards, streaks over several days, freezes, hearts, potions, minigame stars, quests, inbox,
  the save itself); pets, the homestead, battles and the absence system (moving the game clock);
  achievements and the career rank; content integrity (ids, answers, blanks, paths); every terminal,
  SQL and hero-map challenge solved in Node (the solution wins, the starter does not); every Code Farm
  level; minigame data; runner helpers; translations (keys, coverage, placeholders, runtime).
  `npm run test:watch` re-runs them while you edit.
- **End-to-end tests** (`tests/e2e.cjs` runs the bots in the table below, one after the other, on a
  preview server at port 5199, and prints PASS/FAIL per suite; logs go to `tests/e2e-logs/`). Options:
  `node tests/e2e.cjs --url http://127.0.0.1:5181/` (use a server that is already running, no build),
  `--only world,life`, `--skip lessons,quizzes`, `--quick`. Suite ids: `lessons`, `quizzes`, `challenges`,
  `world`, `adaptive`, `farm`, `games`, `life`, `i18n`, `screens`, `phone`.

[PROMPT.md](PROMPT.md) is a single prompt that describes the whole game, for rebuilding it from scratch
with an AI coding agent.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (it also builds the framework runtimes into `public/vendor/` first) |
| `npm run build` | Type-check and make the production build |
| `npm run verify-lessons` | Checks **all content** in headless Chromium: exercise structure, "what does this print" answers (run for real), coding/SQL/terminal challenges (solution passes, starter does not). Start `npm run preview` first. One section only: `node tests/verify-lessons.cjs css` |
| `node tests/answer-bot.cjs <url> all-quiz` | A bot plays every quiz lesson through the real game UI (mouse clicks on the canvas) with correct answers and expects 100% |
| `npm run verify-farm` | Checks every Code Farm level in Node: the solution earns 3 stars and an empty program fails |
| `node tests/farm-bot.cjs <url>` | Drags real blocks to solve level 1, then plays all 30 farm levels through the UI (solution into Blockly or the editor, Run, expect 3 stars) |
| `node tests/world-bot.cjs <url>` | Walks the village with the arrow keys, enters the Academy with Enter, closes with Escape, clicks a building to walk there, uses the travel bar, opens Lumi's help, follows the welcome tour |
| `node tests/game-bot.cjs <url>` | Plays all 9 minigames to the end with perfect answers (expects 3 stars), then a minigame stop on the path (expects the item rewards) |
| `node tests/life-bot.cjs <url>` | The v0.7 systems: hatches and cares for pets, plants/waters/harvests and feeds animals on the homestead with the keyboard, wins a battle (Strike and Spell), the absence check (time travel → welcome back, invaders, decay, clean-up), the inbox, achievements, and developer mode |
| `node tests/i18n-bot.cjs [pt\|es\|both] <url> [--lessons]` | Visits every screen in Portuguese and Spanish and lists text drawn without a translation |
| `node tests/adaptive-bot.cjs <url>` | Checks the adaptive path (refresher cards, review stops that block the next lesson, shortcuts, express lessons, warm-ups) and that Lumi offers help after the same question is missed twice |
| `node tests/challenge-bot.cjs <url> <id>...` | Solves coding challenges through the UI: two failed runs, "Show solution", run again |
| `node tests/screenshots.cjs <url>` | Plays like a brand-new player (title, hero creation, welcome tour, first lesson, help panel, every building, a minigame, a farm field) and saves screenshots to `tests/shots/`. `W=390 H=844` for a phone |
| `npm run i18n` | Compiles the translations in `i18n/` into `src/i18n/gen/*.json`, checks them (same placeholders, code and code blocks as the English) and prints the coverage per section. `npm run i18n:extract` refreshes the catalogue of English strings |
| `npm run export-assets` | Exports the code-made art and sound to `public/assets/` (PNG sprites, a sprite sheet, WAV sound effects, the music loop) |

You can also open `#/dev/verify` to watch the verifier run, or `#/dev/ex/<lessonId>/<index>` to preview one exercise.

**How the tests see a canvas game:** every button, card and area is registered in a small UI registry
(`src/ui/widgets.ts`, `UI.reg`) with an id and a label. `window.__ui` lists them with their page rectangles,
so the bots (`tests/lib.cjs`) find "lesson.check" or "opt.2" and click it with the real mouse. The same ids are
what Lumi's guided tours point at.

## Project layout

```
src/
  main.ts               Starts Phaser (canvas + DOM container), loads the fonts, routes #/addresses to scenes
  game/director.ts      Address -> scene: the village and HUD stay alive under building windows;
                        lessons, minigames and farm levels are full-screen scenes
  game/store.ts         Saved state (zustand, localStorage): XP, hearts, streak, quests, achievements, items, tours,
                        pets, homestead, battles, inbox, settings
  game/achievements.ts  124 achievements, tiers and the career rank
  game/pets.ts, petData.ts, home.ts, battle.ts   Pets and eggs, the homestead (crops and animals), monsters and regions
  game/away.ts          Absence: welcome-back report, decay, invaders, notifications and the service worker reminders
  game/clock.ts         The game clock (developer mode can move it forward)
  i18n/                 t() / tr(): translation at the drawing points (Phaser Text, rich text, inputs);
                        gen/*.json are compiled from the translation files in /i18n
  scenes/               Every screen, as a Phaser scene
    base.ts             UIScene (rebuilds on resize) and WindowScene (building windows over the village)
    Title, Create, Hud, Toasts, Verify
    windows/            Academy (the path map), Tavern + Farm, Guild, Library, Trophies, Cottage, Settings, Path Board
    lesson/             Lesson (session logic), quiz.ts (all quick exercise types), code.ts (coding / SQL / terminal)
    games/              Minigame (intro, items, results), builders.ts (7 games), newgames.ts (Gem Forge, Rune Typist)
    home/               Homestead (the walkable farm) and HomeHud (plots, animals, market, basket)
    battle/Battle.ts    Turn-based battles (Strike = question, Spell = typing, Defend, Potion)
    windows/Pets.ts, Gate.ts, Inbox.ts   Pet Sanctuary, Monster Gate, raven inbox and the welcome-back letter
    dev/Debug.ts        Developer mode panel and the DEV badge
    farm/FarmLevel.ts   A Code Farm field: Bess, the Phaser farm, Blockly or the code editor, goals, stars
    help/               Lumi's help: content.ts (screen help, tours, "I'm stuck" tips, FAQ), HelpPanel,
                        Tour (guided tours), Coach (first-visit and "stuck?" pop-ups), HelpWindow (FAQ page)
  ui/                   The widget kit drawn by Phaser: buttons, cards, bubbles, scroll views, modals, pixel
                        frames, markdown-to-texture text (rich.ts), the CodeMirror editor (codeEditor.ts)
  world/                The village (WorldScene) and its building art
  farm/                 Code Farm: sim.ts (rules, runs in the code worker), levels.ts (30 levels),
                        program.ts (block programs -> JS / Blockly JSON), blocks.ts (Blockly blocks), FarmScene.ts
  course/               Content: 9 paths, 20 sections (courses/*.ts), the DSL, the adaptive path
  content/lessons/*.ts  Coding challenges (editor + preview / hero map / console)
  lesson/adapt.ts       Warm-ups, express lessons, refreshers
  games/                Minigame rules and question pools (data.ts, select.ts, pools.ts)
  runners/              Code runners: JS worker, TypeScript, Python (Pyodide) and PHP (php-wasm) in poly.worker.ts, web preview (JSX/Vue/Svelte/Tailwind),
                        SQLite (sql.js), shell + mini Git, mini Express, test runner, mock fetch API
  grid/                 The hero map used by JavaScript challenges
  pixel/                Pixel art made in code (sprites, NPCs, icons, painted map chunks, palette)
  engine/textures.ts    Turns the code-made pixel art into Phaser textures
  audio/                Synthesized sound effects and music
  styles/game.css       Page styles for the few DOM pieces inside the game (inputs, editors, Blockly)
tests/                  Bots (see above), lib.cjs (helpers to drive the canvas UI), e2e.cjs (runs them all)
tests/unit/             Unit tests (Vitest)
i18n/                   Translations: en/ is the catalogue of English strings (generated), pt-es/ holds the
                        Portuguese and Spanish translations (see "Translating" below)
scripts/i18n.cjs        Extracts the English strings from the code and compiles the translations
public/sw.js            Service worker for reminder notifications (and the web app manifest)
```

The only DOM elements on screen are the ones a canvas cannot do well: text inputs, the CodeMirror
editors, Blockly, web-page previews (iframes) and the terminal. Phaser places them inside its scenes.

## Art and fonts

All pixel art is drawn from character grids in TypeScript, so there are no image files to keep in sync.
To swap in your own art, run `npm run export-assets`, edit the PNGs in `public/assets/sprites/`, and
point `spriteTex()` in `src/engine/textures.ts` (and `spriteUrl()` in `src/components/spriteUrl.ts`) at those files instead of the generated ones.
Fonts come from `@fontsource` (all OFL licensed). Players who find the pixel code font hard to read can
turn on **Settings → Classic code font**.

## Adding content

Lessons are data. Add a lesson to a unit in `src/course/courses/<section>.ts`:

```ts
lesson('css-9-1', 'My new lesson', [
  teach('Title', 'Explanation in **mini-markdown**', 'h1 { color: red; }', 'css'),
  mc('Question?', ['Right', 'Wrong', 'Also wrong'], 0, 'Shown after answering'),
  out('console.log(1 + 1);', ['2', '11'], 0),            // answer verified by running it
  fill('Fill the blanks', 'h1 { ___: red; }', ['color'], ['colour', 'font'], undefined, 'css'),
  order('Put in order', ['first line', 'second line'], undefined, 'js'),
  match('Match', [['a', '1'], ['b', '2']]),
  bug('Which line is wrong?', 'line 1\nline 2', 2, 'Because...'),
]),
challenge('css-01'),   // a coding challenge from src/content/lessons
```

Then run the verifier.

### Adding a Code Farm level

Levels live in `src/farm/levels.ts`. A level is a map (one character per tile), the tools
(blocks or commands) the player may use, goals, a par for the third star, and a solution:

```ts
{
  id: 'f31', n: 31, chapter: 5, title: 'Pumpkin Patch', mode: 'blocks',   // or 'hybrid' / 'code'
  story: 'What Farmer Bess says.',
  farm: { rows: ['......=', '======='], start: [0, 0] },   // . soil  , grass  = path  0-3 wheat stages ...
  tools: ['move', 'plant', 'repeat'],
  goals: [allPlanted('pumpkin')],
  par: 3,
  solution: [['repeat', 6, [['plant', 'pumpkin'], ['move', 'right']]]],   // blocks; code levels use a string
  hints: ['...'],
}
```

Then run `npm run verify-farm`: it proves the solution earns 3 stars and an empty program fails.

### Adding help for a screen

Everything Lumi says lives in `src/scenes/help/content.ts`. Each screen has an entry in `SCREEN_HELP`:
what the screen is for, the steps of its guided tour (each step points at a UI id, for example
`{ target: 'lesson.check', title: 'Check', text: '...' }`), the "I'm stuck" tips (an optional action
presses a button for the player) and the FAQ entries to show first. Steps whose button is not on screen
are skipped, so one tour can cover several states of a screen.

### Translating

The code is written in English; nothing has to be wrapped for translation. The game translates at
the places where text is drawn (every Phaser `Text`, every rich-text texture, input placeholders), so
menus, data (achievements, pets, items) and lesson content are all covered. Text drawn in the code
font is never translated (it is code).

1. `npm run i18n:extract` scans `src/` with the TypeScript compiler and writes every piece of English text
   to `i18n/en/<group>.txt` (groups: `ui`, `help`, `achievements`, `data`, `farm`, `course-<section>`,
   `code-<section>`...). Each entry has a key: a hash of the English text.
2. Add translations in `i18n/pt-es/`: either `key ¦ Portuguese ¦ Spanish` lines in a `.tsv` file, or
   `@@ key` blocks with the Portuguese text, a `~~` line and the Spanish text in a `.txt` file (for text
   with several lines). In a block, `[[1]]`, `[[2]]`... stand for the English text's code blocks.
   `node scripts/i18n.cjs todo <group>` prints what is still missing.
3. `npm run i18n` compiles and checks them. Template strings (`` `${n} lessons done` ``) become patterns
   (`{0} lessons done`); `t('{n} gold', { n })` and `tn(n, one, many)` are for new UI text with values.

A new language needs an entry in `LANGS` (`src/i18n/index.ts`), a dictionary import in `setLang`, and a
column in the translation files.

### Developer mode

Turn it on in **Settings → Developer mode**, or open the game with `?debug`. A **DEV** button appears (or
press the `` ` `` key): tabs for the player, progress, time travel, pets, homestead, battles, notifications,
a list of every screen, and tools (UI id overlay, copy the save, erase). Changes go into the real save:
back it up first (Settings → Back up my progress).
