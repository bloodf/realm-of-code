# One prompt to rebuild Realm of Code (v0.7)

Give everything below the line, as it is, to an AI coding agent that can run shell commands and a
headless browser. It describes the finished game (v0.7). This project was first built over several
rounds of requests (v0.1 → v0.7); the prompt asks for the final result in one go, in the same
order that worked here: foundations first, then content, then the living-world systems, then
translations, then tests.

---

## The prompt

Build **Realm of Code**, a free pixel-art RPG that teaches programming, from a child's first
drag-and-drop block to the skills of a junior developer or software trainee. It must run entirely
in the browser as a static site (no server, no accounts). Work in a new folder named `realm-of-code`.
Build a real, complete game with working content, not a mock-up. Test it with the bots described
at the end, and fix everything they find.

### 1. Stack and architecture

- Vite + TypeScript (strict) + **Phaser 3**. **Every screen is a Phaser scene** drawn on one canvas:
  title, hero creation, village, building windows, lessons, minigames, results, help. Don't use React or
  HTML pages for the UI. The only DOM elements are the ones a canvas can't do well: text inputs,
  CodeMirror 6 editors, Blockly, sandboxed preview iframes and a terminal. Phaser places them inside
  scenes (Phaser's DOM container).
- State: a **zustand vanilla store** with `persist`, saved in `localStorage` under
  `realm-of-code-save` (versioned, with a `migrate` and a `merge` that fills new fields in old saves).
  It holds the profile, path, XP, gold, hearts, lesson progress, mistakes, drafts, achievements,
  trophies, stats, streak, daily quests, settings, items, minigame records, review stops, tours,
  the inbox, pets, homestead, battles, developer mode and decay.
- A **game clock** (`now()` = `Date.now()` + an offset). Every time-based system reads it, so
  developer mode can move time forward.
- Hash routes (`#/learn`, `#/lesson/<id>`, `#/dev/verify`…) mapped to scenes by a director. The village
  and the HUD stay alive under building windows. Lessons, minigames and farm levels are full-screen scenes.
- A **widget kit drawn by Phaser**: 9-slice pixel frames, buttons, cards, speech bubbles, scroll
  views, modals, and markdown rendered to textures with code highlighting. **Every interactive
  widget registers in a UI registry** with an id and a label (`window.__ui` lists them with their page
  rectangles). Guided tours point at these ids, and the test bots click them with the real mouse.
  Also expose `window.__store`, `window.__game`, `window.__realmDebug` (node ids, exercise lookup,
  helpers) and `window.__i18n.missing()`.
- **All art is drawn in code**: pixel sprites from character grids (heroes with idle/walk/cheer
  animations, 20 NPC teachers that blink and talk, Lumi the fairy, monsters, pets with shiny palette
  swaps, crops, animals, buildings, 12×12 icons, UI frames), turned into Phaser textures at start-up.
  Add a script that exports them to PNGs. Sound effects and a music loop are synthesized in code.
  Fonts come from @fontsource: Jersey 15 (text), Jacquard 12 (titles), VT323 (code), with a "classic code
  font" setting that switches to JetBrains Mono.
- Performance: bake static ground tiles into one RenderTexture. Use the Canvas renderer when WebGL
  is software-emulated (SwiftShader), with `?webgl` to force WebGL. Drop to 8 fps when the tab is
  hidden or idle for 45 s (not under `navigator.webdriver`).
- Must work on phones (390 px wide): one-column lessons, a stacked feedback bar, coding challenges as
  Task / Code / Result tabs, a bottom navigation bar, touch-friendly minigames.

### 2. The world: the village of Codehaven

A tile map with a plaza, roads, a pond, a forest border, fields, torches, chimney smoke, birds and NPCs at
every door. The hero walks with **WASD or the arrow keys**. **Space or Enter** acts (enter a door, talk,
plant, water, harvest, feed, fight). Tap or click to walk there (path finding). Walking through a door
opens the building as a window over the dimmed, paused village:

| Building | Opens |
|---|---|
| The Academy (castle) | the lesson path of the chosen career path |
| Greenhollow Farm (barn) | the Code Farm |
| The Tavern | practice, all 9 minigames, a merchant |
| Guild Hall | daily quests and streak |
| Library Tower | skills and job readiness |
| Hall of Trophies | trophies, achievements, career rank |
| Your Cottage | your hero and stats |
| Path Board | choose or switch the career path |
| Pet Sanctuary | pets, eggs, Petdex |
| Your Homestead | a walkable farm with crops and animals |
| Monster Gate | PvE battles |

A HUD shows the portrait, level/XP, daily goal, gold, hearts, streak, items and the inbox. A hotbar
jumps to any building.

### 3. Learning content (Duolingo-style)

**Path → Sections (courses) → Units → Lessons → Exercises.** Lessons are short (5–10 exercises, 3–5
minutes) and show one exercise at a time with immediate feedback. Write the content as typed data
with a small DSL (`teach`, `mc`, `out`, `fill`, `order`, `match`, `type`, `bug`, `challenge`, `sql`, `term`).

- **20 sections, about 365 lessons, about 1,340 exercises**, including about 128 real coding challenges
  plus SQL and terminal challenges: Web Foundations, HTML, CSS, JavaScript (hero-map levels for the
  first loops and functions), Developer Workshop (a simulated terminal with `cd/ls/mkdir` and a mini
  Git: init/add/commit/branch/merge, plus npm, PRs, code review, debugging), APIs & HTTP (fetch
  against a mock REST API), TypeScript (real compiler), Tailwind (v4, live), React, Vue, Svelte,
  Node.js (a mini Express), **Python** (real Python via Pyodide), **PHP** (real PHP 8 via php-wasm),
  SQL (real SQLite via sql.js), **NoSQL** (documents, MongoDB queries, indexes, Redis), **Algorithms**
  (Big-O, hash maps, binary search, sorting, stacks and queues, recursion, the interview method),
  Testing (a Vitest-style runner, TDD, regression tests), Quality (accessibility, performance,
  security), Getting Hired (portfolio, CV, interviews, agile teams).
- **9 switchable career paths** (progress belongs to each lesson, so shared sections keep it):
  Frontend with React / Vue / Svelte, Backend with Node.js / Python / PHP (all with SQL), Full-Stack,
  **Software Trainee → Junior Engineer** (broad: web, JS, Workshop, Python, SQL, APIs, Algorithms,
  Testing, Quality, Career), and "Not sure yet". Onboarding asks for the path, experience level,
  daily goal, lesson style and the hero (knight, mage or ranger, tunic colour).
- Exercise types: teach card, multiple choice, "what does this print?" (answers verified by running
  the code), tap-tiles fill-in-the-blank, order the lines, match pairs (tap pairs or drag ropes), type
  the answer, find the bug, coding challenge (editor + live preview / hero map / console, with
  objectives, hints, the solution after two failed runs, starter code that fails), SQL challenge,
  terminal challenge. After checking, each piece turns green or red.
- Coding runners in Web Workers with infinite-loop protection. Previews are sandboxed and get their own
  `localStorage`, so lesson code can never touch the save. A friendly "Oracle" explains errors in
  plain words (JS, TS, Python, PHP).
- **Adaptive path**: pace from recent first-try accuracy (struggling / steady / strong). A lesson under
  75 % adds a review stop that blocks new lessons until done. Two misses in a row bring back the teach
  card and make the next lightbulb free. Warm-ups for struggling players, express lessons and shortcut
  tests for strong ones. "Jump here" tests let experienced learners skip units. One optional minigame stop
  per unit, using only what was taught.
- Sage's notes (real-job details) for adults and a relaxed mode (no hearts) for kids.
- An in-app verifier at `#/dev/verify`: checks every exercise's structure, runs every "what does this
  print?" answer, and proves every coding/SQL/terminal solution passes and every starter fails.
- **Code Farm**: 30 levels in 5 chapters where a program drives Farmer Bess on a grid farm:
  drag-and-drop Blockly blocks → blocks alongside the JavaScript they make → typed JavaScript. Commands
  include `move`, `till`, `plant`, `water`, `sleep`, `harvest`, `pullWeed`, `refill` and `nextRow`, plus
  sensors. There are goals, a par for the third star, and the running block lights up.

### 4. Game systems

- **Hearts** (5): a wrong answer costs one, one comes back every 20 minutes, or refill them with gold.
  Wrong answers come back at the end of the lesson.
- **XP and levels** (each level needs 50 × level XP), titles, skill levels per section with freshness
  bars, and a job-readiness checklist.
- **Streak** with up to 2 streak freezes (100 gold each), a daily goal (10/20/30/50 XP), and 3 daily quests
  picked from the date.
- **Items**: Lightbulb (a hint), Torch (retry without losing a heart), Potion (+1 heart). Won in minigames or
  bought from the merchant.
- **124 achievements** in 11 categories (learning, coding, streaks, hero, minigames, Code Farm,
  homestead, pets, battles, career, secrets) with bronze/silver/gold/legendary tiers that pay gold,
  some secret. There's a trophy per finished section and a legendary trophy per finished path, plus a
  **career rank**: Newcomer → Apprentice → Trainee → Junior Candidate → Junior Developer (the last one
  means winning the Junior Trial).
- **9 minigames**: Rune Link (link terms to meanings), Memory Crypt, Torch Run (quick questions),
  Bug Hunt, Selector Archery (CSS selectors), Archive Hunt (tap the rows a SQL query returns), Loop
  Bridge (count loop iterations, checked by running them), **Gem Forge** (match-3 with bonus
  questions for time, capped) and **Rune Typist** (type the word on each monster before it reaches the
  wall; the time bonus shrinks and is capped, so every run ends). Timers must keep real time even
  when the screen redraws. Stars give items once per star.
- **Pets**: 20 species (8 common, 5 uncommon, 4 rare, **3 ultra rare**: phoenix, unicorn, kitsune). Each
  one hatches **normal or shiny** (1 in 20). Eggs come from Lumi (a starter egg), bosses, quests and an
  egg shop (ultra eggs can't be bought) and hatch as you earn XP. Pets have food and joy that drop over
  time, favourite foods, levels, a name and a Petdex. The active pet follows the hero and gives an XP
  bonus by rarity when it is happy.
- **Homestead**: a walkable farm (WASD/arrows, Space). 8 crops grow in real time (wheat 3 min → pumpkin
  60 min), three times slower when dry. Ripe crops wither after 30 h, and empty plots get weeds after
  10 h. There are up to 12 plots and 8 animals (chicken, cow, sheep, pig, goat, horse, dog, cat) with
  food, joy and products. The horse makes you faster, the dog slows weeds and the cat keeps crops
  fresh. Sell at a market stall. Everything is computed from timestamps, so it keeps growing while
  the game is closed.
- **PvE battles** at the Monster Gate: 5 regions (Slime Meadow, Bat Caves, Haunted Woods, Golem
  Quarry, Dragon's Peak) that open with lessons, 17 monsters and region bosses. Turn-based: **Strike**
  asks a question from your finished lessons (combos for streaks), **Spell** makes you type a code word
  before the bar empties, and there's also **Defend**, **Potion** and run away. Rewards are XP, gold,
  items and eggs (a first boss win always drops one). **Dragons are enemies.** The **Junior Trial**
  against the Elder Dragon of Bugs is the final exam of a path.
- **Duolingo-style habits**: a raven **inbox** (letters from Lumi) and optional **browser
  notifications** through a service worker: a daily reminder at a chosen hour, streak in danger, hungry
  pet, ripe crops.
- **Being away changes the realm**: after 20 h or more, a welcome-back letter lists what happened
  (streak lost, hungry pets, ripe or withered crops, weeds). After 2+ days, the village decays (weeds,
  mushrooms, a grey sky, rain), and bug monsters wander into the village (walk into them or press Space
  to fight). Lessons and beaten invaders clean it up, and a clean village pays a comeback bonus.

### 5. Lumi the fairy (help on every screen)

Lumi is the helper (not a dragon). A fairy button on every screen opens a help panel with three tabs:
- **This screen**: what the screen is for, plus **Show me step by step** (a guided tour that dims the
  screen except for a real button, with an arrow and a bubble; Back/Next/Skip, arrow keys, Esc; steps
  whose button isn't on screen are skipped).
- **I'm stuck**: common problems, each with advice and often a button that does it for you (use a
  lightbulb, show a hint, reset the code, show the solution).
- **Questions**: a searchable FAQ of about 40 entries in 7 topics.

New players get a 9-step welcome tour, and every screen offers its own tour once. If the player is idle
45 s on a question, or misses the same thing twice, Lumi peeks out to offer help. Help works before a
hero exists, and the game pauses while it is open. All help text is data in one file.

### 6. Developer mode

Turn it on in Settings, with `?debug`, or with the `` ` `` key. A DEV panel can change XP, gold,
hearts and items, finish lessons, sections or paths, unlock achievements, **travel in time** (to test
absence, crops and hunger), hatch or spawn any pet (shiny too), grow crops, make animals ready, spawn
invaders, send test notifications, jump to any screen, copy or erase the save, and show an overlay of
the UI ids.

### 7. Three languages: English, Portuguese (Brazil), Spanish

Write all text in English in the code and **translate where text is drawn**: patch Phaser
`Text.setText` (skip the code font), the markdown-to-texture renderer and input placeholders.
- `t('…{n}…', vars)` for UI strings with placeholders, `tn(n, one, many)` for plurals, `up()` for
  capitals, `untranslated(fn)` for code and names.
- Translation keys are a 53-bit hash of the English text.
- A script (`scripts/i18n.cjs`) uses the TypeScript AST to **extract** every English string into
  `i18n/en/<group>.txt`. Template literals become patterns (`{0} lessons done`).
- It **builds** `i18n/pt-es/*.txt|tsv` (one file holds both languages; `[[n]]` stands for the
  English code blocks) into `src/i18n/gen/{pt,es}.json`. It rejects translations that change
  placeholders, inline code or code blocks, prints coverage per group, and has a `todo <group>`
  command.
- Runtime fallbacks: outer spaces, wrappers (numbers, markdown), separators (` · `, `: `), prose around
  code blocks, paragraphs. Dictionaries load lazily, and Blockly gets its own locale.
- Language switch in Settings and on the title screen, auto-detected from the browser.
- Translate all UI, help, achievements, data and every quiz lesson, and as many coding-challenge texts as
  you can (aim for ≥ 85 % of all strings). Say honestly what is still in English.

### 8. Tests (all must pass before you call it done)

**Unit tests (Vitest, Node environment, in `tests/unit/`)**. Use an in-memory `localStorage` and set
`window = globalThis` in a setup file, because zustand's persist reads `window.localStorage`. Cover:
levels/XP/titles, quests, stars and items; the store (lesson rewards, repeat rewards, review stops,
streaks over days with the clock offset, freezes, hearts and refills, potions, minigame stars and
daily item caps, quests paid once, the inbox, the save without toasts); pets (20 species, 8/5/4/3
split, egg odds sum to 1, hunger over time, hatching with XP, every species normal and shiny, feeding
and playing, ultra eggs not for sale); homestead (plant → water → ripe → harvest → sell, dry growth
three times slower, withering and weeds after a long absence, chickens lay eggs); battles (regions
reference real monsters, dragons are enemies, scaling, first boss egg); absence (short break = nothing,
3 days = streak lost, hungry pets, invaders, decay, an inbox letter; clean-up and comeback bonus);
achievements (124, unique, categories and tiers, none unlocked on a new save, gold paid once, career
rank); content integrity (20 courses, ≥ 365 lessons, unique ids, valid answers and blanks, paths use
real courses, lessons open in order); solutions that run in Node (every terminal lesson, every SQL
lesson with sql.js, every hero-grid lesson with the grid simulator: the solution wins and the starter
doesn't); every Code Farm level (solution = 3 stars, empty program fails); minigame data; runner
helpers (formatValue, deep equality, the Oracle, the tokenizer); i18n (catalogue keys equal the
runtime hash, ≥ 85 % coverage, no stale keys, placeholders and code kept, tr/t/tn/up/untranslated in
pt and es).

**End-to-end tests (Playwright bots in `tests/*.cjs` against the production build)**. Share
helpers that find widgets through `window.__ui` and click them with the real mouse and keyboard:
- `verify-lessons`: runs the in-app verifier → every lesson OK.
- `answer-bot all-quiz`: plays every quiz lesson through the UI → 100 %.
- `challenge-bot <ids>`: fails twice, shows the solution, passes (one challenge per language/framework,
  including Python and PHP).
- `world-bot`: walks with arrows/WASD, enters and leaves buildings, click-to-walk, travel bar, help,
  welcome tour.
- `adaptive-bot`: refreshers, review stops, locks, shortcuts, express lessons, warm-ups, Lumi's "stuck"
  offer.
- `farm-bot`: drags real Blockly blocks, then plays all 30 farm levels → 3 stars.
- `game-bot`: wins all 9 minigames with 3 stars, then a path stop gives its items.
- `life-bot`: developer mode, hatch/feed/play with a pet, homestead with WASD (buy, plant, water, grow,
  harvest, animal), a battle with Strike and Spell, a 3-day time skip (welcome back, invaders, decay),
  chase an invader, the comeback lesson, the inbox.
- `i18n-bot`: every screen in pt and es, lists untranslated strings, fails on page errors.
- `screenshots`: a new player's tour on desktop and phone sizes, fails on page errors.

`tests/e2e.cjs` builds nothing itself. It starts `vite preview` on a free port (or takes `--url`), runs
every bot in sequence with timeouts, writes logs to `tests/e2e-logs/`, prints a PASS/FAIL table and
exits non-zero on failure. Support `--quick`, `--only` and `--skip`.

npm scripts: `dev` (port 5180), `build` (vendor runtimes + `tsc -b` + `vite build`), `preview` (5181),
`typecheck`, `test` (typecheck + `i18n:check` + unit), `test:unit`, `test:watch`, `test:e2e` (build +
all bots), `test:e2e:quick`, `test:all`, `i18n`, `i18n:extract`, `i18n:check`, `verify-lessons`,
`verify-farm`, `export-assets`.

### 9. Deliverables

- The project folder with `README.md` (features, how to run, every script, layout, how to add lessons,
  farm levels, help, translations, developer mode) and `PLAN.md` (the design: decisions, structure,
  systems, technology, quality checks, roadmap).
- A zip of the source without `node_modules`, `dist`, screenshots, test logs or generated vendor
  runtimes. Prove it works by unzipping it into a clean folder and running `npm install && npm run
  build && npm test`.
- A short, honest report: what works, how it was verified (numbers from the tests), and what is left
  (for example untranslated challenge texts, notifications only while the browser/service worker is
  alive, and machine-written translations).
