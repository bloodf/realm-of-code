# Realm of Code — Game Plan (v0.7)

A free pixel-art RPG that teaches programming from the very first drag-and-drop block to the
first job as a junior developer. The whole game is built in the Phaser 3 engine (every screen is a scene on a
canvas). You play in a game world (the village of Codehaven):
buildings hold the lessons, the Code Farm (program a farmer with blocks, then with JavaScript), minigames,
quests and trophies, a homestead with crops and animals, pets, and PvE battles. The look is medieval pixel art: a
helper (Lumi the fairy; dragons are the enemies), animated heroes and an NPC teacher for each topic. Lessons stay short, Duolingo-style: one exercise at a time.

---

## 1. Decisions

| Topic | Decision |
|---|---|
| Audience | Kids, adult beginners, career switchers. Relaxed mode (no hearts) and short text for kids; optional "Sage's notes" with real-job details for adults. |
| Price | Free. Everything runs in the browser, so the site can be hosted as static files. |
| Format | **Like Duolingo**: a path of bite-sized lessons (5–10 exercises, about 3–5 minutes each), with immediate feedback, hearts, XP, streaks, daily goals and quests. |
| Paths | The player picks a career path and **can switch at any time**. Progress belongs to each lesson, so shared sections keep their progress. |
| Goal | A player who finishes a path has the skills expected from a **junior developer**, plus a portfolio of projects built in the game, and has practised the professional process (Git, PRs, testing, deploying, interviews). |

---

## 2. Structure

**Path → Sections (courses) → Units → Lessons → Exercises**

### Paths (switchable)
| Path | Sections |
|---|---|
| Frontend Developer · React / Vue / Svelte | Foundations, HTML, CSS, JavaScript, Workshop, APIs, TypeScript, Tailwind, the framework, Algorithms, Testing, Quality, Career |
| Backend Developer · Node.js & SQL | Foundations, HTML, JavaScript, Workshop, APIs, TypeScript, Node.js, SQL, NoSQL, Algorithms, Testing, Quality, Career |
| Backend Developer · Python & SQL | Foundations, HTML, Workshop, APIs, Python, SQL, NoSQL, Algorithms, Testing, Quality, Career |
| Backend Developer · PHP & SQL | Foundations, HTML, CSS, Workshop, APIs, PHP, SQL, Algorithms, Testing, Quality, Career |
| Full-Stack · React + Node + SQL | Foundations, HTML, CSS, JavaScript, Workshop, APIs, TypeScript, React, Node.js, SQL, NoSQL, Algorithms, Testing, Quality, Career |
| **Software Trainee → Junior Engineer** | Foundations, HTML, CSS, JavaScript, Workshop, Python, SQL, APIs, Algorithms, Testing, Quality, Career |
| Not sure yet | Foundations, HTML, CSS, JavaScript, Workshop, then choose |

Finishing most of a path opens the **Junior Trial** (a boss battle with questions from every section of the path);
winning it gives the **Junior Developer** rank.

### Sections (20 courses, 365 lessons, 1,343 exercises, 128 coding challenges)
| Section | Units | Highlights |
|---|---|---|
| Web Foundations | 2 | How the web works, how programmers think |
| HTML | 6 | Tags → forms → semantic, accessible HTML; boss: tavern website |
| CSS | 8 | Box model, Flexbox, Grid, cascade, animation, positioning, responsive design |
| JavaScript | 11 | Hero-map levels (loops, conditions, functions), data, objects, array methods, DOM, localStorage, async, modules, classes; 2 projects |
| Developer Workshop ("process") | 5 | **Simulated terminal with Git**: cd/ls/mkdir, init/add/commit, branches & merge, npm; GitHub, PRs, code review, conflicts, build tools, debugging |
| APIs and HTTP | 2 | REST, JSON, status codes, headers; `fetch` challenges against a mock API |
| TypeScript | 3 | Types, interfaces, unions, generics, utility types (real compiler) |
| Tailwind CSS | 2 | Utilities, layout, variants, responsive (Tailwind v4 runs live) |
| React | 6 | JSX, props, state, effects, data fetching, lifting state, routing, ecosystem, common bugs |
| Vue / Svelte | 4 / 3 | Components, reactivity, directives/runes, props & events, Router/Pinia/Nuxt, SvelteKit |
| Node.js | 4 | Express routes, params/query, REST CRUD, middleware, auth, deployment (mini Express runs in the browser) |
| SQL and Databases | 4 | 18 real queries on SQLite (SELECT → JOIN → INSERT/UPDATE/DELETE → CREATE TABLE), injection, ORMs, NoSQL |
| Testing | 2 | test/expect challenges (Vitest-style runner), TDD, mocks, Testing Library, Playwright, CI |
| Quality | 3 | Accessibility (WCAG, keyboard, ARIA), performance (Core Web Vitals), security (XSS, secrets, SQL injection, hashing) |
| Python | 6 | print, variables, decisions, loops, collections, functions, modules, errors, classes, pytest; real Python (Pyodide) |
| PHP | 4 | echo, arrays, functions, forms, security, PDO, classes, Composer, Laravel; real PHP 8 (php-wasm) |
| NoSQL | 2 | Documents, MongoDB queries and updates, indexes, aggregation, Redis, SQL vs NoSQL |
| Algorithms | 3 | Big-O, hash maps, binary search, sorting, stacks and queues, recursion, the interview method |
| Getting Hired | 3 | Portfolio, GitHub/README, deploying, CV, job search, STAR interviews, technical interviews, agile teams, code review |

### Exercise types
Teach card · multiple choice · "what does this print?" (answers verified by running the code) ·
tap-tiles fill-in-the-blank · put lines in order · match pairs (tap pairs, or **link X to Y** with ropes) · type the answer · find the bug ·
**coding challenge** (editor + live preview / hero map / console) · **SQL challenge** ·
**terminal challenge**.

Every quiz shows a short "how to answer" line, the Check button glows when you are ready, and after
checking each piece turns green or red (tiles, gaps, lines, ropes), not just the whole answer.

---

## 3. Game systems
- **Hearts** (5): a wrong answer costs one. They refill one every 20 minutes, fully for 50 gold, or +1 per practice session. **Relaxed mode** turns them off.
- Wrong answers **come back** at the end of the lesson until you get them right.
- **XP** per lesson (15, plus a bonus for perfect lessons), challenges 20, projects 50. Player level, plus a **level per skill** (0–10).
- **Skills page**: technical vs process skills, XP bars, "freshness" bars that fade over time, a practice button for each skill, and a **job-readiness checklist** for the chosen path.
- **Practice**: mistake review, mixed practice, practice per skill, the tavern (all 9 minigames) and a merchant who sells items for gold.
- **Items** (the satchel): **Lightbulb** = a hint (removes wrong answers, places a tile or line, links a pair, shows half of a typed answer, clears good lines in find-the-bug). **Torch** = after a wrong answer, try again with no heart lost. **Potion** = +1 heart. Items are won in minigames (and sold by the merchant). Not usable in "Jump here" tests.
- **Jump here**: pass a short test to skip units you already know (for experienced learners).
- **Daily goal** (10/20/30/50 XP), **streak** with streak freezes, 3 **daily quests** with treasure chests.
- **124 achievements** in 11 categories with bronze/silver/gold/legendary tiers (they give gold), a trophy for each finished section, a legendary trophy for each finished path, and a **career rank** (Newcomer → Apprentice → Trainee → Junior Candidate → Junior Developer).
- **Pets, homestead and battles** (v0.7, see section 12).
- Onboarding: choose a path → experience level → daily goal → lesson style → hero.

---

## 4. Technology
- Vite + TypeScript + **Phaser 3**: every screen is a Phaser scene (no React, no HTML pages). Zustand (vanilla store, saved in localStorage, with a migration from the v0.1 save format).
- A small widget kit drawn by Phaser (`src/ui/`): pixel frames, buttons, cards, speech bubbles, scroll views, modals, and markdown rendered to textures (with code highlighting). Every interactive widget is registered with an id, which is what guided tours point at and what the test bots click.
- DOM only where a canvas is the wrong tool, placed inside scenes by Phaser: text inputs, CodeMirror editors, Blockly, sandboxed preview iframes, the terminal.
- Content lives in typed data files (`src/course/courses/*.ts`) written with a small DSL (`mc`, `fill`, `order`, `match`, `bug`, `out`, `sql`, `term`…).
- Runtimes in the browser:
  - JavaScript in a Web Worker (endless loops are stopped)
  - TypeScript compiler
  - Sucrase for JSX, and the Vue and Svelte compilers
  - Tailwind v4
  - sql.js (SQLite compiled to WebAssembly)
  - a simulated shell with a mini Git and npm
  - a mini Express
  - a Vitest-style test runner
  - a mock REST API for `fetch`
  - Python (Pyodide) and PHP 8 (php-wasm) in a worker, loaded the first time they are needed
- Lesson previews are sandboxed and have their own separate `localStorage`, so lesson code can never touch the game's save.

---

## 5. Quality checks
- `npm test`: type check, translation check and **86 unit tests** (Vitest): game rules (XP, streaks, hearts, items, quests, pets, homestead, battles, absence), achievements, content integrity, every terminal/SQL/hero-map/Code Farm solution run in Node, translations. `npm run test:e2e` builds and runs every bot below (`tests/e2e.cjs`).
- `npm run verify-lessons`: **365/365 lessons pass** (1,343 exercises; Python and PHP "what does this print?" answers run on the real interpreters). It checks that:
  - every exercise is well-formed
  - every "what does this print?" answer matches the real output
  - every coding challenge's solution passes and its starter code fails
  - every SQL and terminal challenge can be solved
- `tests/answer-bot.cjs` plays lessons through the real UI, answering correctly, and expects 100% accuracy.
- `tests/game-bot.cjs` wins every minigame with 3 stars through the UI, and checks the item rewards of a path stop.
- `tests/adaptive-bot.cjs` makes mistakes on purpose and checks refreshers, review stops, the lock and unlock, shortcuts, express lessons, warm-ups, and that Lumi offers help after the same question is missed twice (18 checks).
- `npm run verify-farm` proves every Code Farm level is solvable with 3 stars (and not solved by an empty program).
- `tests/farm-bot.cjs` drags real blocks to solve level 1, then plays all 30 farm levels through the UI.
- `tests/world-bot.cjs` walks the village with the keyboard, opens and closes buildings, clicks a building to walk there, uses the travel bar, opens Lumi's help and follows the welcome tour (14 checks).
- `tests/life-bot.cjs` plays the v0.7 systems: developer mode, hatching and caring for a pet, walking the homestead with WASD, buying, planting, watering, growing and harvesting, an animal, a battle with Strike and Spell, 3 days of absence (welcome back, invaders, decay, raven mail), chasing an invader, and the comeback lesson.
- `tests/i18n-bot.cjs` visits every screen in Portuguese and Spanish and lists text drawn without a translation; `npm run i18n` checks every translation keeps the placeholders, code and code blocks of the English.
- `tests/challenge-bot.cjs` solves coding challenges through the UI (fail twice, show the solution, pass).
- `tests/screenshots.cjs` plays like a brand-new player (desktop and phone) and saves screenshots of every screen.
- All bots drive the canvas with the real mouse and keyboard, through the UI registry (`window.__ui`).

---

## 6. A game, not a website (v0.5 → v0.6)
**Engine:** everything is Phaser 3 (v0.6 moved every remaining page into scenes: title, hero creation, building windows,
lessons with all exercise types, minigames, results, help). Blockly for drag-and-drop blocks, CodeMirror for typed code,
the code worker (sandbox + infinite-loop protection) for running programs.

**The village of Codehaven** (home screen). A tile map with a plaza, roads, a pond, a forest border, fields, NPCs at every
door, torches, chimney smoke and birds. Walk with the arrow keys / WASD or tap to walk (path finding). Walking through a
door (or pressing Enter at it) opens the building as an in-game window over the dimmed, paused village:

| Building | Opens |
|---|---|
| The Academy (castle) | the lesson path (sections, units, review stops, minigame stops) |
| Greenhollow Farm (barn) | the Code Farm |
| The Tavern | practice, all 9 minigames, the merchant |
| Guild Hall | daily quests and streak |
| Library Tower | skills and job readiness |
| Hall of Trophies | trophies and achievements |
| Your Cottage | your hero and stats (Settings from the hotbar) |
| Path Board (plaza) | choose or switch career path |

A HUD shows the hero portrait, level and XP, the daily goal, gold, hearts, streak and items. A hotbar jumps to any building.
Lessons, minigames and farm levels are full-screen scenes; closing them returns to the building.

**Code Farm: learn to code by farming.** A grid farm (up to 6x6 plus paths). The program drives the farmer:
`move(dir)`, `till()`, `plant(crop)`, `water()`, `sleep()` (watered crops grow one step overnight), `harvest()`,
`pullWeed()`, `refill()` (next to the pond), `nextRow()`, `say(x)`, and questions `isDry()`, `isRipe()`, `hasWeed()`,
`isField()`, `canMove(dir)`, `waterLeft()`... Mistakes (bumping into fences, watering wet soil, harvesting too early)
cost the second star. The third star needs a short program (at most `par` blocks or lines).

| Chapter | Mode | Teaches |
|---|---|---|
| 1 First Furrows (8 levels) | drag-and-drop blocks | commands, sequences, growing over days, repeat loops |
| 2 The Six-by-Six (5) | blocks | nested loops, a helper command (next row) |
| 3 The Smart Farmer (5) | blocks + the JavaScript they make (with "Type it instead") | if, if/else, while, sensors |
| 4 Words of Power (8) | typed JavaScript (command buttons + autocomplete) | statements, for, nested for, if, variables, functions, parameters, arrays and `%` |
| 5 Master of the Valley (4) | typed JavaScript | while + numbers, counting, reusable functions, functions as arguments |

While the farmer acts, the running block (or line) lights up. Hints (the first is free, then they cost a lightbulb),
the solution after two failed runs, progress saved per level. `npm run verify-farm` and `tests/farm-bot.cjs` check
every level.

## 7. Adaptive path and minigames (v0.4)
The content is fixed, but the path each player walks is built at run time (`src/course/adaptive.ts`):
- **Pace**: the average first-try accuracy of the last 5 lessons: *struggling* (< 70%), *steady*, *strong* (≥ 90%). Shown on the path with Lumi.
- **Review stops**: a lesson finished under 75% on the first try adds a review stop right after it: the lesson's teach cards, the missed questions and a few more. It blocks new lessons until done, and never costs hearts.
- **Refresher cards**: two misses in a row bring back the teach card before that question, and the next lightbulb is free.
- **Warm-ups** for struggling players (up to 2 old mistakes from the same section before a new lesson); **express lessons** for strong players (up to 2 easy true/false questions skipped); **shortcut stops** for strong players (a short test to skip the rest of the unit).
- **Minigame stops**: one in the middle of every unit, optional, chosen to fit the section and only using what has been learned (no loop game before loops are taught). Stars: 1★ lightbulb, 2★ torch, 3★ lightbulb + potion, given once per star.

| Minigame | What you practise | Content |
|---|---|---|
| Rune Link | terms and meanings (link X to Y, against the clock) | matching pairs from your lessons |
| Memory Crypt | terms and meanings (flip tiles) | matching pairs from your lessons |
| Torch Run | quick questions, right answers feed the torch | questions from your lessons |
| Bug Hunt | reading code, spotting bugs | find-the-bug exercises from your lessons (+ a fixed set in the tavern) |
| Selector Archery | CSS selectors | 12 rounds, path stops pick 6 that fit the unit |
| Archive Hunt | reading SQL: tap the rows a query returns | generated queries, only with SQL words you met |
| Loop Bridge | counting loop iterations (off-by-one!) | generated loops, checked by running them |

## 8. Phones
One-column lessons with smaller NPCs, a stacked feedback bar, coding/SQL challenges as **Task / Code / Result** tabs,
touch-friendly rope dragging (or tap-tap), bottom navigation, and all minigames sized for 390px screens.

## 9. Art direction (v0.3)
- **Everything is pixel art**, drawn in code (`src/pixel/`): UI frames and buttons are 9-slice pixel images, icons are 12x12 pixel glyphs, fonts are Jersey 15 (text), Jacquard 12 (blackletter titles) and VT323 (code; Settings → Classic code font switches to a normal monospace font).
- **World map**: each section has its own biome (green village, stone quarry, flower gardens, deep forest, workshop, rocky mountain pass, lava forge, market town, crystal grove, druid vale, volcano, tavern town, desert archive, proving grounds, snowy watchtower, guild fair). Every unit is a painted map chunk with a dirt road linking the lessons, trees, houses and animated props (torches, fires, birds). The hero walks from the last lesson to the next one.
- **Characters**: 20 NPC teachers (one per section) blink, talk and ask the questions in lessons; heroes and Lumi have idle, walk and cheer animations.
- **Lessons** play in front of the section's sky and landscape. Finishing a lesson opens a treasure chest with a burst of coins.
- Mini-games (Selector Archery, Bug Hunt) use the same scenes and NPC hosts.

## 10. Help: step by step, FAQ, and getting unstuck (v0.6)
Lumi the fairy is the helper on every screen (a gold fairy button). It opens the **help panel** with three tabs:

| Tab | What it gives |
|---|---|
| This screen | What the screen is for, in 2-3 sentences; extra advice for what is on screen right now (how to answer *this kind* of question, how *this* minigame works); **Show me step by step** (a guided tour); replay the welcome tour; a switch for first-visit tips |
| I'm stuck | A list of common problems for this screen ("the farmer does nothing", "my code shows an error", "I ran out of hearts"...). Each opens into advice, and many have a button that does it for you: use a lightbulb, use a torch, drink a potion, show a hint, reset the code, show the solution |
| Questions | The FAQ entries for this screen first, then all 41 questions in 7 topics with a search box |

- **Guided tours**: the screen dims except for one real button or area, with a pulsing frame and an arrow; Lumi explains it in a bubble (Back / Next / Skip, arrow keys, Esc). Tours move the village camera or scroll lists to show what they talk about, and skip steps whose button is not on screen. Code editors and other DOM pieces are dimmed with CSS and a window is cut out of them where the bubble is.
- **First visits**: a new player gets the 9-step welcome tour of the village. Every other screen (each building, lessons, coding challenges, minigames, farm fields) offers its own short tour once ("First time in the Academy? Want me to show you around?").
- **Getting unstuck**: if the player does nothing for 45 seconds during a question, a farm field or a game, or misses the same question (or farm run) twice, Lumi peeks out next to the help button: "Stuck? I can help" → opens the *I'm stuck* tab.
- **Help & FAQ page** (Settings, the title screen, the help panel): *How to play* in six illustrated steps, the tours, and the searchable FAQ.
- The help works before you have a hero too (title screen and hero creation), and while help is open the game underneath is paused (timers stop).
- Content for all of this is data in `src/scenes/help/content.ts`.

## 11. v0.7: a living realm

- **Lumi the fairy** replaces the dragon as the guide. Dragons (whelp, fire dragon, black dragon, the Elder Dragon of Bugs) are now enemies at the Monster Gate.
- **Pets** (Pet Sanctuary): 20 species (8 common, 5 uncommon, 4 rare, 3 ultra rare), 1 in 20 hatch **shiny** (a palette swap and sparkles). Eggs come from Lumi, bosses, quests and the egg shop (ultra rare eggs only from bosses) and hatch with XP. Pets have food and joy that drop over time, favourite foods, levels, a name, a Petdex; the active pet follows the hero in the village and a happy pet gives +5% XP.
- **Homestead**: a walkable farm (WASD/arrows, Space to act). 8 crops that grow in real time (3 minutes to 1 hour, faster when watered; weeds and withering when neglected), up to 12 plots, 8 animals (chicken, cow, sheep, pig, goat, horse, dog, cat) with food, joy and products, a market stall to buy and sell. The horse makes the hero faster in the village; the dog slows weeds; the cat keeps ripe crops fresh longer.
- **Battles**: 5 regions (Slime Meadow → Dragon's Peak) that open with lessons, 17 monsters, region bosses, turn-based fights: **Strike** = a question from the lessons you finished (combos for streaks), **Spell** = type a code word before the bar empties, **Defend**, **Potion**, run away. Rewards: XP, gold, items, eggs. The **Junior Trial** is the final exam of a path.
- **Minigames**: Gem Forge (match-3 with bonus questions for time) and Rune Typist (type the word on each monster before it reaches the wall).
- **Habits and notifications**: the raven inbox (letters from Lumi: welcome back, gifts, reminders); optional browser notifications through a service worker (daily reminder at a chosen hour, streak in danger, hungry pet, ripe crops).
- **Being away changes the realm**: after a day or more away, the welcome-back letter lists what happened (streak lost, hungry pets, ripe and withered crops); weeds, mushrooms and a grey sky cover the village (rain after a few days), and bug monsters wander into the village (walk into them or press Space to fight). One lesson cleans everything up and gives a comeback gift.
- **Developer mode**: a panel (Settings, `?debug`, the `` ` `` key) to change the player, progress, achievements, move the clock forward (time travel), hatch/spawn pets, grow crops, spawn invaders, send notifications and jump to any screen; an overlay shows the UI ids the bots use.
- **Three languages** (English, Portuguese, Spanish): translation happens where text is drawn, so content stays plain English in the code. 6,117 of 7,085 strings (86%) are translated: all menus, help, achievements, data and quiz lessons, and the coding challenges of HTML, CSS, JavaScript, Python, PHP, APIs, testing and accessibility. Still English: the challenge instructions of Algorithms, TypeScript, Node, Tailwind, React, Vue and Svelte (`node scripts/i18n.cjs todo code-ts` lists them).
- **Performance**: the village ground is baked into one texture (thousands of tile images removed), and the game draws only 8 frames per second when the window is in the background or untouched for 45 seconds.

## 12. Roadmap (next)
0. Translate the remaining coding-challenge instructions (JavaScript, Python, PHP, frameworks) and add more languages.
1. More game worlds like the farm: a **Castle Forge** for HTML/CSS, a **Library Archive** for SQL, a **Dungeon** for functions and recursion.
2. More depth where junior job posts ask for it: Next.js, forms & validation (zod), Go, Java or C# paths, a Git conflict simulator.
3. Spaced repetition: bring back old exercises automatically ("legendary" levels for each unit).
4. Accounts and cloud save (optional, privacy-first for kids), leaderboards and leagues, friends, trading pets.
5. Push notifications from a server (today reminders work while the browser keeps the service worker alive), mobile polish, a content editor for contributors.
