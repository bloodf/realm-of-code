// The Forest of Loops: JavaScript from zero, first by steering a hero, then with
// data, functions, the DOM and async code.
import type { Lesson, GridLesson, ConsoleLesson, WebLesson } from '../types';
import { uses } from '../helpers';
import { eq } from '../../runners/format';

const HERO_API = `Your hero understands these commands:

\`\`\`
hero.moveRight()   hero.moveLeft()
hero.moveUp()      hero.moveDown()
\`\`\``;

const grid: GridLesson[] = [
  {
    id: 'js-01', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Forest Path', xp: 40,
    title: 'First Steps',
    concepts: ['function calls', 'statements'],
    story: 'Your hero stands at the edge of the Forest of Loops. The castle gate is just ahead, but heroes here only move when given **code**.',
    learn: `${HERO_API}

Each line is a **statement**: one command. The computer runs them **one after another**, from top to bottom.

\`hero.moveRight()\` means: take the \`hero\` and call its \`moveRight\` command. The \`()\` brackets make it happen.`,
    task: 'Walk your hero to the castle gate. One `hero.moveRight();` is already written. How many more do you need?',
    sage: 'In JavaScript, `hero.moveRight` is a *method*: a function that belongs to an object. Writing the name without `()` only *refers* to the function; the brackets *call* it. Semicolons at the end of statements are optional in JavaScript, but most style guides use them.',
    hints: ['Count the tiles between your hero and the gate.', 'You need 4 `hero.moveRight();` lines in total, one per line.'],
    map: [
      'TTTTTTT',
      'T.....T',
      'TH,,,ET',
      'T.....T',
      'TTTTTTT',
    ],
    starter: '// Move the hero to the gate\nhero.moveRight();\n',
    solution: 'hero.moveRight();\nhero.moveRight();\nhero.moveRight();\nhero.moveRight();\n',
    goals: { exit: true },
  },
  {
    id: 'js-02', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Forest Path', xp: 40,
    title: 'Around the Old Oak',
    concepts: ['sequences', 'directions'],
    story: 'An ancient oak blocks the straight road. You will have to walk around it.',
    learn: `${HERO_API}

Programs are **sequences**: the order of the lines matters. If you walk into a tree, your hero just says "Ouch!" and stays where it is.

Tip: you can run your code as often as you like. Try, watch, fix.`,
    task: 'Walk around the trees to reach the gate.',
    sage: 'Breaking a big problem into small ordered steps is called an **algorithm**. Professional developers do the same: they describe the steps first, then write code. Running code often and watching what happens is a real habit of good programmers, not a beginner thing.',
    hints: ['Go right 2 times, then down 2 times, then right again.', 'After `moveRight` twice and `moveDown` twice, you need 3 more `moveRight()`.'],
    map: [
      'TTTTTTTT',
      'TH,,T..T',
      'T..,T..T',
      'T..,,,ET',
      'TTTTTTTT',
    ],
    starter: 'hero.moveRight();\n',
    solution: 'hero.moveRight();\nhero.moveRight();\nhero.moveDown();\nhero.moveDown();\nhero.moveRight();\nhero.moveRight();\nhero.moveRight();\n',
    goals: { exit: true },
  },
  {
    id: 'js-03', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Forest Path', xp: 45,
    title: 'Steps with Numbers',
    concepts: ['arguments', 'numbers'],
    story: 'The forest path is long. Writing the same command again and again makes your wrist tired.',
    learn: `You can give a command extra information inside the brackets. This is called an **argument**:

\`\`\`
hero.moveRight(5);   // 5 steps to the right
\`\`\`

Text after \`//\` is a **comment**. The computer ignores it; it is a note for humans.`,
    task: 'Reach the gate using numbers as arguments.',
    sage: 'Arguments let one function do many jobs. `moveRight()` with no argument uses a *default value* of 1 step. You will write your own functions with parameters and defaults soon.',
    hints: ['Right 5, down 3, right 2.', '`hero.moveRight(5);` then `hero.moveDown(3);` then `hero.moveRight(2);`'],
    map: [
      '##########',
      '#H,,,,,..#',
      '#.....,..#',
      '#.....,..#',
      '#.....,,E#',
      '##########',
    ],
    starter: '// Use numbers inside the brackets\nhero.moveRight(1);\n',
    solution: 'hero.moveRight(5);\nhero.moveDown(3);\nhero.moveRight(2);\n',
    goals: { exit: true },
    parLines: 3,
  },
  {
    id: 'js-04', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Forest Path', xp: 50,
    title: 'Gems of the Glade',
    concepts: ['planning', 'sequences'],
    story: 'Three blue gems sparkle in the glade. The royal jeweller pays well... but only if you bring all three.',
    learn: 'Walking over a gem picks it up. Plan your route on the map before you write code: where is each gem, and in which order will you collect them?',
    task: 'Collect **all three gems**, then walk to the gate.',
    sage: 'This is a small version of a famous computer-science puzzle: the *travelling salesman problem* (find the shortest route through many places). For big maps it is extremely hard to solve perfectly, which is why delivery companies use clever approximations.',
    hints: ['The gem below you is only 2 steps down. Then come back up.', '`moveDown(2)`, `moveUp(2)`, `moveRight(6)`, `moveDown(3)`.'],
    map: [
      'TTTTTTTTT',
      'TH..*...T',
      'T.T.T.T.T',
      'T*..T..*T',
      'T.....,ET',
      'TTTTTTTTT',
    ],
    starter: '',
    solution: 'hero.moveDown(2);\nhero.moveUp(2);\nhero.moveRight(6);\nhero.moveDown(3);\n',
    goals: { gems: 'all', exit: true },
    parLines: 4,
  },
  {
    id: 'js-05', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Loop Woods', xp: 60,
    title: 'The Bridge of Seven Planks',
    concepts: ['for loop', 'repetition'],
    story: 'A rope bridge crosses the river. The troll who guards it only respects heroes who know the **loop spell**.',
    learn: `A **for loop** repeats code. This one repeats 3 times:

\`\`\`
for (let i = 0; i < 3; i++) {
  hero.moveRight();
}
\`\`\`

Read it like this:
1. \`let i = 0\`: start a counter at 0
2. \`i < 3\`: keep going while the counter is less than 3
3. \`i++\`: add 1 to the counter after each round

The code between \`{ }\` runs once per round.`,
    task: 'Cross the bridge to the gate using a `for` loop. Do **not** use a number inside `moveRight()` this time: the troll is watching.',
    sage: 'Counting from 0 is normal in programming (arrays start at index 0 too). `i++` is short for `i = i + 1`. The three parts of the `for` header are: *initialisation*, *condition* and *update*. If the condition never becomes false, the loop runs forever: an infinite loop.',
    hints: ['Count the moves: from the hero to the gate is 8 steps.', '`for (let i = 0; i < 8; i++) { hero.moveRight(); }`'],
    map: [
      'TTTTTTTTTTT',
      '~~~~~~~~~~~',
      ',H=======E,',
      '~~~~~~~~~~~',
      'TTTTTTTTTTT',
    ],
    starter: '// Repeat this with a for loop\nhero.moveRight();\n',
    solution: 'for (let i = 0; i < 8; i++) {\n  hero.moveRight();\n}\n',
    goals: { exit: true },
    checks: [
      { label: 'Use a for loop', test: (c) => uses(c.code, /\bfor\s*\(/) },
      { label: 'No numbers inside moveRight()', test: (c) => !uses(c.code, /moveRight\s*\(\s*\d/), fail: 'The troll wants to see a loop, not moveRight(8).' },
    ],
    parLines: 2,
  },
  {
    id: 'js-06', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Loop Woods', xp: 60,
    title: 'Zig-Zag Stairs',
    concepts: ['loop body', 'patterns'],
    story: 'Gems lie on a staircase of stones that goes down the hill. Spot the pattern!',
    learn: `A loop can repeat **more than one line**. Everything inside \`{ }\` repeats:

\`\`\`
for (let i = 0; i < 3; i++) {
  hero.moveRight();
  hero.moveDown();
}
\`\`\`

This walks: right, down, right, down, right, down.

When the hero reaches the gate, the level ends right away, even in the middle of a loop.`,
    task: 'Collect every gem on the stairs and reach the gate with a loop.',
    sage: 'Finding a repeating pattern and turning it into a loop is called *abstraction*. It makes code shorter, and it also makes it easier to change: to walk 10 stairs instead of 5, you change one number.',
    hints: ['The pattern is: right, then down. Repeat it.', 'Repeat the pattern 5 times: `for (let i = 0; i < 5; i++) { hero.moveRight(); hero.moveDown(); }`'],
    map: [
      '#########',
      '#H*.....#',
      '#.,*....#',
      '#..,*...#',
      '#...,*..#',
      '#....,E.#',
      '#########',
    ],
    starter: 'for (let i = 0; i < 5; i++) {\n  // what repeats?\n}\n',
    solution: 'for (let i = 0; i < 5; i++) {\n  hero.moveRight();\n  hero.moveDown();\n}\n',
    goals: { gems: 'all', exit: true },
    checks: [{ label: 'Use a for loop', test: (c) => uses(c.code, /\bfor\s*\(/) }],
    parLines: 3,
  },
  {
    id: 'js-07', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Loop Woods', xp: 65,
    title: 'While the Path Is Clear',
    concepts: ['while loop', 'comparison', 'strings'],
    story: 'Fog fills the tunnel of trees. You cannot see how long it is... but your hero can look ahead.',
    learn: `\`hero.look("right")\` tells you what is next to the hero. It gives back a **string** (text), like \`"tree"\`, \`"empty"\`, \`"gem"\` or \`"exit"\`.

A **while loop** repeats *as long as* a condition is true:

\`\`\`
while (hero.look("right") !== "tree") {
  hero.moveRight();
}
\`\`\`

\`!==\` means "is not equal to". \`===\` means "is equal to".`,
    task: 'Use `while` loops and `hero.look()` to follow the tunnel (right, then down) without counting the steps.',
    sage: 'Use `for` when you know how many times to repeat, and `while` when you repeat *until something happens*. Always use `===` and `!==` in JavaScript: the older `==` converts types in surprising ways (`"0" == false` is true!).',
    hints: ['First loop: move right while the thing on the right is not a tree.', 'Second loop: `while (hero.look("down") !== "tree") { hero.moveDown(); }`'],
    map: [
      'TTTTTTTTTTTT',
      'TH,,,,,,,,,T',
      'TTTTTTTTTT,T',
      'TTTTTTTTTT,T',
      'TTTTTTTTTT,T',
      'TTTTTTTTTTET',
      'TTTTTTTTTTTT',
    ],
    starter: '// What does the hero see?\nconsole.log(hero.look("right"));\n',
    solution: 'while (hero.look("right") !== "tree") {\n  hero.moveRight();\n}\nwhile (hero.look("down") !== "tree") {\n  hero.moveDown();\n}\n',
    goals: { exit: true },
    checks: [
      { label: 'Use a while loop', test: (c) => uses(c.code, /\bwhile\s*\(/) },
      { label: 'Use hero.look()', test: (c) => uses(c.code, /hero\.look\s*\(/) },
      { label: 'No step counting with numbers', test: (c) => !uses(c.code, /move\w*\s*\(\s*\d/) && !uses(c.code, /\bfor\s*\(/), fail: 'Let the loop and hero.look() decide when to stop.' },
    ],
  },
  {
    id: 'js-08', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Loop Woods', xp: 70,
    title: 'If a Goblin Blocks the Way',
    concepts: ['if', 'conditions', 'attack'],
    story: 'Goblins hide in the narrow pass. You do not know where. Check before every step, and strike when needed!',
    learn: `An **if** statement runs code only when a condition is true:

\`\`\`
if (hero.look("right") === "goblin") {
  hero.attack("right");
}
\`\`\`

\`hero.attack("right")\` swings your sword at the tile on the right. Walking into a goblin does not work: you bump into it.`,
    task: 'Walk to the gate. Before each step, check for a goblin and attack it.',
    sage: 'An `if` can have an `else` branch: `if (...) { ... } else { ... }`, and you can chain `else if`. Conditions are *boolean* expressions: they are either `true` or `false`. Putting an `if` inside a loop, so you can react to the world, is the heart of most programs.',
    hints: ['Put the `if` inside a loop, and move after the `if`.', '`for (let i = 0; i < 9; i++) { if (hero.look("right") === "goblin") { hero.attack("right"); } hero.moveRight(); }`'],
    map: [
      '############',
      '#H,g,,g,g,E#',
      '############',
    ],
    starter: 'for (let i = 0; i < 9; i++) {\n  hero.moveRight();\n}\n',
    solution: 'for (let i = 0; i < 9; i++) {\n  if (hero.look("right") === "goblin") {\n    hero.attack("right");\n  }\n  hero.moveRight();\n}\n',
    goals: { goblins: 'all', exit: true },
    checks: [{ label: 'Use an if statement', test: (c) => uses(c.code, /\bif\s*\(/) }],
    parLines: 5,
  },
  {
    id: 'js-09', kingdom: 'js', kind: 'grid', lang: 'js', region: "The Hunter's Lodge", xp: 70,
    title: 'Teach Your Hero a Trick',
    concepts: ['functions', 'define and call'],
    story: 'The old hunter teaches you his climbing trick: "right foot, then up". Give the trick a name and you can use it again and again.',
    learn: `A **function** is a named group of commands. First you *define* it, then you *call* it:

\`\`\`
function climb() {
  hero.moveRight();
  hero.moveUp();
}

climb();   // do the trick
climb();   // and again!
\`\`\``,
    task: 'Write a function that climbs one stair, then call it (in a loop or many times) to reach the top and the gate.',
    sage: 'Functions are the main way to organise code: name a piece of logic, then reuse it. A good function name is a verb that says what it does (`climbStair`, `openDoor`). The DRY rule says: "Don\'t Repeat Yourself". If you copy the same lines three times, make a function.',
    hints: ['Define `function climb() { hero.moveRight(); hero.moveUp(); }`.', 'Call it 6 times (a loop helps), then do one last `hero.moveRight();`.'],
    map: [
      'TTTTTTTTTT',
      'TTTTTTT,ET',
      'TTTTTT,*TT',
      'TTTTT,,TTT',
      'TTTT,*TTTT',
      'TTT,,TTTTT',
      'TT,*TTTTTT',
      'TH,TTTTTTT',
      'TTTTTTTTTT',
    ],
    starter: 'function climb() {\n  // right foot, then up\n}\n\n',
    solution: 'function climb() {\n  hero.moveRight();\n  hero.moveUp();\n}\n\nfor (let i = 0; i < 6; i++) {\n  climb();\n}\nhero.moveRight();\n',
    goals: { gems: 'all', exit: true },
    checks: [
      { label: 'Define your own function', test: (c) => uses(c.code, /function\s+\w+\s*\(|(const|let)\s+\w+\s*=\s*(\([^)]*\)|\w+)\s*=>/) },
    ],
  },
  {
    id: 'js-10', kingdom: 'js', kind: 'grid', lang: 'js', region: "The Hunter's Lodge", xp: 70,
    title: 'The Locked Door',
    concepts: ['console.log', 'properties', 'debugging'],
    story: 'A heavy door blocks the way to the gate. Somewhere nearby lies its key.',
    learn: `Keys are picked up like gems. A door opens if you walk into it while carrying a key.

Your hero also has **properties**, values you can read:

\`\`\`
hero.x      // column
hero.y      // row
hero.keys   // how many keys you carry
hero.gems   // how many gems you carry
\`\`\`

\`console.log(value)\` prints a value in the console below the map. It is the #1 tool for finding bugs.`,
    task: 'Pick up the key, print `hero.keys` with `console.log`, then go through the door to the gate.',
    sage: 'Printing values to see what a program is doing is called *debugging*. Professionals use `console.log` every day, and also *breakpoints* in the browser DevTools, which pause the code so you can inspect everything.',
    hints: ['The key is 2 steps down.', '`hero.moveDown(2); console.log(hero.keys); hero.moveRight(8);`'],
    map: [
      '###########',
      '#H..#.....#',
      '#...#.....#',
      '#k..D....E#',
      '###########',
    ],
    starter: 'hero.moveRight(8);\n',
    solution: 'hero.moveDown(2);\nconsole.log(hero.keys);\nhero.moveRight(8);\n',
    goals: { exit: true },
    checks: [{ label: 'Print the number of keys (1) with console.log', test: (c) => c.logs.includes('1') && uses(c.code, /console\.log\s*\(\s*hero\.keys\s*\)/) }],
  },
];

const consoleLessons: ConsoleLesson[] = [
  {
    id: 'js-11', kingdom: 'js', kind: 'console', lang: 'js', region: "The Scribe's Hut", xp: 60,
    title: "The Scribe's First Words",
    concepts: ['variables', 'let/const', 'strings', 'numbers', 'template literals'],
    story: 'The village scribe keeps records of every hero. She asks you to write your own entry.',
    learn: `**Variables** are labelled boxes that hold values:

\`\`\`
const heroName = "Ada";  // const: never changes
let gold = 100;          // let: can change
gold = gold + 25;        // now 125
\`\`\`

Text is called a **string** and goes in quotes. **Template literals** use backticks and \`\${}\` to put values inside text:

\`\`\`
console.log(\`\${heroName} has \${gold} gold\`);
\`\`\``,
    task: 'Create `heroName` (your name, a string) and `gold` (starting at 100). Add 50 to `gold`. Then print exactly: `<name> has 150 gold`.',
    sage: 'Use `const` by default and `let` only when the value must change. Avoid the old `var` keyword: it has confusing scoping rules. Variable names use *camelCase* in JavaScript (`heroName`, `maxHealth`).',
    hints: ['`gold = gold + 50;` or the shortcut `gold += 50;`', '`console.log(`${heroName} has ${gold} gold`);` (note the backticks)'],
    starter: '// Create your variables here\n\n',
    solution: 'const heroName = "Ada";\nlet gold = 100;\ngold += 50;\nconsole.log(`${heroName} has ${gold} gold`);\n',
    probe: 'return { heroName: typeof heroName === "undefined" ? null : heroName, gold: typeof gold === "undefined" ? null : gold };',
    checks: [
      { label: 'heroName is a string', test: (c) => typeof c.values.heroName === 'string' && (c.values.heroName as string).length > 0 },
      { label: 'gold is 150 at the end', test: (c) => c.values.gold === 150, fail: 'Start at 100, then add 50.' },
      { label: 'Prints "<name> has 150 gold"', test: (c) => c.logs.includes(`${c.values.heroName} has 150 gold`) },
      { label: 'Use a template literal (backticks)', bonus: true, test: (c) => uses(c.code, /`[^`]*\$\{/) },
    ],
  },
  {
    id: 'js-12', kingdom: 'js', kind: 'console', lang: 'js', region: "The Scribe's Hut", xp: 60,
    title: 'Arrays of Supplies',
    concepts: ['arrays', 'push', 'length', 'for...of'],
    story: 'The quartermaster keeps the supplies in a long list. Help him add bread and call out every item.',
    learn: `An **array** is a list of values in square brackets:

\`\`\`
const supplies = ["rope", "torch"];
supplies.push("bread");      // add to the end
supplies.length;             // 3
supplies[0];                 // "rope" (counting starts at 0!)
\`\`\`

Loop over every item with **for...of**:

\`\`\`
for (const item of supplies) {
  console.log(item);
}
\`\`\`

\`item.toUpperCase()\` turns text into CAPITALS.`,
    task: 'Add `"bread"` to `supplies`. Print how many supplies there are. Then print every item in CAPITALS, one per line.',
    sage: 'Arrays are *objects* in JavaScript, so a `const` array can still be changed with `push`: `const` only stops you from replacing the whole array. Other useful methods: `pop`, `includes`, `indexOf`, `slice`, `splice`.',
    hints: ['`supplies.push("bread");` then `console.log(supplies.length);`', '`for (const item of supplies) { console.log(item.toUpperCase()); }`'],
    starter: 'const supplies = ["rope", "torch"];\n\n',
    solution: 'const supplies = ["rope", "torch"];\nsupplies.push("bread");\nconsole.log(supplies.length);\nfor (const item of supplies) {\n  console.log(item.toUpperCase());\n}\n',
    probe: 'return { supplies };',
    checks: [
      { label: 'supplies is ["rope", "torch", "bread"]', test: (c) => eq(c.values.supplies, ['rope', 'torch', 'bread']) },
      { label: 'Prints the count: 3', test: (c) => c.logs[0] === '3' },
      { label: 'Prints ROPE, TORCH, BREAD in order', test: (c) => eq(c.logs.slice(1), ['ROPE', 'TORCH', 'BREAD']) },
      { label: 'Use a loop (not three separate logs)', bonus: true, test: (c) => uses(c.code, /\bfor\s*\(|\.forEach\s*\(/) },
    ],
  },
  {
    id: 'js-13', kingdom: 'js', kind: 'console', lang: 'js', region: "The Scribe's Hut", xp: 70,
    title: "The Hero's Sheet",
    concepts: ['objects', 'properties', 'functions with parameters', 'return'],
    story: 'Every hero has a sheet: name, level, health. When you level up, the scribe must update it.',
    learn: `An **object** groups named values (*properties*):

\`\`\`
const myHero = { name: "Ada", level: 1, maxHp: 20 };
myHero.level;          // 1
myHero.level += 1;     // now 2
\`\`\`

Functions can take **parameters** and **return** a result:

\`\`\`
function heal(hero, amount) {
  hero.hp += amount;
  return hero;
}
\`\`\``,
    task: 'Write `levelUp(hero)`: it adds 1 to `hero.level`, adds 10 to `hero.maxHp`, and returns the hero. Create `myHero` with level 1 and maxHp 20, and level it up **twice**.',
    sage: 'Objects are passed *by reference*: the function changes the same object you gave it. In React and other modern code you will often create a *new* object instead (`return { ...hero, level: hero.level + 1 }`). That is called immutability.',
    hints: ['Inside the function: `hero.level += 1; hero.maxHp += 10; return hero;`', 'After the function: `const myHero = { name: "Ada", level: 1, maxHp: 20 }; levelUp(myHero); levelUp(myHero);`'],
    starter: 'function levelUp(hero) {\n  // your code\n}\n\n',
    solution: 'function levelUp(hero) {\n  hero.level += 1;\n  hero.maxHp += 10;\n  return hero;\n}\n\nconst myHero = { name: "Ada", level: 1, maxHp: 20 };\nlevelUp(myHero);\nlevelUp(myHero);\nconsole.log(myHero);\n',
    probe: 'const h = levelUp({ name: "Test", level: 4, maxHp: 50 }); return { h: h ?? null, mine: typeof myHero === "undefined" ? null : myHero };',
    checks: [
      { label: 'levelUp adds 1 level', test: (c) => (c.values.h as { level?: number } | null)?.level === 5 },
      { label: 'levelUp adds 10 maxHp', test: (c) => (c.values.h as { maxHp?: number } | null)?.maxHp === 60 },
      { label: 'levelUp returns the hero', test: (c) => c.values.h !== null && typeof c.values.h === 'object' },
      { label: 'myHero ends at level 3 with 40 maxHp', test: (c) => { const m = c.values.mine as { level?: number; maxHp?: number } | null; return m?.level === 3 && m?.maxHp === 40; } },
    ],
  },
  {
    id: 'js-14', kingdom: 'js', kind: 'console', lang: 'js', region: "The Scribe's Hut", xp: 80,
    title: 'Counting the Treasure',
    concepts: ['filter', 'map', 'reduce', 'arrow functions'],
    story: 'The dragon\'s hoard is finally yours! The treasurer needs two numbers before the feast.',
    learn: `**Arrow functions** are a short way to write functions: \`(x) => x * 2\`.

Arrays have powerful methods that take a function:

\`\`\`
const nums = [5, 20, 60];
nums.filter((n) => n >= 10);        // [20, 60]  keep some
nums.map((n) => n * 2);             // [10, 40, 120]  change each
nums.reduce((sum, n) => sum + n, 0); // 85  combine all
\`\`\`

For a list of objects: \`loot.map((item) => item.name)\`.`,
    task: 'Write `totalValue(loot)` that returns the sum of all `value`s, and `valuableNames(loot)` that returns the **names** of items worth 50 or more.',
    sage: '`map`, `filter` and `reduce` never change the original array; they return new values. This style is called *functional programming* and it is everywhere in modern JavaScript and React. A plain `for` loop is also fine and sometimes clearer.',
    hints: ['`return loot.reduce((sum, item) => sum + item.value, 0);`', '`return loot.filter((item) => item.value >= 50).map((item) => item.name);`'],
    starter: 'const loot = [\n  { name: "golden cup", value: 120 },\n  { name: "rusty nail", value: 1 },\n  { name: "silver ring", value: 50 },\n  { name: "old boot", value: 3 },\n];\n\nfunction totalValue(loot) {\n  // sum of all values\n}\n\nfunction valuableNames(loot) {\n  // names of items worth 50 or more\n}\n\nconsole.log(totalValue(loot));\nconsole.log(valuableNames(loot));\n',
    solution: 'const loot = [\n  { name: "golden cup", value: 120 },\n  { name: "rusty nail", value: 1 },\n  { name: "silver ring", value: 50 },\n  { name: "old boot", value: 3 },\n];\n\nfunction totalValue(loot) {\n  return loot.reduce((sum, item) => sum + item.value, 0);\n}\n\nfunction valuableNames(loot) {\n  return loot.filter((item) => item.value >= 50).map((item) => item.name);\n}\n\nconsole.log(totalValue(loot));\nconsole.log(valuableNames(loot));\n',
    probe: 'const other = [{ name: "a", value: 10 }, { name: "b", value: 99 }, { name: "c", value: 50 }]; return { t1: totalValue(loot), t2: totalValue(other), t3: totalValue([]), v1: valuableNames(loot), v2: valuableNames(other) };',
    checks: [
      { label: 'totalValue(loot) is 174', test: (c) => c.values.t1 === 174 },
      { label: 'totalValue works for other lists (and [] gives 0)', test: (c) => c.values.t2 === 159 && c.values.t3 === 0 },
      { label: 'valuableNames(loot) is ["golden cup", "silver ring"]', test: (c) => eq(c.values.v1, ['golden cup', 'silver ring']) },
      { label: 'valuableNames works for other lists', test: (c) => eq(c.values.v2, ['b', 'c']) },
      { label: 'Use filter and map', bonus: true, test: (c) => uses(c.code, /\.filter\s*\(/) && uses(c.code, /\.map\s*\(/) },
    ],
  },
];

const villageHtml = (body: string) => `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>The Village</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n${body}\n  <script src="script.js"></script>\n</body>\n</html>\n`;
const villageCss = `body { font-family: Georgia, serif; background: #fbf3dd; color: #2b1d12; padding: 12px 18px; }
h1 { color: #7d1f1a; }
button { font: inherit; padding: 6px 14px; border-radius: 6px; border: 2px solid #5a3a22; background: #e8c170; cursor: pointer; }
input { font: inherit; padding: 5px; }
li { margin: 4px 0; }
`;

const dom: (WebLesson | ConsoleLesson)[] = [
  {
    id: 'js-15', kingdom: 'js', kind: 'web', mode: 'html', region: 'The Village of Events', xp: 80,
    title: 'Ring the Village Bell',
    concepts: ['DOM', 'querySelector', 'addEventListener', 'textContent'],
    story: 'The village needs a bell counter: every time someone rings the bell, the number on the sign should go up.',
    learn: `JavaScript can change the page. The page is called the **DOM**.

\`\`\`
const bell = document.querySelector("#bell");   // find an element
bell.addEventListener("click", () => {          // react to clicks
  console.log("Ding!");
});
\`\`\`

\`element.textContent = "new text"\` changes the text of an element.

\`querySelector\` uses CSS selectors: \`#id\`, \`.class\`, \`tag\`.`,
    task: 'In **script.js**: when `#bell` is clicked, add 1 to a counter and show it in `#count`.',
    sage: 'This pattern (find elements, listen for events, update the DOM) is what frameworks like React, Vue and Svelte automate for you. Learning it by hand first makes those frameworks much easier to understand. The `<script>` is at the end of `<body>` so the elements exist before the script runs (or use `defer`).',
    hints: ['You need a `let rings = 0;` outside the click handler.', 'Inside the handler: `rings++; count.textContent = rings;`'],
    files: [
      { name: 'script.js', lang: 'js', code: '// 1. Find the bell button and the count span\n\n// 2. When the bell is clicked, add 1 and show it\n' },
      { name: 'index.html', lang: 'html', code: villageHtml('  <h1>The Village Bell</h1>\n  <p>The bell has rung <span id="count">0</span> times.</p>\n  <button id="bell">Ring the bell</button>'), readonly: true },
      { name: 'style.css', lang: 'css', code: villageCss, readonly: true },
    ],
    solution: { 'script.js': 'const bell = document.querySelector("#bell");\nconst count = document.querySelector("#count");\nlet rings = 0;\n\nbell.addEventListener("click", () => {\n  rings++;\n  count.textContent = rings;\n});\n' },
    checks: [
      { label: 'The count starts at 0', test: (c) => c.text('#count') === '0' },
      { label: 'One click shows 1', test: async (c) => { await c.click('#bell'); return c.text('#count') === '1'; } },
      { label: 'Two more clicks show 3', test: async (c) => { await c.click('#bell'); await c.click('#bell'); return c.text('#count') === '3'; } },
      { label: 'Use addEventListener', test: (c) => uses(c.files['script.js'], /addEventListener\s*\(\s*["']click["']/) },
    ],
  },
  {
    id: 'js-16', kingdom: 'js', kind: 'web', mode: 'html', region: 'The Village of Events', xp: 85,
    title: 'The Notice Board',
    concepts: ['input value', 'createElement', 'append', 'events'],
    story: 'Villagers want to pin notices on the board: "Dragon spotted!", "Lost goat"... Build the board.',
    learn: `Read what was typed with \`input.value\`. Create new elements and add them to the page:

\`\`\`
const li = document.createElement("li");
li.textContent = "Lost goat";
board.append(li);
\`\`\`

Clear an input with \`input.value = ""\`.`,
    task: 'When `#post` is clicked, add the text of `#notice` as a new `<li>` in `#board`, then clear the input. **Bonus:** ignore empty notices.',
    sage: 'Use `textContent`, not `innerHTML`, for text typed by users. `innerHTML` would run any HTML they type, which is a security hole called **XSS** (cross-site scripting). `value.trim()` removes spaces at the start and end, handy to detect "empty" input.',
    hints: ['Inside the click handler: `const li = document.createElement("li"); li.textContent = notice.value; board.append(li);`', 'To skip empty notices: `if (notice.value.trim() === "") return;`'],
    files: [
      { name: 'script.js', lang: 'js', code: 'const notice = document.querySelector("#notice");\nconst post = document.querySelector("#post");\nconst board = document.querySelector("#board");\n\n// When post is clicked...\n' },
      { name: 'index.html', lang: 'html', code: villageHtml('  <h1>The Notice Board</h1>\n  <label for="notice">Notice</label>\n  <input id="notice" placeholder="Dragon spotted!">\n  <button id="post">Pin it</button>\n  <ul id="board"></ul>'), readonly: true },
      { name: 'style.css', lang: 'css', code: villageCss, readonly: true },
    ],
    solution: { 'script.js': 'const notice = document.querySelector("#notice");\nconst post = document.querySelector("#post");\nconst board = document.querySelector("#board");\n\npost.addEventListener("click", () => {\n  if (notice.value.trim() === "") return;\n  const li = document.createElement("li");\n  li.textContent = notice.value;\n  board.append(li);\n  notice.value = "";\n});\n' },
    checks: [
      { label: 'Pinning "Dragon spotted!" adds it to the board', test: async (c) => { await c.type('#notice', 'Dragon spotted!'); await c.click('#post'); return c.$$('#board li').some((l) => l.textContent === 'Dragon spotted!'); } },
      { label: 'The input is cleared after pinning', test: (c) => (c.$('#notice') as HTMLInputElement).value === '' },
      { label: 'A second notice is added too', test: async (c) => { await c.type('#notice', 'Lost goat'); await c.click('#post'); return c.$$('#board li').length === 2; } },
      { label: 'Empty notices are ignored', bonus: true, test: async (c) => { await c.type('#notice', '   '); await c.click('#post'); return c.$$('#board li').length === 2; } },
    ],
  },
  {
    id: 'js-17', kingdom: 'js', kind: 'console', lang: 'js', region: 'The Village of Events', xp: 90,
    title: 'The Messenger Ravens',
    concepts: ['setTimeout', 'Promise', 'async/await'],
    story: 'Ravens carry messages between castles. They take time to fly, and your code must **wait** for their reply.',
    learn: `Some things take time (timers, downloading data). JavaScript does not stop and wait; it uses **Promises**: a promise of a value *later*.

\`\`\`
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve("done"), ms);
  });
}
\`\`\`

Inside an **async** function, \`await\` pauses until the promise is ready:

\`\`\`
async function main() {
  const result = await wait(100);
  console.log(result);   // "done"
}
main();
\`\`\``,
    task: 'Write `sendRaven(message)` that returns a Promise which, after 200 ms, resolves to `"Delivered: " + message`. Then, in an async `main`, await `sendRaven("Help!")` and print the reply.',
    sage: 'This is how `fetch()` works: `const res = await fetch(url); const data = await res.json();`. Code that runs "later" is called *asynchronous*. Forgetting `await` is one of the most common bugs in real projects: you get a Promise object instead of the value.',
    hints: ['`return new Promise((resolve) => { setTimeout(() => resolve("Delivered: " + message), 200); });`', '`async function main() { const reply = await sendRaven("Help!"); console.log(reply); } main();`'],
    starter: 'function sendRaven(message) {\n  // return a Promise here\n}\n\nasync function main() {\n  // await a raven and print the reply\n}\n\nmain();\n',
    solution: 'function sendRaven(message) {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve("Delivered: " + message), 200);\n  });\n}\n\nasync function main() {\n  const reply = await sendRaven("Help!");\n  console.log(reply);\n}\n\nmain();\n',
    probe: 'const p = sendRaven("Hi"); const isPromise = p instanceof Promise; const r = isPromise ? await p : p; return { isPromise, r };',
    checks: [
      { label: 'sendRaven returns a Promise', test: (c) => c.values.isPromise === true },
      { label: 'It resolves to "Delivered: <message>"', test: (c) => c.values.r === 'Delivered: Hi' },
      { label: 'Prints "Delivered: Help!"', test: (c) => c.logs.includes('Delivered: Help!') },
      { label: 'Use await', test: (c) => uses(c.code, /\bawait\b/) },
    ],
  },
];

const boss: GridLesson = {
  id: 'js-18', kingdom: 'js', kind: 'grid', lang: 'js', region: 'The Goblin Gauntlet', xp: 150, boss: true,
  title: 'The Goblin Gauntlet',
  concepts: ['functions with parameters', 'loops', 'conditions'],
  story: 'The Goblin King has built a gauntlet: a long path full of goblins, gems and a locked door. Only a hero who combines **loops, conditions and functions** can clear it.',
  learn: `\`hero.move(direction)\` takes the direction as a string: \`"up"\`, \`"down"\`, \`"left"\` or \`"right"\`. That means you can write **one** function that works for any direction:

\`\`\`
function walk(dir, steps) {
  for (let i = 0; i < steps; i++) {
    // check for goblins here...
    hero.move(dir);
  }
}
\`\`\``,
  task: 'Collect all gems, defeat every goblin, grab the key and reach the gate. The path goes right, down, then left.',
  sage: 'Parameters make functions flexible: one `walk(dir, steps)` replaces four nearly identical functions. Finding the right *parameters* for a function is one of the core skills of software design.',
  hints: ['Inside `walk`, before moving: `if (hero.look(dir) === "goblin") { hero.attack(dir); }`', 'Then call `walk("right", 10); walk("down", 2); walk("left", 10);`'],
  map: [
    '#############',
    '#H,g,*,g,*,k#',
    '###########,#',
    '#E,,*,g,D,,,#',
    '#############',
  ],
  starter: '// Plan: right, down, then left.\n\n',
  solution: 'function walk(dir, steps) {\n  for (let i = 0; i < steps; i++) {\n    if (hero.look(dir) === "goblin") {\n      hero.attack(dir);\n    }\n    hero.move(dir);\n  }\n}\n\nwalk("right", 10);\nwalk("down", 2);\nwalk("left", 10);\n',
  goals: { gems: 'all', goblins: 'all', exit: true },
  checks: [
    { label: 'Define a function with parameters', test: (c) => uses(c.code, /function\s+\w+\s*\(\s*\w+|(const|let)\s+\w+\s*=\s*\(\s*\w+[^)]*\)\s*=>/) },
    { label: 'Use a loop', test: (c) => uses(c.code, /\b(for|while)\s*\(/) },
  ],
  parLines: 12,
};


const extra: WebLesson[] = [
  {
    id: 'js-19', kingdom: 'js', kind: 'web', mode: 'html', region: 'The Village of Events', xp: 90,
    title: 'The Saved Quest List',
    concepts: ['localStorage', 'JSON.stringify', 'JSON.parse'],
    story: 'Every night the village forgets its quests, because the page reloads. The wise woman teaches you a spell that remembers.',
    learn: `\`localStorage\` saves text in the browser, even after a reload:

\`\`\`
localStorage.setItem("name", "Ada");
localStorage.getItem("name");   // "Ada"
\`\`\`

It only stores **strings**, so turn arrays into text with JSON:

\`\`\`
localStorage.setItem("quests", JSON.stringify(quests));
const saved = JSON.parse(localStorage.getItem("quests") ?? "[]");
\`\`\``,
    task: 'Keep the quests in an array. When `#add` is clicked, add the text of `#quest`, **save** the array in localStorage under the key `"quests"`, and show it in `#list`. When the page loads, show the saved quests.',
    sage: 'localStorage is perfect for small things like settings, drafts or a theme choice. It is not secure (any script on the page can read it), so never store passwords or tokens there. For bigger data, browsers have IndexedDB.',
    hints: ['Start with `const quests = JSON.parse(localStorage.getItem("quests") ?? "[]");` and write a `render()` function that fills `#list`.', 'In the click handler: `quests.push(input.value); localStorage.setItem("quests", JSON.stringify(quests)); render();`'],
    files: [
      { name: 'script.js', lang: 'js', code: 'const input = document.querySelector("#quest");\nconst list = document.querySelector("#list");\nconst add = document.querySelector("#add");\n\n// 1. Load saved quests (or an empty array)\n\n// 2. Show them in the list\n\n// 3. Add + save when the button is clicked\n' },
      { name: 'index.html', lang: 'html', code: villageHtml('  <h1>Quests</h1>\n  <input id="quest" placeholder="New quest">\n  <button id="add">Add</button>\n  <ul id="list"></ul>'), readonly: true },
      { name: 'style.css', lang: 'css', code: villageCss, readonly: true },
    ],
    solution: { 'script.js': 'const input = document.querySelector("#quest");\nconst list = document.querySelector("#list");\nconst add = document.querySelector("#add");\n\nconst quests = JSON.parse(localStorage.getItem("quests") ?? "[]");\n\nfunction render() {\n  list.innerHTML = "";\n  for (const q of quests) {\n    const li = document.createElement("li");\n    li.textContent = q;\n    list.append(li);\n  }\n}\nrender();\n\nadd.addEventListener("click", () => {\n  if (!input.value.trim()) return;\n  quests.push(input.value);\n  localStorage.setItem("quests", JSON.stringify(quests));\n  input.value = "";\n  render();\n});\n' },
    checks: [
      { label: 'Adding "Find the goat" shows it in the list', test: async (c) => {
        c.win.localStorage.removeItem('quests');
        c.win.location.reload();
        await c.wait(500);
        const d = (c.win.frameElement as HTMLIFrameElement).contentDocument!;
        const w = d.defaultView!;
        const inp = d.querySelector('#quest') as HTMLInputElement;
        Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!.call(inp, 'Find the goat');
        inp.dispatchEvent(new w.Event('input', { bubbles: true }));
        (d.querySelector('#add') as HTMLElement).click();
        await c.wait(80);
        return Array.from(d.querySelectorAll('#list li')).some((l) => l.textContent === 'Find the goat');
      } },
      { label: 'The quests are saved in localStorage as JSON under "quests"', test: (c) => { try { const v = JSON.parse((c.win.frameElement as HTMLIFrameElement).contentWindow!.localStorage.getItem('quests') ?? 'null'); return Array.isArray(v) && v.includes('Find the goat'); } catch { return false; } } },
      { label: 'After a reload, the saved quest is still shown', test: async (c) => {
        const f = c.win.frameElement as HTMLIFrameElement;
        f.contentWindow!.location.reload();
        await c.wait(500);
        const ok = Array.from(f.contentDocument!.querySelectorAll('#list li')).some((l) => l.textContent === 'Find the goat');
        f.contentWindow!.localStorage.removeItem('quests');
        return ok;
      } },
    ],
  },
  {
    id: 'js-20', kingdom: 'js', kind: 'web', mode: 'html', region: 'The Village of Events', xp: 160, boss: true,
    title: 'The Quest Board App',
    concepts: ['everything so far', 'state + render', 'event delegation'],
    story: 'The village elders want a real app, built with plain JavaScript: add quests, mark them done, and always know how many are left.',
    learn: `Project time! A common pattern for small apps without a framework:

1. Keep the data in an array: the **state**
2. Write one \`render()\` function that draws the page from the state
3. In every event handler: change the state, then call \`render()\`

\`\`\`
const quests = [];   // { title, done }
function render() { /* rebuild the list from quests */ }
\`\`\`

This is exactly the idea that React, Vue and Svelte automate for you.`,
    task: `Build the quest board:
- \`#add\` adds the text of \`#quest\` as a new quest (ignore empty text) and clears the input
- each quest is an \`<li>\` in \`#list\` with its title and a **Done** button
- clicking **Done** toggles the class \`done\` on that \`<li>\`
- \`#left\` shows **N left** (quests not done)`,
    sage: 'Rebuilding the whole list on every change is simple and fast enough for small apps. Frameworks do the same thing, but smarter: they compare the old and new UI and only touch what changed.',
    hints: ['State: `const quests = [];` Each quest: `{ title: input.value, done: false }`. In `render()`: clear the list, loop, create an `li` and a `button`.', 'Inside the loop: `btn.addEventListener("click", () => { q.done = !q.done; render(); });` and `if (q.done) li.classList.add("done");`'],
    files: [
      { name: 'script.js', lang: 'js', code: 'const input = document.querySelector("#quest");\nconst list = document.querySelector("#list");\nconst left = document.querySelector("#left");\n\nconst quests = [];\n\nfunction render() {\n  // draw everything from the quests array\n}\n\n// add button\n' },
      { name: 'index.html', lang: 'html', code: villageHtml('  <h1>The Quest Board</h1>\n  <input id="quest" placeholder="New quest">\n  <button id="add">Add</button>\n  <p id="left">0 left</p>\n  <ul id="list"></ul>'), readonly: true },
      { name: 'style.css', lang: 'css', code: villageCss + '.done { text-decoration: line-through; opacity: 0.6; }\n', readonly: true },
    ],
    solution: { 'script.js': 'const input = document.querySelector("#quest");\nconst list = document.querySelector("#list");\nconst left = document.querySelector("#left");\n\nconst quests = [];\n\nfunction render() {\n  list.innerHTML = "";\n  for (const q of quests) {\n    const li = document.createElement("li");\n    li.textContent = q.title + " ";\n    if (q.done) li.classList.add("done");\n    const btn = document.createElement("button");\n    btn.textContent = "Done";\n    btn.addEventListener("click", () => {\n      q.done = !q.done;\n      render();\n    });\n    li.append(btn);\n    list.append(li);\n  }\n  left.textContent = quests.filter((q) => !q.done).length + " left";\n}\n\ndocument.querySelector("#add").addEventListener("click", () => {\n  const title = input.value.trim();\n  if (!title) return;\n  quests.push({ title, done: false });\n  input.value = "";\n  render();\n});\n\nrender();\n' },
    checks: [
      { label: 'Adding two quests shows two <li> items', test: async (c) => { await c.type('#quest', 'Slay the dragon'); await c.click('#add'); await c.type('#quest', 'Feed the goat'); await c.click('#add'); return c.$$('#list li').length === 2 && c.$$('#list li')[0].textContent!.includes('Slay the dragon'); } },
      { label: 'The input is cleared and "#left" says "2 left"', test: (c) => (c.$('#quest') as HTMLInputElement).value === '' && c.text('#left') === '2 left' },
      { label: 'Done toggles the class "done" and updates "1 left"', test: async (c) => { await c.click(c.$('#list li button')); const li = c.$$('#list li')[0]; return !!li?.classList.contains('done') && c.text('#left') === '1 left'; } },
      { label: 'Clicking Done again makes it active: "2 left"', test: async (c) => { await c.click(c.$('#list li button')); return !c.$$('#list li')[0]?.classList.contains('done') && c.text('#left') === '2 left'; } },
      { label: 'Empty text adds nothing', bonus: true, test: async (c) => { await c.type('#quest', '   '); await c.click('#add'); return c.$$('#list li').length === 2; } },
    ],
  },
];

export const jsLessons: Lesson[] = [...grid, ...consoleLessons, ...dom, boss, ...extra];
