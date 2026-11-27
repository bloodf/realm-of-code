// The Code Farm campaign: 30 levels in 5 chapters.
// Chapters 1-2 use drag-and-drop blocks, chapter 3 shows the code your blocks make,
// chapters 4-5 are typed JavaScript. Every level has a checked solution
// (scripts/verify-farm.ts proves each solution earns 3 stars and an empty program fails).
import type { Crop, FarmDef, FarmResult } from './sim.ts';
import { fieldOf } from './sim.ts';
import type { Stmt } from './program.ts';

export type Mode = 'blocks' | 'hybrid' | 'code';

export interface Goal { text: string; check: (r: FarmResult, lv: FarmLevel, code: string) => boolean }

export interface FarmLevel {
  id: string;
  n: number;
  chapter: number;
  title: string;
  mode: Mode;
  story: string;                               // what Farmer Bess says
  learn?: { title: string; body: string };     // a new idea, shown before the level
  farm: FarmDef;
  tools: string[];                             // blocks (or commands, in code mode) you can use
  goals: Goal[];
  par: number;                                 // blocks (blocks/hybrid) or lines of code (code) for the 3rd star
  solution: Stmt[] | string;
  starter?: string;                            // code mode
  hints: string[];
}

export const CHAPTERS = [
  { n: 1, title: 'First Furrows', sub: 'Commands and repeat loops, with blocks', color: '#6cb04a' },
  { n: 2, title: 'The Six-by-Six', sub: 'Loops inside loops', color: '#d8a040' },
  { n: 3, title: 'The Smart Farmer', sub: 'If, else and while. See the code your blocks make', color: '#3f8fd6' },
  { n: 4, title: 'Words of Power', sub: 'Type real JavaScript: for, if, variables, functions, arrays', color: '#8a56c9' },
  { n: 5, title: 'Master of the Valley', sub: 'Put it all together', color: '#c0462a' },
];

// ---------- goals ----------
const cellsOf = (r: FarmResult, lv: FarmLevel) => fieldOf(lv.farm.rows).map(([x, y]) => r.cells[y][x]);
const allPlanted = (crop: Crop = 'wheat'): Goal => ({ text: `Plant ${crop} on every farm tile`, check: (r, lv) => cellsOf(r, lv).every((c) => c.crop === crop) });
const allWet = (): Goal => ({ text: 'Water every crop', check: (r, lv) => cellsOf(r, lv).every((c) => !c.crop || c.wet) && cellsOf(r, lv).some((c) => c.crop) });
const harvested = (n: number, crop?: Crop): Goal => ({ text: `Harvest ${n} ${crop ?? 'crops'}`, check: (r) => (crop ? r.basket[crop] : r.basket.wheat + r.basket.carrot + r.basket.pumpkin) >= n });
const noWeeds = (): Goal => ({ text: 'Pull every weed', check: (r) => r.cells.every((row) => row.every((c) => !c.weed)) });
const noRot = (): Goal => ({ text: 'Do not harvest anything unripe', check: (r) => r.rotted === 0 });
const said = (v: string | number, text: string): Goal => ({ text, check: (r) => r.said.includes(String(v)) });
const uses = (re: RegExp, text: string): Goal => ({ text, check: (_r, _lv, code) => re.test(code.replace(/\/\/.*$/gm, '')) });
const pattern = (rows: string[]): Goal => ({
  text: 'Plant the crops in the pattern shown',
  check: (r) => rows.every((row, y) => [...row].every((ch, x) => ch === '?' || r.cells[y][x].crop === ({ w: 'wheat', c: 'carrot', p: 'pumpkin' } as Record<string, Crop>)[ch])),
});

// ---------- maps ----------
const field = (rows: number, cols: number, ch = '.', extra = '=') => [...Array.from({ length: rows }, () => ch.repeat(cols) + extra), '='.repeat(cols + 1)];
const count = (rows: string[], chars: string) => rows.join('').split('').filter((c) => chars.includes(c)).length;

const MESSY = ['x3.x3.=', '.3x..3=', '3.x.3x=', 'x..3.3=', '.3x.x.=', '3.x3..=', '======='];
const MIXED = ['3c1p3c=', 'p13cp1=', '======='];
const RIPE_ROW = ['32323332='];
const COUNT_ROW = ['32332232='];

export const LEVELS: FarmLevel[] = [
  // ---------------- Chapter 1: First Furrows ----------------
  {
    id: 'f1', n: 1, chapter: 1, title: 'A Seed in the Ground', mode: 'blocks',
    story: 'Welcome to Greenhollow Farm! Your farmer only does what the blocks say. Walk to the farmland and plant one seed.',
    learn: { title: 'Programs are instructions', body: 'A **program** is a list of instructions that run **one after another**, from top to bottom.\n\nDrag blocks under **when ▶ Run** to build your program, then press **Run**.' },
    farm: { rows: ['==.'], start: [0, 0] }, tools: ['move', 'plant'],
    goals: [allPlanted()], par: 3, solution: [['move', 'right'], ['move', 'right'], ['plant', 'wheat']],
    hints: ['The farmer stands on the left. The brown tile is farmland.', 'Move right two times, then plant.'],
  },
  {
    id: 'f2', n: 2, chapter: 1, title: 'A Row of Seeds', mode: 'blocks',
    story: 'Three tiles of good soil. Plant a seed on each one.',
    farm: { rows: ['...='], start: [0, 0] }, tools: ['move', 'plant'],
    goals: [allPlanted()], par: 5, solution: [['plant', 'wheat'], ['move', 'right'], ['plant', 'wheat'], ['move', 'right'], ['plant', 'wheat']],
    hints: ['Plant, then move right, then plant again...'],
  },
  {
    id: 'f3', n: 3, chapter: 1, title: 'Thirsty Seeds', mode: 'blocks',
    story: 'Seeds need water to grow. Give each seed a drink from your watering can.',
    farm: { rows: ['000='], start: [0, 0] }, tools: ['move', 'water'],
    goals: [allWet()], par: 5, solution: [['water'], ['move', 'right'], ['water'], ['move', 'right'], ['water']],
    hints: ['Water acts on the tile the farmer is standing on.'],
  },
  {
    id: 'f4', n: 4, chapter: 1, title: 'Day and Night', mode: 'blocks',
    story: 'A watered seed grows a little every night. Water it, sleep, and repeat until it is ripe. Then harvest!',
    learn: { title: 'How crops grow', body: '1. **water** the crop\n2. **sleep** until morning: every watered crop grows one step\n\nA seed needs **3 nights** to become ripe. Harvesting too early wastes the crop!' },
    farm: { rows: ['=0='], start: [0, 0] }, tools: ['move', 'water', 'sleep', 'harvest'],
    goals: [harvested(1, 'wheat'), noRot()], par: 8,
    solution: [['move', 'right'], ['water'], ['sleep'], ['water'], ['sleep'], ['water'], ['sleep'], ['harvest']],
    hints: ['Water, sleep, water, sleep, water, sleep... then harvest.', 'Soil dries out every night, so water again each day.'],
  },
  {
    id: 'f5', n: 5, chapter: 1, title: 'Repeat After Me', mode: 'blocks',
    story: 'That was a lot of blocks! The repeat block does the same thing many times. Grow this wheat with fewer blocks.',
    learn: { title: 'Loops', body: 'A **repeat** block runs the blocks inside it again and again.\n\n`repeat 3 times: water, sleep` does the same as six blocks in a row.\n\nProgrammers call this a **loop**. Loops make programs short.' },
    farm: { rows: ['=0='], start: [0, 0] }, tools: ['move', 'water', 'sleep', 'harvest', 'repeat'],
    goals: [harvested(1, 'wheat'), noRot()], par: 5,
    solution: [['move', 'right'], ['repeat', 3, [['water'], ['sleep']]], ['harvest']],
    hints: ['Put water and sleep inside a repeat 3 times block.'],
  },
  {
    id: 'f6', n: 6, chapter: 1, title: 'The Long Row', mode: 'blocks',
    story: 'Eight tiles of soil! Use a loop so you do not need sixteen blocks.',
    farm: { rows: ['........='], start: [0, 0] }, tools: ['move', 'plant', 'repeat'],
    goals: [allPlanted()], par: 3, solution: [['repeat', 8, [['plant', 'wheat'], ['move', 'right']]]],
    hints: ['What do you do on every tile? Plant, then move right. Repeat that 8 times.'],
  },
  {
    id: 'f7', n: 7, chapter: 1, title: 'Plant and Water', mode: 'blocks',
    story: 'Plant each seed and water it right away. One loop can do both.',
    farm: { rows: ['........='], start: [0, 0] }, tools: ['move', 'plant', 'water', 'repeat'],
    goals: [allPlanted(), allWet()], par: 4, solution: [['repeat', 8, [['plant', 'wheat'], ['water'], ['move', 'right']]]],
    hints: ['Three blocks go inside the loop: plant, water, move right.'],
  },
  {
    id: 'f8', n: 8, chapter: 1, title: 'Harvest Festival', mode: 'blocks',
    story: 'The wheat is golden and ripe. Bring it all in for the festival!',
    farm: { rows: ['33333333='], start: [0, 0] }, tools: ['move', 'harvest', 'repeat'],
    goals: [harvested(8, 'wheat'), noRot()], par: 3, solution: [['repeat', 8, [['harvest'], ['move', 'right']]]],
    hints: ['Same loop as before, with harvest inside.'],
  },

  // ---------------- Chapter 2: The Six-by-Six ----------------
  {
    id: 'f9', n: 9, chapter: 2, title: 'Two Rows', mode: 'blocks',
    story: 'Now the field has two rows. The "next row" block walks you down to the start of the next row.',
    learn: { title: 'Loops inside loops', body: 'You can put a **repeat inside a repeat**.\n\nThe inside loop plants **one row**. The outside loop does that **for every row**.\n\nThis is called a **nested loop**.' },
    farm: { rows: field(2, 6), start: [0, 0] }, tools: ['move', 'plant', 'nextRow', 'repeat'],
    goals: [allPlanted()], par: 5, solution: [['repeat', 2, [['repeat', 6, [['plant', 'wheat'], ['move', 'right']]], ['nextRow']]]],
    hints: ['Plant one row with a loop, then use next row.', 'Put all of that inside a repeat 2 times.'],
  },
  {
    id: 'f10', n: 10, chapter: 2, title: 'The Whole Field', mode: 'blocks',
    story: 'Six rows of six. Thirty-six seeds! A nested loop makes it easy.',
    farm: { rows: field(6, 6), start: [0, 0] }, tools: ['move', 'plant', 'nextRow', 'repeat'],
    goals: [allPlanted()], par: 5, solution: [['repeat', 6, [['repeat', 6, [['plant', 'wheat'], ['move', 'right']]], ['nextRow']]]],
    hints: ['It is the same program as Two Rows. Only one number changes.'],
  },
  {
    id: 'f11', n: 11, chapter: 2, title: 'Break New Ground', mode: 'blocks',
    story: 'This field is still grass. Till each tile to turn it into farmland, then plant.',
    farm: { rows: field(6, 6, ','), start: [0, 0] }, tools: ['move', 'till', 'plant', 'nextRow', 'repeat'],
    goals: [allPlanted()], par: 6, solution: [['repeat', 6, [['repeat', 6, [['till'], ['plant', 'wheat'], ['move', 'right']]], ['nextRow']]]],
    hints: ['On each tile: till, then plant, then move.'],
  },
  {
    id: 'f12', n: 12, chapter: 2, title: 'The Big Harvest', mode: 'blocks',
    story: 'Thirty-six ripe ears of wheat. Fill the barn!',
    farm: { rows: field(6, 6, '3'), start: [0, 0] }, tools: ['move', 'harvest', 'nextRow', 'repeat'],
    goals: [harvested(36, 'wheat'), noRot()], par: 5, solution: [['repeat', 6, [['repeat', 6, [['harvest'], ['move', 'right']]], ['nextRow']]]],
    hints: ['A nested loop again, with harvest inside.'],
  },
  {
    id: 'f13', n: 13, chapter: 2, title: 'Three Days of Rain', mode: 'blocks',
    story: 'No rain this week. Water the row, walk back, and sleep. Do it for three days, then harvest.',
    farm: { rows: ['000000='], start: [0, 0] }, tools: ['move', 'water', 'sleep', 'harvest', 'repeat'],
    goals: [harvested(6, 'wheat'), noRot()], par: 10,
    solution: [['repeat', 3, [['repeat', 6, [['water'], ['move', 'right']]], ['repeat', 6, [['move', 'left']]], ['sleep']]], ['repeat', 6, [['harvest'], ['move', 'right']]]],
    hints: ['One day: water the row, walk back left 6 times, sleep.', 'Repeat that day 3 times, then harvest the row.'],
  },

  // ---------------- Chapter 3: The Smart Farmer (blocks + code view) ----------------
  {
    id: 'f14', n: 14, chapter: 3, title: 'Only the Thirsty Ones', mode: 'hybrid',
    story: 'Some seeds are already wet, and your can only holds 5 drinks. Water only the dry ones.',
    learn: { title: 'If: making decisions', body: 'An **if** block only runs the blocks inside it **when its question is true**.\n\n`if dry? then water` waters dry tiles and skips wet ones.\n\nLook at the code panel: every block is also a line of **JavaScript**.' },
    farm: { rows: ['04040040='], start: [0, 0], can: 5 }, tools: ['move', 'water', 'repeat', 'if', 'isDry'],
    goals: [allWet()], par: 5, solution: [['repeat', 8, [['if', ['isDry'], [['water']]], ['move', 'right']]]],
    hints: ['Wet tiles look darker. Use the "dry?" question inside an if.'],
  },
  {
    id: 'f15', n: 15, chapter: 3, title: 'Ripe or Not?', mode: 'hybrid',
    story: 'Harvest the golden wheat, and water the green wheat so it keeps growing.',
    learn: { title: 'If ... else', body: 'An **if / else** block has two paths:\n\n- if the question is **true**, run the first part\n- **else** (otherwise) run the second part' },
    farm: { rows: RIPE_ROW, start: [0, 0] }, tools: ['move', 'water', 'harvest', 'repeat', 'ifelse', 'isRipe'],
    goals: [harvested(count(RIPE_ROW, '3'), 'wheat'), allWet(), noRot()], par: 6,
    solution: [['repeat', 8, [['ifelse', ['isRipe'], [['harvest']], [['water']]], ['move', 'right']]]],
    hints: ['if ripe? harvest, else water. Then move right.'],
  },
  {
    id: 'f16', n: 16, chapter: 3, title: 'Weeds!', mode: 'hybrid',
    story: 'Weeds crept into the row. Pull them where you find them, then plant a seed on every tile.',
    farm: { rows: ['x..x.xx.='], start: [0, 0] }, tools: ['move', 'plant', 'pullWeed', 'repeat', 'if', 'hasWeed'],
    goals: [allPlanted(), noWeeds()], par: 6, solution: [['repeat', 8, [['if', ['hasWeed'], [['pullWeed']]], ['plant', 'wheat'], ['move', 'right']]]],
    hints: ['Only pull a weed if there is one. But plant on every tile.'],
  },
  {
    id: 'f17', n: 17, chapter: 3, title: 'Rows of Every Size', mode: 'hybrid',
    story: 'These rows have different lengths. A while loop keeps going as long as you are on farmland.',
    learn: { title: 'While loops', body: 'A **repeat** loop runs a fixed number of times.\n\nA **while** loop runs **as long as** its question is true. You do not need to know how many times!' },
    farm: { rows: ['......===', '...======', '........=', '========='], start: [0, 0] }, tools: ['move', 'plant', 'nextRow', 'repeat', 'while', 'isField'],
    goals: [allPlanted()], par: 6, solution: [['repeat', 3, [['while', ['isField'], [['plant', 'wheat'], ['move', 'right']]], ['nextRow']]]],
    hints: ['While on farmland: plant and move right.', 'Put that while loop and a next row inside repeat 3 times.'],
  },
  {
    id: 'f18', n: 18, chapter: 3, title: 'The Messy Field', mode: 'hybrid',
    story: 'Weeds, ripe wheat and empty soil, all mixed up. Clean it up, harvest, and plant fresh seeds everywhere.',
    farm: { rows: MESSY, start: [0, 0] }, tools: ['move', 'plant', 'harvest', 'pullWeed', 'nextRow', 'repeat', 'if', 'hasWeed', 'isRipe'],
    goals: [allPlanted(), harvested(count(MESSY, '3'), 'wheat'), noWeeds(), noRot()], par: 11,
    solution: [['repeat', 6, [['repeat', 6, [['if', ['hasWeed'], [['pullWeed']]], ['if', ['isRipe'], [['harvest']]], ['plant', 'wheat'], ['move', 'right']]], ['nextRow']]]],
    hints: ['Two if blocks on each tile: one for weeds, one for ripe wheat. Then plant.'],
  },

  // ---------------- Chapter 4: Words of Power (typed code) ----------------
  {
    id: 'f19', n: 19, chapter: 4, title: 'Your First Line of Code', mode: 'code',
    story: 'Time to write spells with words! Every block you used is also a line of code. Finish the program.',
    learn: { title: 'Blocks become words', body: 'Each block is a **command**: its name, brackets, and a semicolon.\n\n```\nmove("right");\nplant("wheat");\n```\nText like `"right"` goes inside quotes.' },
    farm: { rows: ['=....='], start: [0, 0] }, tools: ['move', 'plant'],
    goals: [allPlanted()], par: 8,
    starter: '// Each block is now a line of code.\n// Finish the program: plant all four tiles.\nmove("right");\nplant("wheat");\n',
    solution: 'move("right");\nplant("wheat");\nmove("right");\nplant("wheat");\nmove("right");\nplant("wheat");\nmove("right");\nplant("wheat");',
    hints: ['Copy the two lines and paste them three more times.'],
  },
  {
    id: 'f20', n: 20, chapter: 4, title: 'The For Loop', mode: 'code',
    story: 'Eight tiles again. In code, a repeat block is written as a for loop.',
    learn: { title: 'for loops', body: '```\nfor (let i = 0; i < 8; i++) {\n  plant("wheat");\n  move("right");\n}\n```\n- `let i = 0` starts a counter\n- `i < 8` keeps going while this is true\n- `i++` adds 1 after each round' },
    farm: { rows: ['........='], start: [0, 0] }, tools: ['move', 'plant'],
    goals: [allPlanted(), uses(/for\s*\(/, 'Use a for loop')], par: 3,
    starter: '// Write a for loop that runs 8 times.\n',
    solution: 'for (let i = 0; i < 8; i++) {\n  plant("wheat");\n  move("right");\n}',
    hints: ['for (let i = 0; i < 8; i++) { ... }', 'Inside the curly braces: plant, then move right.'],
  },
  {
    id: 'f21', n: 21, chapter: 4, title: 'Loops in Loops', mode: 'code',
    story: 'The whole field, in code. Put one for loop inside another.',
    farm: { rows: field(6, 6), start: [0, 0] }, tools: ['move', 'plant', 'nextRow'],
    goals: [allPlanted(), uses(/for[\s\S]*for/, 'Use a loop inside a loop')], par: 5,
    starter: '// One loop for the rows, one loop for the tiles in a row.\n// Use a different counter name inside: for (let col = 0; ...)\n',
    solution: 'for (let row = 0; row < 6; row++) {\n  for (let col = 0; col < 6; col++) {\n    plant("wheat");\n    move("right");\n  }\n  nextRow();\n}',
    hints: ['The inner loop plants one row. After it, call nextRow().', 'Give each loop its own counter: row and col.'],
  },
  {
    id: 'f22', n: 22, chapter: 4, title: 'If, in Code', mode: 'code',
    story: 'The weeds are back. Check each tile with if.',
    learn: { title: 'if statements', body: '```\nif (hasWeed()) {\n  pullWeed();\n}\n```\nThe question goes in round brackets. Questions like `hasWeed()` give back **true** or **false**.' },
    farm: { rows: ['x.xx..x.='], start: [0, 0] }, tools: ['move', 'plant', 'pullWeed', 'hasWeed'],
    goals: [allPlanted(), noWeeds(), uses(/if\s*\(/, 'Use an if statement')], par: 5,
    starter: 'for (let i = 0; i < 8; i++) {\n  // pull the weed if there is one, then plant\n\n  move("right");\n}\n',
    solution: 'for (let i = 0; i < 8; i++) {\n  if (hasWeed()) {\n    pullWeed();\n  }\n  plant("wheat");\n  move("right");\n}',
    hints: ['if (hasWeed()) { pullWeed(); }', 'Plant after the if, not inside it.'],
  },
  {
    id: 'f23', n: 23, chapter: 4, title: 'Count Your Crops', mode: 'code',
    story: 'Harvest the ripe wheat, and tell me how many you picked. A variable can count for you.',
    learn: { title: 'Variables', body: 'A **variable** is a box with a name that holds a value.\n\n```\nlet count = 0;   // make a box called count\ncount++;         // add 1 to it\nsay(count);      // the farmer says the number\n```' },
    farm: { rows: COUNT_ROW, start: [0, 0] }, tools: ['move', 'harvest', 'isRipe', 'say'],
    goals: [harvested(count(COUNT_ROW, '3'), 'wheat'), noRot(), said(count(COUNT_ROW, '3'), `Say how many you harvested (${count(COUNT_ROW, '3')})`)], par: 7,
    starter: 'let count = 0;\n\nfor (let i = 0; i < 8; i++) {\n  // harvest ripe wheat and add 1 to count\n\n  move("right");\n}\n\nsay(count);\n',
    solution: 'let count = 0;\nfor (let i = 0; i < 8; i++) {\n  if (isRipe()) {\n    harvest();\n    count++;\n  }\n  move("right");\n}\nsay(count);',
    hints: ['Inside an if (isRipe()) { ... } do two things: harvest(); and count++;'],
  },
  {
    id: 'f24', n: 24, chapter: 4, title: 'Write Your Own Command', mode: 'code',
    story: 'The next-row command is broken today! Write your own function called nextRow.',
    learn: { title: 'Functions', body: 'A **function** is a new command you make yourself.\n\n```\nfunction nextRow() {\n  move("down");\n  // walk back to the left...\n}\n\nnextRow();   // use it like any other command\n```' },
    farm: { rows: field(3, 6), start: [0, 0], off: ['nextRow'] }, tools: ['move', 'plant'],
    goals: [allPlanted(), uses(/function\s+nextRow\s*\(/, 'Write a function called nextRow')], par: 9,
    starter: 'function nextRow() {\n  // move down, then walk back left 6 tiles\n\n}\n\nfor (let row = 0; row < 3; row++) {\n  for (let col = 0; col < 6; col++) {\n    plant("wheat");\n    move("right");\n  }\n  nextRow();\n}\n',
    solution: 'function nextRow() {\n  move("down");\n  for (let i = 0; i < 6; i++) {\n    move("left");\n  }\n}\nfor (let row = 0; row < 3; row++) {\n  for (let col = 0; col < 6; col++) {\n    plant("wheat");\n    move("right");\n  }\n  nextRow();\n}',
    hints: ['Inside the function: move("down"); then a for loop that moves left 6 times.'],
  },
  {
    id: 'f25', n: 25, chapter: 4, title: 'Commands With Ingredients', mode: 'code',
    story: 'Wheat on the first row, carrots on the second, pumpkins on the third. One function can plant any crop.',
    learn: { title: 'Parameters', body: 'A function can take an **ingredient** (a parameter):\n\n```\nfunction plantRow(crop) {\n  // use crop here, like plant(crop);\n}\n\nplantRow("carrot");\n```' },
    farm: { rows: field(3, 6), start: [0, 0] }, tools: ['move', 'plant', 'nextRow'],
    goals: [pattern(['wwwwww', 'cccccc', 'pppppp']), uses(/function\s+\w+\s*\(\s*\w+/, 'Write a function with a parameter')], par: 8,
    starter: 'function plantRow(crop) {\n  // plant a whole row of crop, then go to the next row\n\n}\n\nplantRow("wheat");\n',
    solution: 'function plantRow(crop) {\n  for (let i = 0; i < 6; i++) {\n    plant(crop);\n    move("right");\n  }\n  nextRow();\n}\nplantRow("wheat");\nplantRow("carrot");\nplantRow("pumpkin");',
    hints: ['Inside the loop: plant(crop); with no quotes around crop.', 'Call plantRow three times with different crops.'],
  },
  {
    id: 'f26', n: 26, chapter: 4, title: 'Crop Rotation', mode: 'code',
    story: 'Wise farmers mix their crops: wheat, carrot, pumpkin, then again. Keep the crop names in an array.',
    learn: { title: 'Arrays', body: 'An **array** is a list of values:\n\n```\nconst crops = ["wheat", "carrot", "pumpkin"];\ncrops[0]  // "wheat"\ncrops[2]  // "pumpkin"\n```\n`i % 3` is the **remainder** after dividing by 3: it goes 0, 1, 2, 0, 1, 2...' },
    farm: { rows: ['......='], start: [0, 0] }, tools: ['move', 'plant'],
    goals: [pattern(['wcpwcp']), uses(/\[/, 'Use an array')], par: 4,
    starter: 'const crops = ["wheat", "carrot", "pumpkin"];\n\nfor (let i = 0; i < 6; i++) {\n  // plant the right crop from the array\n\n  move("right");\n}\n',
    solution: 'const crops = ["wheat", "carrot", "pumpkin"];\nfor (let i = 0; i < 6; i++) {\n  plant(crops[i % 3]);\n  move("right");\n}',
    hints: ['plant(crops[i % 3]);'],
  },

  // ---------------- Chapter 5: Master of the Valley ----------------
  {
    id: 'f27', n: 27, chapter: 5, title: 'The Thirsty Valley', mode: 'code',
    story: 'A long row and a small can: it holds only 3 drinks. The pond is right beside you. Refill when the can is empty.',
    learn: { title: 'Numbers and comparisons', body: '`waterLeft()` gives back a **number**: how much water is in the can.\n\n`===` asks "is it equal?":\n```\nif (waterLeft() === 0) {\n  refill();\n}\n```' },
    farm: { rows: ['~~~~~~~~~~~', '0000000000='], start: [0, 1], can: 3 }, tools: ['move', 'water', 'refill', 'waterLeft', 'isField'],
    goals: [allWet()], par: 5,
    starter: 'while (isField()) {\n  // refill when the can is empty, then water and move\n\n}\n',
    solution: 'while (isField()) {\n  if (waterLeft() === 0) refill();\n  water();\n  move("right");\n}',
    hints: ['Check the can before you water: if (waterLeft() === 0) refill();'],
  },
  {
    id: 'f28', n: 28, chapter: 5, title: 'The Market Count', mode: 'code',
    story: 'Harvest only the ripe crops in both rows, and tell the merchant how many you picked in total.',
    farm: { rows: MIXED, start: [0, 0] }, tools: ['move', 'harvest', 'isRipe', 'nextRow', 'say'],
    goals: [harvested(count(MIXED, '3cp')), noRot(), said(count(MIXED, '3cp'), `Say the total (${count(MIXED, '3cp')})`)], par: 9,
    starter: 'let total = 0;\n\n// two rows of six tiles\n\nsay(total);\n',
    solution: 'let total = 0;\nfor (let row = 0; row < 2; row++) {\n  for (let col = 0; col < 6; col++) {\n    if (isRipe()) {\n      harvest();\n      total++;\n    }\n    move("right");\n  }\n  nextRow();\n}\nsay(total);',
    hints: ['A nested loop, with an if (isRipe()) inside, that also counts.'],
  },
  {
    id: 'f29', n: 29, chapter: 5, title: 'Seasons', mode: 'code',
    story: 'Two rows of seeds and three dry days. Write a function that waters the field and brings you home. Then sleep, three times.',
    farm: { rows: field(2, 6, '0'), start: [0, 0] }, tools: ['move', 'water', 'sleep', 'harvest', 'nextRow'],
    goals: [harvested(12, 'wheat'), noRot()], par: 16,
    starter: 'function waterField() {\n  // water both rows, then walk back up to the start\n\n}\n\n// three days: water the field and sleep\n\n// then harvest both rows\n',
    solution: 'function waterField() {\n  for (let row = 0; row < 2; row++) {\n    for (let col = 0; col < 6; col++) {\n      water();\n      move("right");\n    }\n    nextRow();\n  }\n  move("up");\n  move("up");\n}\nfor (let day = 0; day < 3; day++) {\n  waterField();\n  sleep();\n}\nfor (let row = 0; row < 2; row++) {\n  for (let col = 0; col < 6; col++) {\n    harvest();\n    move("right");\n  }\n  nextRow();\n}',
    hints: ['After two nextRow() calls you are on the path below the field. Move up twice to get home.', 'for (let day = 0; day < 3; day++) { waterField(); sleep(); }'],
  },
  {
    id: 'f30', n: 30, chapter: 5, title: 'Master of the Valley', mode: 'code',
    story: 'The final test! A field of wild grass. Till it, plant wheat, carrots and pumpkins in rows, grow them for three days, and harvest everything.',
    farm: { rows: field(3, 6, ','), start: [0, 0] }, tools: ['move', 'till', 'plant', 'water', 'sleep', 'harvest', 'nextRow'],
    goals: [harvested(6, 'wheat'), harvested(6, 'carrot'), harvested(6, 'pumpkin'), noRot()], par: 22,
    starter: 'const crops = ["wheat", "carrot", "pumpkin"];\n\n// 1. till and plant: row 0 wheat, row 1 carrot, row 2 pumpkin\n// 2. three days of watering and sleeping\n// 3. harvest everything\n',
    solution: 'const crops = ["wheat", "carrot", "pumpkin"];\nfunction home() {\n  move("up");\n  move("up");\n  move("up");\n}\nfunction eachTile(action) {\n  for (let row = 0; row < 3; row++) {\n    for (let col = 0; col < 6; col++) {\n      action(row);\n      move("right");\n    }\n    nextRow();\n  }\n  home();\n}\neachTile((row) => {\n  till();\n  plant(crops[row]);\n});\nfor (let day = 0; day < 3; day++) {\n  eachTile(() => water());\n  sleep();\n}\neachTile(() => harvest());',
    hints: ['Write a function that visits every tile and comes home. You will use it three times.', 'Functions can take other functions as ingredients: eachTile(() => water());'],
  },
];

export const LEVEL_BY_ID: Record<string, FarmLevel> = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

/** Stars: 1 = goals done, 2 = no mistakes, 3 = short program (at most `par` blocks or lines). */
export function starsFor(lv: FarmLevel, goalsOk: boolean, mistakes: number, size: number) {
  if (!goalsOk) return 0;
  return 1 + (mistakes === 0 ? 1 : 0) + (size <= lv.par ? 1 : 0);
}
