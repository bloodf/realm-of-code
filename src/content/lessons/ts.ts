// The Runesmith's Forge: TypeScript. Type errors are "curses" found before the spell runs.
import type { Lesson } from '../types';
import { uses } from '../helpers';
import { eq } from '../../runners/format';

const CURSE = `When you cast a spell here, the **Runesmith** (the TypeScript compiler) checks your runes first. Type errors appear as *curses* with a red wavy line. Hover over the line to read them.`;

export const tsLessons: Lesson[] = [
  {
    id: 'ts-01', kingdom: 'ts', kind: 'console', lang: 'ts', region: 'The First Runes', xp: 60,
    title: 'Runes of Type',
    concepts: ['type annotations', 'number', 'string', 'boolean'],
    story: 'The Runesmith squints at your scroll. "This says gold is *lots*? Gold is counted in **numbers**, apprentice!"',
    learn: `TypeScript is JavaScript plus **types**. A type says what kind of value a variable holds:

\`\`\`
let gold: number = 100;
const heroName: string = "Ada";
let isBrave: boolean = true;
\`\`\`

If you put the wrong kind of value in, TypeScript shows an error **before** the code runs.

${CURSE}`,
    task: 'Lift the curse on `gold` by giving it a number. Then add the type runes `: string` to `heroName` and `: boolean` to `isBrave`.',
    sage: 'TypeScript can often *infer* types: `let gold = 100` is already a `number`, so annotations on simple variables are optional. Types disappear when the code runs (browsers run the JavaScript output), so they cost nothing at runtime. Their value is catching bugs early and giving your editor great autocomplete.',
    hints: ['Replace `"lots"` with a number, like `100`.', '`const heroName: string = "Ada";` and `let isBrave: boolean = true;`'],
    starter: 'let gold: number = "lots";\nconst heroName = "Ada";\nlet isBrave = true;\n\nconsole.log(heroName, gold, isBrave);\n',
    solution: 'let gold: number = 100;\nconst heroName: string = "Ada";\nlet isBrave: boolean = true;\n\nconsole.log(heroName, gold, isBrave);\n',
    probe: 'return { gold, heroName, isBrave };',
    checks: [
      { label: 'gold is a number', test: (c) => typeof c.values.gold === 'number' },
      { label: 'heroName has the : string rune', test: (c) => uses(c.code, /heroName\s*:\s*string/) },
      { label: 'isBrave has the : boolean rune', test: (c) => uses(c.code, /isBrave\s*:\s*boolean/) },
    ],
  },
  {
    id: 'ts-02', kingdom: 'ts', kind: 'console', lang: 'ts', region: 'The First Runes', xp: 65,
    title: 'Runes on Functions',
    concepts: ['parameter types', 'return types'],
    story: 'An old damage formula has no runes at all. Anyone could call it with anything, even `damage("banana", true)`!',
    learn: `Functions get types on their **parameters** and on their **return value**:

\`\`\`
function heal(hp: number, amount: number): number {
  return hp + amount;
}
\`\`\`

In strict TypeScript, a parameter without a type is an error (it would be \`any\`, which means "anything goes").

\`Math.max(0, x)\` gives the bigger of the two numbers, so it never goes below 0.`,
    task: 'Add types to `damage(attack, armor)` so it returns a `number`, and make sure it never returns less than **0**. Then write `greet(name: string): string` that returns `"Hail, <name>!"`.',
    sage: 'Typed function signatures are like contracts: callers know exactly what to pass and what they get back. In big codebases this is the main reason teams adopt TypeScript. Your editor will also show the signature as you type a call.',
    hints: ['`function damage(attack: number, armor: number): number { ... }`', '`return Math.max(0, attack - armor);` and ``function greet(name: string): string { return `Hail, ${name}!`; }``'],
    starter: 'function damage(attack, armor) {\n  return attack - armor;\n}\n\n// write greet here\n\nconsole.log(damage(10, 3));\n',
    solution: 'function damage(attack: number, armor: number): number {\n  return Math.max(0, attack - armor);\n}\n\nfunction greet(name: string): string {\n  return `Hail, ${name}!`;\n}\n\nconsole.log(damage(10, 3));\nconsole.log(greet("Ada"));\n',
    probe: 'return { d1: damage(10, 3), d2: damage(2, 5), g: typeof greet === "function" ? greet("Bo") : null };',
    checks: [
      { label: 'damage(10, 3) is 7', test: (c) => c.values.d1 === 7 },
      { label: 'damage never goes below 0', test: (c) => c.values.d2 === 0 },
      { label: 'greet("Bo") returns "Hail, Bo!"', test: (c) => c.values.g === 'Hail, Bo!' },
      { label: 'Both functions declare a return type', test: (c) => (c.code.match(/\)\s*:\s*(number|string)\s*\{/g) ?? []).length >= 2 },
    ],
  },
  {
    id: 'ts-03', kingdom: 'ts', kind: 'console', lang: 'ts', region: 'The First Runes', xp: 70,
    title: 'The Shape of a Hero',
    concepts: ['interfaces', 'optional properties'],
    story: 'The guild wants every hero record to have the same shape. No more heroes without names!',
    learn: `An **interface** describes the shape of an object:

\`\`\`
interface Hero {
  name: string;
  level: number;
  title?: string;    // ? means optional
}

const ada: Hero = { name: "Ada", level: 3 };
\`\`\`

Inside a function you can check an optional property before using it: \`if (hero.title) { ... }\`.`,
    task: 'Fill in the `Hero` interface (`name`, `level` and an optional `title`). Then make `describe` put the title in front when there is one: `"Sir Cy (level 9)"`, otherwise `"Ada (level 3)"`.',
    sage: '`interface` and `type` aliases can both describe objects. Interfaces can be extended (`interface Knight extends Hero`) and merged; `type` can also describe unions and other shapes. Many teams simply pick one style and stay consistent.',
    hints: ['`interface Hero { name: string; level: number; title?: string; }`', 'In `describe`: ``const who = hero.title ? `${hero.title} ${hero.name}` : hero.name;``'],
    starter: 'interface Hero {\n  // describe the shape here\n}\n\nfunction describe(hero: Hero): string {\n  return `${hero.name} (level ${hero.level})`;\n}\n\nconst ada: Hero = { name: "Ada", level: 3 };\nconsole.log(describe(ada));\n',
    solution: 'interface Hero {\n  name: string;\n  level: number;\n  title?: string;\n}\n\nfunction describe(hero: Hero): string {\n  const who = hero.title ? `${hero.title} ${hero.name}` : hero.name;\n  return `${who} (level ${hero.level})`;\n}\n\nconst ada: Hero = { name: "Ada", level: 3 };\nconsole.log(describe(ada));\nconsole.log(describe({ name: "Cy", level: 9, title: "Sir" }));\n',
    probe: 'return { a: describe({ name: "Bo", level: 1 }), b: describe({ name: "Cy", level: 9, title: "Sir" }) };',
    checks: [
      { label: 'The interface has name, level and optional title', test: (c) => uses(c.code, /name\s*:\s*string/) && uses(c.code, /level\s*:\s*number/) && uses(c.code, /title\s*\?\s*:\s*string/) },
      { label: 'describe without a title: "Bo (level 1)"', test: (c) => c.values.a === 'Bo (level 1)' },
      { label: 'describe with a title: "Sir Cy (level 9)"', test: (c) => c.values.b === 'Sir Cy (level 9)' },
    ],
  },
  {
    id: 'ts-04', kingdom: 'ts', kind: 'grid', lang: 'ts', region: 'The First Runes', xp: 75,
    title: 'The Rune of Directions',
    concepts: ['union types', 'literal types', 'typed arrays'],
    story: 'Deep in the forge, your hero follows a path written on a scroll. But a careless scribe made a **typo**, and without runes, nobody notices until the hero is lost.',
    learn: `A **union type** lists the only values allowed:

\`\`\`
type Direction = "up" | "down" | "left" | "right";
const path: Direction[] = ["right", "down"];
\`\`\`

\`Direction[]\` means "an array of Directions". Now a typo like \`"rigth"\` is caught by the Runesmith before your hero takes a single step.

${CURSE}`,
    task: 'Fix the typo in the path, then complete it so the hero reaches the gate.',
    sage: 'Without TypeScript, the typo would only fail *while the program runs*, maybe in front of a customer. With literal union types the editor even autocompletes the allowed values. This "make wrong states impossible" idea is one of the most useful habits in professional TypeScript.',
    hints: ['The typo is `"rigth"`. After fixing it, look at the map: right 2, down 1, right 2, down 2.', '`["right", "right", "down", "right", "right", "down", "down"]`'],
    map: [
      '#######',
      '#H,,#.#',
      '#..,,,#',
      '#.#.#,#',
      '#...#E#',
      '#######',
    ],
    starter: 'type Direction = "up" | "down" | "left" | "right";\n\nconst path: Direction[] = ["right", "right", "down", "rigth"];\n\nfor (const step of path) {\n  hero.move(step);\n}\n',
    solution: 'type Direction = "up" | "down" | "left" | "right";\n\nconst path: Direction[] = ["right", "right", "down", "right", "right", "down", "down"];\n\nfor (const step of path) {\n  hero.move(step);\n}\n',
    goals: { exit: true },
    checks: [{ label: 'The path is typed as Direction[]', test: (c) => uses(c.code, /:\s*Direction\[\]/) }],
  },
  {
    id: 'ts-05', kingdom: 'ts', kind: 'console', lang: 'ts', region: "The Master's Anvil", xp: 75,
    title: 'Maybe There, Maybe Not',
    concepts: ['undefined', 'narrowing', 'optional chaining', 'nullish coalescing'],
    story: 'Not every knight owns a horse, and some knights do not exist at all. The old code crashes at the stables.',
    learn: `\`find\` returns \`undefined\` when nothing matches, so its type is \`Knight | undefined\`. TypeScript will not let you use it until you **check**:

\`\`\`
const knight = findKnight("Bo");
if (!knight) return "nobody";   // narrowing
knight.name;                     // safe now
\`\`\`

Shortcuts:
- \`knight?.horse\` gives \`undefined\` instead of crashing (*optional chaining*)
- \`value ?? "default"\` uses the default when value is null or undefined`,
    task: 'Make `horseName(name)` return the horse name in CAPITALS, or `"NO HORSE"` when the knight does not exist or has no horse.',
    sage: '"Cannot read properties of undefined" is the most common JavaScript error in production. With `strictNullChecks` (part of `strict`), TypeScript forces you to handle those cases. Tony Hoare, who invented null references, called them his "billion-dollar mistake".',
    hints: ['`if (!knight || !knight.horse) return "NO HORSE";`', 'Or in one line: `return knight?.horse?.toUpperCase() ?? "NO HORSE";`'],
    starter: 'interface Knight {\n  name: string;\n  horse?: string;\n}\n\nconst knights: Knight[] = [\n  { name: "Ada", horse: "Thunder" },\n  { name: "Bo" },\n];\n\nfunction findKnight(name: string): Knight | undefined {\n  return knights.find((k) => k.name === name);\n}\n\nfunction horseName(name: string): string {\n  const knight = findKnight(name);\n  return knight.horse.toUpperCase();\n}\n\nconsole.log(horseName("Ada"));\n',
    solution: 'interface Knight {\n  name: string;\n  horse?: string;\n}\n\nconst knights: Knight[] = [\n  { name: "Ada", horse: "Thunder" },\n  { name: "Bo" },\n];\n\nfunction findKnight(name: string): Knight | undefined {\n  return knights.find((k) => k.name === name);\n}\n\nfunction horseName(name: string): string {\n  const knight = findKnight(name);\n  return knight?.horse?.toUpperCase() ?? "NO HORSE";\n}\n\nconsole.log(horseName("Ada"));\n',
    probe: 'return { a: horseName("Ada"), b: horseName("Bo"), c: horseName("Zed") };',
    checks: [
      { label: 'horseName("Ada") is "THUNDER"', test: (c) => c.values.a === 'THUNDER' },
      { label: 'A knight without a horse gives "NO HORSE"', test: (c) => c.values.b === 'NO HORSE' },
      { label: 'An unknown knight gives "NO HORSE"', test: (c) => c.values.c === 'NO HORSE' },
    ],
  },
  {
    id: 'ts-06', kingdom: 'ts', kind: 'console', lang: 'ts', region: "The Master's Anvil", xp: 80,
    title: 'Generic Chests',
    concepts: ['generics', 'type parameters', 'classes'],
    story: 'The forge makes chests for strings only. Now the King wants chests for gems (numbers), potions, anything! Forge one chest that fits all.',
    learn: `**Generics** are type *parameters*: placeholders filled in later. \`T\` is the usual name:

\`\`\`
function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}
last([1, 2, 3]);       // T is number
last(["a", "b"]);      // T is string
\`\`\`

Classes can be generic too:

\`\`\`
class Box<T> {
  private items: T[] = [];
  put(item: T): void { this.items.push(item); }
}
const gems = new Box<number>();
\`\`\``,
    task: 'Make `firstItem` generic, and make `Chest` a generic class `Chest<T>` with `add(item: T)`, `count()` and a new `takeAll(): T[]` that returns all items and leaves the chest empty.',
    sage: 'You already use generics every day: `Array<T>`, `Promise<T>`, `Map<K, V>`, React\'s `useState<T>`. Generics keep type safety without writing the same code for every type. Avoid reaching for `any`: it switches type checking off.',
    hints: ['`function firstItem<T>(items: T[]): T | undefined`', 'In `takeAll`: `const all = this.items; this.items = []; return all;`'],
    starter: 'function firstItem(items: string[]): string | undefined {\n  return items[0];\n}\n\nclass Chest {\n  private items: string[] = [];\n\n  add(item: string): void {\n    this.items.push(item);\n  }\n\n  count(): number {\n    return this.items.length;\n  }\n}\n\nconst first: number | undefined = firstItem([3, 1, 2]);\nconst gemChest = new Chest<number>();\ngemChest.add(42);\nconsole.log(first, gemChest.count());\n',
    solution: 'function firstItem<T>(items: T[]): T | undefined {\n  return items[0];\n}\n\nclass Chest<T> {\n  private items: T[] = [];\n\n  add(item: T): void {\n    this.items.push(item);\n  }\n\n  count(): number {\n    return this.items.length;\n  }\n\n  takeAll(): T[] {\n    const all = this.items;\n    this.items = [];\n    return all;\n  }\n}\n\nconst first: number | undefined = firstItem([3, 1, 2]);\nconst gemChest = new Chest<number>();\ngemChest.add(42);\nconsole.log(first, gemChest.count());\n',
    probe: 'const c = new Chest(); c.add(1); c.add(2); const n = c.count(); const all = typeof c.takeAll === "function" ? c.takeAll() : null; return { f1: firstItem([3, 1, 2]), f2: firstItem([]) === undefined, n, all, after: c.count() };',
    checks: [
      { label: 'firstItem is generic (<T>)', test: (c) => uses(c.code, /function\s+firstItem\s*<\s*\w+\s*>/) },
      { label: 'Chest is a generic class', test: (c) => uses(c.code, /class\s+Chest\s*<\s*\w+\s*>/) },
      { label: 'firstItem works ([3,1,2] → 3, [] → undefined)', test: (c) => c.values.f1 === 3 && c.values.f2 === true },
      { label: 'takeAll returns the items and empties the chest', test: (c) => c.values.n === 2 && eq(c.values.all, [1, 2]) && c.values.after === 0 },
    ],
  },
  {
    id: 'ts-07', kingdom: 'ts', kind: 'console', lang: 'ts', region: "The Master's Anvil", xp: 80,
    title: 'Classes of the Guild',
    concepts: ['classes', 'implements', 'private', 'constructor'],
    story: 'The guild takes new apprentices. Each one trains, gains experience and rises in rank.',
    learn: `A **class** is a blueprint for objects. It can promise to follow an interface with **implements**:

\`\`\`
interface Member {
  name: string;
  rank(): string;
}

class Guard implements Member {
  private xp = 0;                       // only usable inside the class
  constructor(public name: string) {}   // creates this.name

  rank(): string {
    return this.xp > 10 ? "Veteran" : "Recruit";
  }
}
\`\`\``,
    task: 'Create `class Apprentice implements Member`. Its constructor takes a `name`. It has a **private** `xp` starting at 0, a `train(amount: number)` method that adds xp, and `rank()` that returns `"Novice"` below 100 xp, `"Adept"` below 500, and `"Master"` from 500.',
    sage: '`private` is checked by TypeScript only; JavaScript also has real private fields with `#xp`. Classes are common in back-end code (services, controllers). Front-end code often prefers plain functions and objects. Know both styles.',
    hints: ['`class Apprentice implements Member { private xp = 0; constructor(public name: string) {} ... }`', '`rank(): string { if (this.xp < 100) return "Novice"; if (this.xp < 500) return "Adept"; return "Master"; }`'],
    starter: 'interface Member {\n  name: string;\n  rank(): string;\n}\n\n// class Apprentice implements Member { ... }\n\n',
    solution: 'interface Member {\n  name: string;\n  rank(): string;\n}\n\nclass Apprentice implements Member {\n  private xp = 0;\n\n  constructor(public name: string) {}\n\n  train(amount: number): void {\n    this.xp += amount;\n  }\n\n  rank(): string {\n    if (this.xp < 100) return "Novice";\n    if (this.xp < 500) return "Adept";\n    return "Master";\n  }\n}\n\nconst ada = new Apprentice("Ada");\nada.train(150);\nconsole.log(ada.name, ada.rank());\n',
    probe: 'const a = new Apprentice("Bo"); const r1 = a.rank(); a.train(150); const r2 = a.rank(); a.train(400); const r3 = a.rank(); return { name: a.name, r1, r2, r3 };',
    checks: [
      { label: 'Apprentice implements Member', test: (c) => uses(c.code, /class\s+Apprentice\s+implements\s+Member/) },
      { label: 'xp is private', test: (c) => uses(c.code, /private\s+xp|#xp/) },
      { label: 'The constructor stores the name', test: (c) => c.values.name === 'Bo' },
      { label: 'Ranks: Novice → Adept → Master', test: (c) => c.values.r1 === 'Novice' && c.values.r2 === 'Adept' && c.values.r3 === 'Master' },
    ],
  },
  {
    id: 'ts-08', kingdom: 'ts', kind: 'console', lang: 'ts', region: 'The Rune Inventory', xp: 140, boss: true,
    title: 'The Rune Inventory',
    concepts: ['everything so far'],
    story: 'The Master Runesmith tests you: build the forge\'s inventory system, with **not a single curse** on it.',
    learn: `Boss challenge! Use what you learned: union types, interfaces, typed functions and \`undefined\` handling.

A useful trick: \`reduce\` with a starting value of \`0\` sums numbers safely, even for an empty list.`,
    task: `Complete the inventory:
- \`interface Item\` with \`name\` (string), \`weight\` (number) and \`rarity\` (a \`Rarity\`)
- \`addItem(item: Item): void\` adds to \`inventory\`
- \`totalWeight(): number\`
- \`byRarity(rarity: Rarity): string[]\` returns the **names**
- \`heaviest(): Item | undefined\``,
    sage: 'This is what day-to-day TypeScript looks like: model your data with types, then write small, typed functions around it. Good types act as documentation that can never go out of date.',
    hints: ['`interface Item { name: string; weight: number; rarity: Rarity; }`', '`heaviest`: loop and keep the one with the biggest weight, starting from `undefined`.'],
    starter: 'type Rarity = "common" | "rare" | "legendary";\n\ninterface Item {\n  // name, weight, rarity\n}\n\nconst inventory: Item[] = [];\n\n// addItem, totalWeight, byRarity, heaviest\n',
    solution: 'type Rarity = "common" | "rare" | "legendary";\n\ninterface Item {\n  name: string;\n  weight: number;\n  rarity: Rarity;\n}\n\nconst inventory: Item[] = [];\n\nfunction addItem(item: Item): void {\n  inventory.push(item);\n}\n\nfunction totalWeight(): number {\n  return inventory.reduce((sum, item) => sum + item.weight, 0);\n}\n\nfunction byRarity(rarity: Rarity): string[] {\n  return inventory.filter((item) => item.rarity === rarity).map((item) => item.name);\n}\n\nfunction heaviest(): Item | undefined {\n  let best: Item | undefined = undefined;\n  for (const item of inventory) {\n    if (!best || item.weight > best.weight) best = item;\n  }\n  return best;\n}\n',
    probe: 'inventory.length = 0; const empty = { w: totalWeight(), h: heaviest() === undefined }; addItem({ name: "Sword", weight: 5, rarity: "common" }); addItem({ name: "Crown", weight: 2, rarity: "legendary" }); addItem({ name: "Wand", weight: 1, rarity: "rare" }); addItem({ name: "Orb", weight: 3, rarity: "rare" }); return { empty, total: totalWeight(), rare: byRarity("rare"), heavy: heaviest()?.name, count: inventory.length };',
    checks: [
      { label: 'Item uses the Rarity type', test: (c) => uses(c.code, /rarity\s*:\s*Rarity/) },
      { label: 'addItem adds items', test: (c) => c.values.count === 4 },
      { label: 'totalWeight is 11 (and 0 when empty)', test: (c) => c.values.total === 11 && (c.values.empty as { w: number }).w === 0 },
      { label: 'byRarity("rare") is ["Wand", "Orb"]', test: (c) => eq(c.values.rare, ['Wand', 'Orb']) },
      { label: 'heaviest() is the Sword (undefined when empty)', test: (c) => c.values.heavy === 'Sword' && (c.values.empty as { h: boolean }).h === true },
      { label: 'Functions have typed parameters and return types', test: (c) => uses(c.code, /byRarity\s*\(\s*rarity\s*:\s*Rarity\s*\)\s*:\s*string\[\]/) && uses(c.code, /heaviest\s*\(\s*\)\s*:\s*Item\s*\|\s*undefined/) },
    ],
  },
];
