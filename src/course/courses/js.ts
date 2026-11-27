// Section: JavaScript.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, order, bug, out, lesson, unit, challenge } from '../dsl';

export const js: Course = {
  id: 'js', title: 'JavaScript', realm: 'The Forest of Loops', color: '#d7a418', emblem: 'tree',
  desc: 'Programming from zero: commands, loops, variables, conditions, functions, arrays, objects, the DOM, async code and modern JavaScript.',
  units: [
    unit('js-u1', 'First Commands', 'Guide your hero with statements and function calls.', `
**Key ideas**
- A program is a list of **statements**, run from top to bottom.
- \`hero.moveRight()\` **calls** a function (a command). The \`()\` makes it run.
- Values inside the brackets are **arguments**: \`hero.moveRight(3)\`.
- Text after \`//\` is a **comment**; the computer ignores it.
- Spelling and capital letters matter: \`moveright\` is not \`moveRight\`.`, [
      lesson('js-1-1', 'Commands for your hero', [
        teach('Talking to your hero', 'In the Forest of Loops your hero obeys JavaScript **commands**:\n\n```\nhero.moveRight();\nhero.moveDown();\n```\nEach line is a **statement**. They run one after another, from top to bottom. The `()` brackets make the command happen.'),
        mc('What do the `()` in `hero.moveUp()` do?', ['They make the command run', 'They are decoration', 'They make it a comment', 'They end the program'], 0),
        order('Walk right twice, then down once', ['hero.moveRight();', 'hero.moveRight();', 'hero.moveDown();'], undefined, 'js'),
        bug('Which line will not work?', 'hero.moveRight();\nhero.moveright();\nhero.moveDown();', 2, 'JavaScript is case-sensitive: it must be `moveRight` with a capital R.'),
        tf('The computer runs statements from top to bottom.', true),
        fill('Move the hero up', 'hero.___();', ['moveUp'], ['up', 'moveup', 'MoveUp'], undefined, 'js'),
        teach('Arguments and comments', 'A value inside the brackets is an **argument**. It gives the command extra information:\n\n```\nhero.moveRight(4);   // walk 4 steps\n```\nEverything after `//` is a **comment**: a note for humans that the computer skips.'),
        mc('`hero.moveDown(3)` makes the hero...', ['Walk 3 steps down', 'Walk down, 3 times slower', 'Wait 3 seconds', 'Walk 3 steps right'], 0),
        mc('What does the computer do with `// go to the gate`?', ['Ignores it', 'Walks to the gate', 'Shows an error', 'Prints it'], 0),
      ]),
      challenge('js-01', 'Challenge: First Steps'),
      challenge('js-02', 'Challenge: Around the Old Oak'),
      challenge('js-03', 'Challenge: Steps with Numbers'),
      challenge('js-04', 'Challenge: Gems of the Glade'),
    ]),
    unit('js-u2', 'Loops and Decisions', 'Repeat with for and while, decide with if.', `
**Key ideas**
- \`for (let i = 0; i < 5; i++) { ... }\` repeats 5 times (i = 0, 1, 2, 3, 4).
- The three parts: start (\`let i = 0\`), condition (\`i < 5\`), update (\`i++\`).
- \`while (condition) { ... }\` repeats as long as the condition is true. Make sure it can become false!
- \`if (condition) { ... } else { ... }\` runs code only when the condition is true.
- \`===\` means "is equal", \`!==\` means "is not equal".`, [
      lesson('js-2-1', 'The for loop', [
        teach('Repeat without copying', '```\nfor (let i = 0; i < 3; i++) {\n  hero.moveRight();\n}\n```\n1. `let i = 0`: start a counter at 0\n2. `i < 3`: keep going while this is true\n3. `i++`: add 1 after each round\n\nThe code inside `{ }` runs **3 times** (i = 0, 1, 2).'),
        mc('How many times does this loop run? `for (let i = 0; i < 5; i++)`', ['5', '4', '6', 'Forever'], 0),
        mc('How many times does this loop run? `for (let i = 1; i <= 3; i++)`', ['3', '2', '4', '1'], 0),
        out('for (let i = 0; i < 3; i++) {\n  console.log(i);\n}', ['0\n1\n2', '1\n2\n3', '0\n1\n2\n3', '3'], 0),
        fill('Repeat 10 times', 'for (let i = 0; i ___ 10; i___) {\n  hero.moveRight();\n}', ['<', '++'], ['>', '--', '=', '=='], undefined, 'js'),
        match('Match the part of the loop', [['let i = 0', 'Start'], ['i < 10', 'Condition'], ['i++', 'Update'], ['{ ... }', 'Body that repeats']]),
        tf('`i++` is short for `i = i + 1`.', true),
      ]),
      challenge('js-05', 'Challenge: The Bridge of Seven Planks'),
      challenge('js-06', 'Challenge: Zig-Zag Stairs'),
      lesson('js-2-2', 'while and if', [
        teach('Repeat until...', '```\nwhile (hero.look("right") !== "tree") {\n  hero.moveRight();\n}\n```\nA **while** loop repeats *as long as* its condition is true. Use it when you don\'t know how many times to repeat.'),
        teach('Making decisions', '```\nif (hero.look("right") === "goblin") {\n  hero.attack("right");\n} else {\n  hero.moveRight();\n}\n```\n`===` means "is exactly equal to". The `else` part runs when the condition is false.'),
        mc('When should you use a `while` loop instead of `for`?', ['When you repeat until something happens, without knowing how many times', 'When you know the exact count', 'Never', 'Only with numbers'], 0),
        out('let n = 0;\nwhile (n < 3) {\n  n++;\n}\nconsole.log(n);', ['3', '2', '0', '4'], 0),
        bug('Which line makes this loop run forever?', 'let torches = 3;\nwhile (torches > 0) {\n  console.log("Burning");\n  torches++;\n}', 4, '`torches++` makes the number bigger, so `torches > 0` stays true forever. It should be `torches--`.'),
        out('const gold = 50;\nif (gold >= 100) {\n  console.log("Rich!");\n} else {\n  console.log("Keep saving");\n}', ['Keep saving', 'Rich!', 'Rich!\nKeep saving', 'Nothing'], 0),
        match('Match the operator', [['===', 'Is equal to'], ['!==', 'Is not equal to'], ['>=', 'Greater than or equal'], ['<', 'Less than']]),
      ]),
      challenge('js-07', 'Challenge: While the Path Is Clear'),
      challenge('js-08', 'Challenge: If a Goblin Blocks the Way'),
    ]),
    unit('js-u3', 'Variables and Types', 'Store values: numbers, strings and booleans.', `
**Key ideas**
- \`const name = "Ada";\` can never be reassigned. \`let gold = 10;\` can change. Avoid \`var\`.
- Types: **number** (\`42\`, \`3.5\`), **string** (\`"text"\`), **boolean** (\`true\`/\`false\`), plus \`undefined\` and \`null\`.
- Maths: \`+ - * /\`, \`%\` (remainder), \`**\` (power). \`gold += 5\` adds 5.
- Strings: \`"a" + "b"\` joins them; template literals: \`\\\`Hi \${name}\\\`\`. \`.length\`, \`.toUpperCase()\`.
- \`typeof x\` tells you the type. \`"5" + 3\` is \`"53"\` (text wins!), use \`Number("5")\`.`, [
      lesson('js-3-1', 'let and const', [
        teach('Boxes with labels', '**Variables** store values so you can use them later:\n\n```\nconst heroName = "Ada";   // const: never changes\nlet gold = 10;            // let: can change\ngold = gold + 5;          // now 15\n```\nUse `const` by default and `let` when the value must change.'),
        out('let gold = 10;\ngold = gold + 5;\nconsole.log(gold);', ['15', '10', '105', 'gold + 5'], 0),
        bug('Which line causes an error?', 'const level = 1;\nconsole.log(level);\nlevel = 2;', 3, 'A `const` can never be reassigned. Use `let` if it has to change.'),
        mc('Which keyword should you use for a value that will change?', ['let', 'const', 'change', 'var only'], 0),
        fill('Create a variable that will never change', '___ castle = "Blackstone";', ['const'], ['let', 'variable', 'fixed'], undefined, 'js'),
        tf('Variable names are case-sensitive: `gold` and `Gold` are different variables.', true),
        mc('Which variable name follows JavaScript style (camelCase)?', ['maxHealth', 'max_health', 'Max-Health', 'MAXHEALTH'], 0),
      ]),
      lesson('js-3-2', 'Numbers and maths', [
        teach('Doing sums', '```\n10 + 5    // 15\n10 - 5    // 5\n10 * 5    // 50\n10 / 4    // 2.5\n10 % 3    // 1  (the remainder)\n2 ** 3    // 8  (2 × 2 × 2)\n```\nShortcuts: `gold += 5` means `gold = gold + 5`. `lives--` subtracts 1.'),
        out('console.log(7 % 3);', ['1', '2', '2.33', '0'], 0),
        out('console.log(2 + 3 * 4);', ['14', '20', '24', '9'], 0, 'Multiplication happens before addition, like in maths class.'),
        out('let xp = 10;\nxp += 5;\nxp *= 2;\nconsole.log(xp);', ['30', '25', '20', '15'], 0),
        mc('How can you check if a number is even?', ['n % 2 === 0', 'n / 2 === 0', 'n * 2 === 0', 'n % 2 === 1'], 0, undefined, { codeOptions: true }),
        match('Match the operator', [['*', 'Multiply'], ['/', 'Divide'], ['%', 'Remainder'], ['**', 'Power']]),
        out('console.log(Math.round(4.6), Math.floor(4.6));', ['5 4', '4 5', '5 5', '4 4'], 0),
      ]),
      lesson('js-3-3', 'Strings', [
        teach('Working with text', 'Text is called a **string**. Use quotes `"..."` or `\'...\'`, or backticks for **template literals**:\n\n```\nconst name = "Ada";\nconst greeting = `Hail, ${name}!`;   // "Hail, Ada!"\nname.length          // 3\nname.toUpperCase()   // "ADA"\n```'),
        out('const name = "Ada";\nconsole.log(`Hail, ${name}!`);', ['Hail, Ada!', 'Hail, ${name}!', 'Hail, name!', 'Hail, "Ada"!'], 0),
        out('console.log("dragon".length);', ['6', '5', '7', 'dragon'], 0),
        out('console.log("Sword" + "fish");', ['Swordfish', 'Sword fish', 'Sword + fish', 'NaN'], 0),
        out('console.log("5" + 3);', ['53', '8', '5 3', 'Error'], 0, 'When one side is a string, `+` joins text instead of adding numbers.'),
        fill('Print the name in capitals', 'console.log(name.___());', ['toUpperCase'], ['upper', 'toCaps', 'UpperCase'], undefined, 'js'),
        mc('Which character starts a template literal?', ['` (backtick)', '" (double quote)', "' (single quote)", '$ (dollar)'], 0),
      ]),
      lesson('js-3-4', 'Booleans and types', [
        teach('true, false and friends', '- **boolean**: `true` or `false`\n- `undefined`: a variable with no value yet\n- `null`: "empty on purpose"\n\n`typeof` tells you the type:\n\n```\ntypeof 42        // "number"\ntypeof "hi"      // "string"\ntypeof true      // "boolean"\n```'),
        out('console.log(typeof "42");', ['string', 'number', '42', 'text'], 0),
        out('console.log(10 > 3);', ['true', 'false', '10', 'yes'], 0),
        out('let shield;\nconsole.log(shield);', ['undefined', 'null', '0', 'Error'], 0),
        match('Match the value with its type', [['42', 'number'], ['"42"', 'string'], ['false', 'boolean'], ['undefined', 'undefined']]),
        out('console.log(Number("7") + 3);', ['10', '73', 'NaN', '7 3'], 0, '`Number()` turns text into a number.'),
        tf('`null` and `undefined` both mean "no value", but `null` is usually set on purpose.', true),
      ]),
      challenge('js-11', "Challenge: The Scribe's First Words"),
    ]),
    unit('js-u4', 'Conditions and Logic', 'Comparisons, if/else, && || ! and truthy values.', `
**Key ideas**
- Comparisons give booleans: \`===\`, \`!==\`, \`>\`, \`<\`, \`>=\`, \`<=\`. Always use \`===\`, not \`==\`.
- \`if / else if / else\` picks one branch.
- Logic: \`&&\` (and), \`||\` (or), \`!\` (not).
- **Falsy** values: \`false, 0, "", null, undefined, NaN\`. Everything else is **truthy**.
- Ternary: \`cond ? a : b\`. \`switch\` for many fixed cases.`, [
      lesson('js-4-1', 'Comparing values', [
        teach('Questions with yes/no answers', '```\n5 === 5       // true\n5 === "5"     // false (different types)\n3 !== 4       // true\n10 >= 10      // true\n```\nAlways use `===` and `!==`. The old `==` converts types in surprising ways (`0 == ""` is `true`!).'),
        out('console.log(5 === "5");', ['false', 'true', 'Error', 'undefined'], 0),
        out('console.log(7 !== 7);', ['false', 'true', '0', '7'], 0),
        mc('Which comparison should you normally use?', ['===', '==', '=', '=>'], 0),
        bug('Which line has a classic mistake?', 'let hp = 0;\nif (hp = 0) {\n  console.log("Game over");\n}', 2, '`=` *assigns* a value. To compare, use `===`.'),
        mc('`age >= 18` is true when age is...', ['18 or more', 'More than 18 only', 'Less than 18', 'Exactly 18 only'], 0),
      ]),
      lesson('js-4-2', 'if, else if, else', [
        teach('Choosing a path', '```\nif (score >= 90) {\n  console.log("Gold medal");\n} else if (score >= 50) {\n  console.log("Silver medal");\n} else {\n  console.log("Try again");\n}\n```\nOnly the **first** true branch runs.'),
        out('const score = 75;\nif (score >= 90) {\n  console.log("Gold");\n} else if (score >= 50) {\n  console.log("Silver");\n} else {\n  console.log("Bronze");\n}', ['Silver', 'Gold', 'Bronze', 'Silver\nBronze'], 0),
        out('const hp = 0;\nif (hp > 0) {\n  console.log("Alive");\n} else {\n  console.log("Fallen");\n}', ['Fallen', 'Alive', 'Alive\nFallen', '0'], 0),
        order('Write: if it rains, print "Umbrella", otherwise print "Sun hat"', ['if (raining) {', '  console.log("Umbrella");', '} else {', '  console.log("Sun hat");', '}'], undefined, 'js'),
        tf('In an if / else if / else chain, several branches can run.', false, 'Only the first branch whose condition is true runs.'),
      ]),
      lesson('js-4-3', 'And, or, not', [
        teach('Combining conditions', '```\nhasKey && doorIsLocked   // both must be true\nisWeekend || isHoliday  // at least one true\n!isLocked               // the opposite\n```'),
        out('console.log(true && false);', ['false', 'true', 'undefined', 'Error'], 0),
        out('console.log(true || false);', ['true', 'false', 'undefined', 'truefalse'], 0),
        out('console.log(!true);', ['false', 'true', '!true', 'undefined'], 0),
        out('const gold = 30;\nconst hasMap = true;\nconsole.log(gold > 20 && hasMap);', ['true', 'false', '30', 'hasMap'], 0),
        teach('Truthy and falsy', 'In an `if`, any value is treated as true or false. These are **falsy**: `false`, `0`, `""` (empty string), `null`, `undefined`, `NaN`. Everything else is **truthy**, even `"0"` and `[]`.'),
        mc('Which value is falsy?', ['""', '"0"', '[]', '"false"'], 0, undefined, { codeOptions: true }),
        out('const name = "";\nif (name) {\n  console.log("Hello " + name);\n} else {\n  console.log("Who are you?");\n}', ['Who are you?', 'Hello ', 'Hello', 'Error'], 0),
      ]),
      lesson('js-4-4', 'Ternary and switch', [
        teach('Short decisions', '```\nconst label = gold > 100 ? "rich" : "poor";\n```\n`condition ? valueIfTrue : valueIfFalse`\n\nFor many fixed cases, `switch` can be clearer:\n\n```\nswitch (day) {\n  case "sat":\n  case "sun":\n    console.log("Weekend!");\n    break;\n  default:\n    console.log("Work day");\n}\n```'),
        out('const hp = 5;\nconsole.log(hp > 0 ? "alive" : "fallen");', ['alive', 'fallen', 'true', '5'], 0),
        fill('Pick "day" or "night"', 'const sky = isSunUp ___ "day" ___ "night";', ['?', ':'], ['&&', '||', ';'], undefined, 'js'),
        mc('In a `switch`, what does `break` do?', ['Stops running the switch', 'Crashes the program', 'Skips to the next case', 'Restarts the switch'], 0),
        out('const weapon = "bow";\nswitch (weapon) {\n  case "sword":\n    console.log("Slash");\n    break;\n  case "bow":\n    console.log("Shoot");\n    break;\n  default:\n    console.log("Punch");\n}', ['Shoot', 'Slash', 'Punch', 'Shoot\nPunch'], 0),
      ]),
    ]),
    unit('js-u5', 'Functions', 'Name, reuse and combine your spells.', `
**Key ideas**
- Declare: \`function greet(name) { return "Hi " + name; }\` Call: \`greet("Ada")\`.
- **Parameters** are the names in the declaration; **arguments** are the values you pass.
- \`return\` sends a value back and stops the function. Without it, you get \`undefined\`.
- Arrow functions: \`const double = (n) => n * 2;\`
- Default parameters: \`function heal(hp, amount = 10)\`.
- **Scope**: variables created inside a function (or a \`{ }\` block) only exist inside it.`, [
      lesson('js-5-1', 'Defining functions', [
        teach('Your own commands', '```\nfunction climb() {\n  hero.moveRight();\n  hero.moveUp();\n}\n\nclimb();   // run it\nclimb();   // and again\n```\nDefine once, call many times. Good names are verbs: `climb`, `openDoor`, `countGems`.'),
        order('Define a function that says hi, then call it', ['function sayHi() {', '  console.log("Hi!");', '}', 'sayHi();'], undefined, 'js'),
        out('function cheer() {\n  console.log("Huzzah!");\n}\ncheer();\ncheer();', ['Huzzah!\nHuzzah!', 'Huzzah!', 'cheer\ncheer', 'Nothing'], 0),
        mc('What happens if you define a function but never call it?', ['Nothing: its code never runs', 'It runs once automatically', 'An error appears', 'It runs forever'], 0),
        tf('Functions help you avoid repeating the same code (DRY: Don\'t Repeat Yourself).', true),
      ]),
      lesson('js-5-2', 'Parameters and return', [
        teach('Inputs and outputs', '```\nfunction add(a, b) {\n  return a + b;\n}\nconst total = add(2, 3);   // 5\n```\n- `a` and `b` are **parameters** (placeholders)\n- `2` and `3` are **arguments** (real values)\n- `return` gives a value back'),
        out('function double(n) {\n  return n * 2;\n}\nconsole.log(double(7));', ['14', '7', '72', 'undefined'], 0),
        out('function shout(word) {\n  word.toUpperCase();\n}\nconsole.log(shout("hi"));', ['undefined', 'HI', 'hi', 'Error'], 0, 'The function forgot `return`, so it gives back `undefined`.'),
        fill('Return the area of a rectangle', 'function area(width, height) {\n  ___ width * height;\n}', ['return'], ['print', 'give', 'output'], undefined, 'js'),
        match('Match the word', [['Parameter', 'Name in the function definition'], ['Argument', 'Value passed when calling'], ['return', 'Sends a value back'], ['Call', 'Running the function']]),
        out('function check(hp) {\n  if (hp <= 0) {\n    return "fallen";\n  }\n  return "standing";\n}\nconsole.log(check(0));', ['fallen', 'standing', 'fallen\nstanding', '0'], 0, '`return` also stops the function immediately.'),
      ]),
      lesson('js-5-3', 'Arrow functions and defaults', [
        teach('A shorter way', '```\n// the same function, three ways\nfunction triple(n) { return n * 3; }\nconst triple2 = (n) => { return n * 3; };\nconst triple3 = (n) => n * 3;   // one expression: return is automatic\n```\nDefault parameters give a value when none is passed:\n\n```\nfunction heal(hp, amount = 10) { return hp + amount; }\nheal(50);      // 60\n```'),
        out('const square = (n) => n * n;\nconsole.log(square(4));', ['16', '8', '4', 'n * n'], 0),
        out('function greet(name = "stranger") {\n  return "Hail, " + name;\n}\nconsole.log(greet());', ['Hail, stranger', 'Hail, undefined', 'Hail, ', 'Error'], 0),
        bug('Which line returns undefined by mistake?', 'const add = (a, b) => a + b;\nconst sub = (a, b) => { a - b };\nconst mul = (a, b) => a * b;', 2, 'With curly braces, an arrow function needs `return`: `{ return a - b; }`.'),
        fill('Write an arrow function that adds 1', 'const inc = (n) ___ n + 1;', ['=>'], ['->', '==', '>='], undefined, 'js'),
      ]),
      lesson('js-5-4', 'Scope', [
        teach('Where variables live', 'A variable made **inside** a function or a `{ }` block only exists there:\n\n```\nfunction loot() {\n  const gold = 50;\n}\nconsole.log(gold);   // ReferenceError: gold is not defined\n```\nVariables made outside are visible inside (but keep them to a minimum).'),
        mc('Why does `console.log(gold)` fail in the example?', ['gold only exists inside the function', 'gold is misspelled', 'console.log is broken', 'const values cannot be printed'], 0),
        out('let count = 0;\nfunction bump() {\n  count++;\n}\nbump();\nbump();\nconsole.log(count);', ['2', '0', '1', 'Error'], 0),
        out('const x = "outside";\nfunction show() {\n  const x = "inside";\n  console.log(x);\n}\nshow();', ['inside', 'outside', 'inside\noutside', 'Error'], 0),
        tf('A `let` variable declared inside an `if` block can be used after the block ends.', false),
      ]),
      challenge('js-09', 'Challenge: Teach Your Hero a Trick'),
      challenge('js-10', 'Challenge: The Locked Door'),
      challenge('js-13', "Challenge: The Hero's Sheet"),
      challenge('js-18', 'Project: The Goblin Gauntlet'),
    ]),
    unit('js-u6', 'Arrays', 'Lists of values: index, add, remove, loop.', `
**Key ideas**
- \`const bag = ["rope", "torch"];\` Index starts at **0**: \`bag[0]\` is \`"rope"\`.
- \`bag.length\` is the number of items; the last one is \`bag[bag.length - 1]\`.
- Add/remove: \`push\` (end), \`pop\` (end), \`unshift\` (start), \`shift\` (start).
- Search: \`includes(x)\`, \`indexOf(x)\` (-1 if missing). Copy part: \`slice(start, end)\`.
- Loop: \`for (const item of bag) { ... }\` or \`bag.forEach((item) => ...)\`.`, [
      lesson('js-6-1', 'Creating and reading arrays', [
        teach('Lists', '```\nconst knights = ["Ada", "Bo", "Cy"];\nknights[0]        // "Ada" (first)\nknights[2]        // "Cy"\nknights.length    // 3\n```\nArrays count from **0**. The last item is at `length - 1`.'),
        out('const gems = ["ruby", "emerald", "sapphire"];\nconsole.log(gems[1]);', ['emerald', 'ruby', 'sapphire', 'undefined'], 0),
        out('const gems = ["ruby", "emerald", "sapphire"];\nconsole.log(gems.length);', ['3', '2', '4', 'sapphire'], 0),
        out('const gems = ["ruby", "emerald"];\nconsole.log(gems[2]);', ['undefined', 'emerald', 'Error', 'null'], 0),
        mc('How do you get the last item of any array `a`?', ['a[a.length - 1]', 'a[a.length]', 'a.last', 'a[-1]'], 0, undefined, { codeOptions: true }),
        fill('Change the first item to "axe"', 'weapons[___] = "axe";', ['0'], ['1', 'first', '-1'], undefined, 'js'),
      ]),
      lesson('js-6-2', 'Changing arrays', [
        teach('Add and remove', '```\nconst bag = ["rope"];\nbag.push("torch");     // add to the end   → ["rope", "torch"]\nbag.pop();             // remove the end   → ["rope"]\nbag.unshift("map");    // add to the start → ["map", "rope"]\nbag.shift();           // remove the start → ["rope"]\n```'),
        out('const q = ["a", "b"];\nq.push("c");\nconsole.log(q.length);', ['3', '2', 'c', '4'], 0),
        out('const q = ["a", "b", "c"];\nconst last = q.pop();\nconsole.log(last, q.length);', ['c 2', 'a 2', 'c 3', 'b 2'], 0),
        match('Match the method', [['push', 'Add to the end'], ['pop', 'Remove from the end'], ['unshift', 'Add to the start'], ['shift', 'Remove from the start']]),
        out('const bag = ["rope", "torch"];\nconsole.log(bag.includes("map"));', ['false', 'true', '-1', 'undefined'], 0),
        out('const bag = ["rope", "torch"];\nconsole.log(bag.indexOf("torch"));', ['1', '2', '0', 'true'], 0),
        out('const nums = [10, 20, 30, 40];\nconsole.log(nums.slice(1, 3));', ['[ 20, 30 ]', '[ 10, 20, 30 ]', '[ 20, 30, 40 ]', '20'], 0, '`slice(start, end)` copies from start up to (not including) end.'),
        tf('A `const` array can still have items pushed into it.', true, '`const` stops you replacing the whole array, not changing its contents.'),
      ]),
      lesson('js-6-3', 'Looping over arrays', [
        teach('Visit every item', '```\nconst party = ["Ada", "Bo"];\n\nfor (const name of party) {\n  console.log(name);\n}\n\nparty.forEach((name, i) => {\n  console.log(i, name);\n});\n```'),
        out('const party = ["Ada", "Bo", "Cy"];\nfor (const p of party) {\n  console.log(p);\n}', ['Ada\nBo\nCy', 'Ada, Bo, Cy', '0\n1\n2', 'Cy'], 0),
        out('const prices = [3, 4, 5];\nlet total = 0;\nfor (const p of prices) {\n  total += p;\n}\nconsole.log(total);', ['12', '345', '5', '0'], 0),
        bug('Which line has an off-by-one bug?', 'const names = ["Ada", "Bo"];\nfor (let i = 0; i <= names.length; i++) {\n  console.log(names[i]);\n}', 2, 'Indexes go from 0 to length - 1, so use `<`, not `<=`. Otherwise it prints `undefined` at the end.'),
        fill('Print every quest', 'for (const quest ___ quests) {\n  console.log(quest);\n}', ['of'], ['in', 'from', 'at'], undefined, 'js'),
        out('const xs = ["a", "b"];\nxs.forEach((x, i) => console.log(i + x));', ['0a\n1b', 'a0\nb1', '0\n1', 'ab'], 0),
      ]),
      challenge('js-12', 'Challenge: Arrays of Supplies'),
    ]),
    unit('js-u7', 'Objects and JSON', 'Group data with properties; send it as JSON.', `
**Key ideas**
- \`const hero = { name: "Ada", level: 3 };\` Read with \`hero.name\` or \`hero["name"]\`.
- Add or change: \`hero.gold = 10;\` Remove: \`delete hero.gold\`.
- Methods are functions in objects: \`hero.greet()\`. Inside, \`this\` is the object.
- Destructuring: \`const { name, level } = hero;\` Spread copies: \`{ ...hero, level: 4 }\`.
- \`Object.keys(o)\`, \`Object.values(o)\`, \`Object.entries(o)\`.
- JSON: \`JSON.stringify(obj)\` → text, \`JSON.parse(text)\` → object. Keys need double quotes in JSON.`, [
      lesson('js-7-1', 'Properties', [
        teach('Named values', '```\nconst hero = {\n  name: "Ada",\n  level: 3,\n  skills: ["sword", "magic"],\n};\nhero.name          // "Ada"\nhero["level"]      // 3\nhero.level = 4;    // change\nhero.gold = 100;   // add a new property\n```'),
        out('const hero = { name: "Ada", level: 3 };\nconsole.log(hero.level);', ['3', 'level', 'Ada', 'undefined'], 0),
        out('const hero = { name: "Ada" };\nhero.level = 5;\nconsole.log(hero.level);', ['5', 'undefined', 'Error', '{ level: 5 }'], 0),
        out('const hero = { name: "Ada" };\nconsole.log(hero.gold);', ['undefined', 'null', '0', 'Error'], 0),
        out('const hero = { skills: ["sword", "magic"] };\nconsole.log(hero.skills[1]);', ['magic', 'sword', 'skills', 'undefined'], 0),
        mc('When must you use brackets instead of a dot?', ['When the property name is in a variable', 'Always', 'For numbers only', 'Never'], 0, 'Example: `const key = "level"; hero[key]`.'),
        fill('Read the name', 'console.log(hero___name);', ['.'], [':', '->', '#'], undefined, 'js'),
      ]),
      lesson('js-7-2', 'Methods and this', [
        teach('Functions inside objects', '```\nconst hero = {\n  name: "Ada",\n  hp: 10,\n  heal(amount) {\n    this.hp += amount;\n  },\n};\nhero.heal(5);   // hero.hp is now 15\n```\nInside a method, `this` means "the object the method was called on".'),
        out('const hero = {\n  name: "Ada",\n  greet() {\n    return "I am " + this.name;\n  },\n};\nconsole.log(hero.greet());', ['I am Ada', 'I am this.name', 'I am undefined', 'greet'], 0),
        out('const counter = {\n  n: 0,\n  add() {\n    this.n++;\n  },\n};\ncounter.add();\ncounter.add();\nconsole.log(counter.n);', ['2', '0', '1', 'NaN'], 0),
        tf('`console.log` is itself a method: the `log` function of the `console` object.', true),
      ]),
      lesson('js-7-3', 'Destructuring and spread', [
        teach('Unpack and copy', '```\nconst hero = { name: "Ada", level: 3 };\nconst { name, level } = hero;          // two new variables\n\nconst stronger = { ...hero, level: 4 }; // a copy with a change\nconst all = [...listA, ...listB];       // join arrays\n```'),
        out('const hero = { name: "Ada", level: 3 };\nconst { level } = hero;\nconsole.log(level);', ['3', 'level', 'Ada', 'undefined'], 0),
        out('const a = [1, 2];\nconst b = [...a, 3];\nconsole.log(b.length);', ['3', '2', '5', '1'], 0),
        out('const hero = { name: "Ada", level: 3 };\nconst copy = { ...hero, level: 9 };\nconsole.log(hero.level, copy.level);', ['3 9', '9 9', '3 3', '9 3'], 0, 'The spread makes a *copy*, so the original stays the same.'),
        out('const [first, second] = ["gold", "silver", "bronze"];\nconsole.log(second);', ['silver', 'gold', 'bronze', 'undefined'], 0),
        fill('Copy the settings and change the theme', 'const next = { ___settings, theme: "dark" };', ['...'], ['..', '*', '&'], undefined, 'js'),
      ]),
      lesson('js-7-4', 'JSON', [
        teach('Data as text', '**JSON** (JavaScript Object Notation) is how apps send data over the internet:\n\n```\n{ "name": "Ada", "level": 3, "skills": ["sword"] }\n```\nIn JSON, keys **must** use double quotes.\n\n```\nconst text = JSON.stringify(hero);   // object → text\nconst obj = JSON.parse(text);        // text → object\n```'),
        mc('Which is valid JSON?', ['{ "name": "Ada", "level": 3 }', "{ name: 'Ada', level: 3 }", '{ "name": "Ada", }', '{ name = "Ada" }'], 0, 'JSON needs double-quoted keys and strings, and no trailing comma.', { codeOptions: true }),
        out('const text = JSON.stringify({ a: 1 });\nconsole.log(typeof text);', ['string', 'object', 'number', 'json'], 0),
        out('const data = JSON.parse(\'{"gold": 42}\');\nconsole.log(data.gold + 8);', ['50', '428', 'NaN', '42'], 0),
        match('Match the function', [['JSON.stringify', 'Object → text'], ['JSON.parse', 'Text → object'], ['Object.keys', 'List of property names'], ['Object.values', 'List of values']]),
        out('console.log(Object.keys({ hp: 10, mp: 5 }));', ['[ "hp", "mp" ]', '[ 10, 5 ]', 'hp,mp', '2'], 0),
      ]),
    ]),
    unit('js-u8', 'Array Methods', 'map, filter, find, reduce, some, every and sort.', `
**Key ideas**
- \`map(fn)\`: a new array with every item changed.
- \`filter(fn)\`: a new array with only the items that pass.
- \`find(fn)\`: the first matching item (or \`undefined\`). \`findIndex\` gives its index.
- \`reduce((acc, x) => ..., start)\`: combine everything into one value.
- \`some\` (any pass?), \`every\` (all pass?), \`includes\`.
- \`sort((a, b) => a - b)\` sorts numbers (it changes the array!). These methods can be **chained**.`, [
      lesson('js-8-1', 'map', [
        teach('Change every item', '```\nconst prices = [1, 2, 3];\nconst doubled = prices.map((p) => p * 2);   // [2, 4, 6]\n\nconst names = knights.map((k) => k.name);\n```\n`map` always returns a **new** array of the same length.'),
        out('console.log([1, 2, 3].map((n) => n * 10));', ['[ 10, 20, 30 ]', '[ 1, 2, 3 ]', '60', '[ 10 ]'], 0),
        out('const heroes = [{ name: "Ada" }, { name: "Bo" }];\nconsole.log(heroes.map((h) => h.name));', ['[ "Ada", "Bo" ]', '[ { name: "Ada" }, { name: "Bo" } ]', 'Ada,Bo', '2'], 0),
        fill('Make every word uppercase', 'const loud = words.___((w) => w.toUpperCase());', ['map'], ['filter', 'find', 'reduce'], undefined, 'js'),
        tf('`map` changes the original array.', false, 'It returns a new array and leaves the original alone.'),
      ]),
      lesson('js-8-2', 'filter and find', [
        teach('Keep some, find one', '```\nconst nums = [5, 12, 8, 20];\nnums.filter((n) => n > 10);   // [12, 20]  all that pass\nnums.find((n) => n > 10);     // 12        the first that passes\nnums.find((n) => n > 99);     // undefined\n```'),
        out('console.log([3, 8, 1, 9].filter((n) => n > 5));', ['[ 8, 9 ]', '8', '[ 3, 1 ]', '[ 8 ]'], 0),
        out('console.log([3, 8, 1, 9].find((n) => n > 5));', ['8', '[ 8, 9 ]', '9', 'true'], 0),
        out('const items = [{ n: "sword", v: 50 }, { n: "nail", v: 1 }];\nconsole.log(items.filter((i) => i.v >= 10).length);', ['1', '2', '0', '50'], 0),
        match('Which method?', [['Keep all items that match', 'filter'], ['Get the first match', 'find'], ['Transform every item', 'map'], ['Check if any item matches', 'some']]),
        out('const ages = [12, 20, 35];\nconsole.log(ages.some((a) => a < 18), ages.every((a) => a < 18));', ['true false', 'false true', 'true true', 'false false'], 0),
      ]),
      lesson('js-8-3', 'reduce, sort and chains', [
        teach('Combine into one', '```\nconst total = [5, 10, 15].reduce((sum, n) => sum + n, 0);   // 30\n```\n`reduce` walks the array keeping a running result (`sum`), starting from `0`.\n\nSorting numbers needs a compare function:\n\n```\n[10, 2, 33].sort((a, b) => a - b);   // [2, 10, 33]\n```'),
        out('console.log([1, 2, 3, 4].reduce((acc, n) => acc + n, 0));', ['10', '24', '1234', '4'], 0),
        out('console.log([10, 2, 33].sort());', ['[ 10, 2, 33 ]', '[ 2, 10, 33 ]', '[ 33, 10, 2 ]', '[ 10, 33, 2 ]'], 0, 'Without a compare function, `sort` compares items as **text**, so "10" comes before "2".'),
        out('console.log([10, 2, 33].sort((a, b) => a - b));', ['[ 2, 10, 33 ]', '[ 10, 2, 33 ]', '[ 33, 10, 2 ]', '45'], 0),
        out('const loot = [5, 50, 500];\nconsole.log(loot.filter((v) => v > 10).map((v) => v / 10));', ['[ 5, 50 ]', '[ 50, 500 ]', '[ 0.5, 5, 50 ]', '55'], 0),
        order('Chain: keep even numbers, then double them', ['const result = nums', '  .filter((n) => n % 2 === 0)', '  .map((n) => n * 2);'], undefined, 'js'),
      ]),
      challenge('js-14', 'Challenge: Counting the Treasure'),
    ]),
    unit('js-u9', 'The DOM and Events', 'Change web pages with JavaScript.', `
**Key ideas**
- The **DOM** is the page as objects. \`document.querySelector("#id")\` finds one element; \`querySelectorAll(".x")\` finds all.
- Change it: \`el.textContent\`, \`el.classList.add/remove/toggle\`, \`el.style.color\`, \`el.setAttribute\`.
- Create: \`document.createElement("li")\`, then \`parent.append(li)\`. Remove: \`el.remove()\`.
- Events: \`el.addEventListener("click", () => { ... })\`. Form: listen to \`"submit"\` and call \`event.preventDefault()\`.
- Inputs: read \`input.value\`. Use \`textContent\` (not \`innerHTML\`) for user text to avoid XSS.
- \`localStorage.setItem/getItem\` saves strings in the browser.`, [
      lesson('js-9-1', 'Finding elements', [
        teach('The page as objects', 'The browser turns your HTML into the **DOM** (Document Object Model). JavaScript can find elements with CSS selectors:\n\n```\nconst title = document.querySelector("h1");\nconst bell = document.querySelector("#bell");\nconst cards = document.querySelectorAll(".card");   // all of them\n```'),
        mc('Which finds the element with `id="score"`?', ['document.querySelector("#score")', 'document.querySelector(".score")', 'document.find("score")', 'document.id.score'], 0, undefined, { codeOptions: true }),
        mc('What does `querySelector` return when nothing matches?', ['null', 'undefined', 'An empty array', 'An error'], 0),
        mc('Which gets **every** element with the class `gem`?', ['document.querySelectorAll(".gem")', 'document.querySelector(".gem")', 'document.getAll("gem")', 'document.gems'], 0, undefined, { codeOptions: true }),
        fill('Find the first button', 'const btn = document.___("button");', ['querySelector'], ['getElement', 'select', 'find'], undefined, 'js'),
      ]),
      lesson('js-9-2', 'Changing the page', [
        teach('Text, classes and styles', '```\nconst title = document.querySelector("h1");\ntitle.textContent = "Victory!";\ntitle.classList.add("gold");        // add a CSS class\ntitle.classList.toggle("hidden");   // add or remove\ntitle.style.color = "crimson";       // inline style\n```\nPrefer classes over inline styles: keep the looks in CSS.'),
        match('Match the code with what it does', [['el.textContent = "Hi"', 'Changes the text'], ['el.classList.add("x")', 'Adds a class'], ['el.classList.toggle("x")', 'Adds or removes a class'], ['el.remove()', 'Removes the element']]),
        mc('Which is safest for showing text a user typed?', ['el.textContent = userText', 'el.innerHTML = userText', 'document.write(userText)', 'eval(userText)'], 0, '`innerHTML` would run any HTML the user types: a security hole called XSS.', { codeOptions: true }),
        bug('Which line has a bug?', 'const box = document.querySelector(".box");\nbox.style.color = red;\nbox.textContent = "Done";', 2, 'CSS values are strings in JavaScript: `"red"` needs quotes. Without them, JS looks for a variable named `red`.'),
        fill('Hide the panel by adding a class', 'panel.___.add("hidden");', ['classList'], ['class', 'className', 'style'], undefined, 'js'),
      ]),
      lesson('js-9-3', 'Events', [
        teach('Reacting to people', '```\nconst bell = document.querySelector("#bell");\nbell.addEventListener("click", () => {\n  console.log("Ding!");\n});\n```\nOther events: `"input"` (typing), `"submit"` (forms), `"keydown"`, `"mouseover"`...'),
        mc('Which event fires when someone types in an input?', ['input', 'click', 'submit', 'load'], 0),
        bug('Which line runs the function too early?', 'function ring() { console.log("Ding"); }\nconst bell = document.querySelector("#bell");\nbell.addEventListener("click", ring());', 3, '`ring()` runs immediately. Pass the function itself: `addEventListener("click", ring)`.'),
        fill('React to clicks', 'button.___("click", () => {\n  count++;\n});', ['addEventListener'], ['onClick', 'listen', 'addEvent'], undefined, 'js'),
        teach('Forms', 'By default, submitting a form reloads the page. Stop that with `preventDefault`:\n\n```\nform.addEventListener("submit", (event) => {\n  event.preventDefault();\n  console.log(input.value);\n});\n```'),
        mc('Why call `event.preventDefault()` in a submit handler?', ['To stop the page from reloading', 'To clear the form', 'To submit twice', 'To disable the button'], 0),
      ]),
      lesson('js-9-4', 'Creating elements', [
        teach('Building with code', '```\nconst li = document.createElement("li");\nli.textContent = "Slay the dragon";\ndocument.querySelector("#list").append(li);\n```'),
        order('Add a new list item that says "Feed the goat"', ['const li = document.createElement("li");', 'li.textContent = "Feed the goat";', 'list.append(li);'], undefined, 'js'),
        mc('`document.createElement("li")` puts the new li on the page...', ['Only after you append it somewhere', 'Immediately at the top', 'At the end of <body>', 'Never'], 0),
        tf('`list.innerHTML = ""` removes everything inside the list.', true),
      ]),
      challenge('js-15', 'Challenge: Ring the Village Bell'),
      challenge('js-16', 'Challenge: The Notice Board'),
      lesson('js-9-5', 'Saving in the browser', [
        teach('localStorage', '```\nlocalStorage.setItem("theme", "dark");\nlocalStorage.getItem("theme");    // "dark"\nlocalStorage.removeItem("theme");\n```\nIt stores **strings** only. Use JSON for arrays and objects.'),
        mc('How do you save an array in localStorage?', ['localStorage.setItem("list", JSON.stringify(list))', 'localStorage.setItem("list", list)', 'localStorage.list = list', 'localStorage.save(list)'], 0, undefined, { codeOptions: true }),
        mc('What does `localStorage.getItem("missing")` return?', ['null', 'undefined', '""', 'An error'], 0),
        tf('localStorage is a safe place for passwords.', false, 'Any script on the page can read it. Never store secrets there.'),
      ]),
      challenge('js-19', 'Challenge: The Saved Quest List'),
    ]),
    unit('js-u10', 'Asynchronous JavaScript', 'Timers, promises and async/await.', `
**Key ideas**
- Some work takes time (timers, network). JavaScript keeps going and handles the result **later**.
- \`setTimeout(fn, ms)\` runs \`fn\` after a delay.
- A **Promise** is a value that arrives later: pending → fulfilled (or rejected).
- \`async function\` + \`await promise\` waits for the value in a readable way.
- Handle failures with \`try { ... } catch (err) { ... }\`.
- \`fetch(url)\` returns a promise (next section: APIs).`, [
      lesson('js-10-1', 'Later, not now', [
        teach('Asynchronous code', '```\nconsole.log("1. Send the raven");\nsetTimeout(() => {\n  console.log("3. The raven returns");\n}, 1000);\nconsole.log("2. Eat dinner");\n```\nJavaScript does **not** stop and wait. It schedules the timer and continues. The timer runs later.'),
        out('console.log("A");\nsetTimeout(() => console.log("B"), 0);\nconsole.log("C");', ['A\nC\nB', 'A\nB\nC', 'B\nA\nC', 'A\nC'], 0, 'Even with 0 ms, the timer callback runs after the current code finishes.'),
        mc('What is the second argument of `setTimeout(fn, 500)`?', ['The delay in milliseconds', 'How many times to repeat', 'The seconds to wait', 'A name'], 0),
        tf('`setInterval` runs a function again and again until you clear it.', true),
      ]),
      lesson('js-10-2', 'Promises', [
        teach('A promise of a value', 'A **Promise** represents a value that will arrive later:\n\n```\nconst raven = new Promise((resolve) => {\n  setTimeout(() => resolve("A letter!"), 1000);\n});\nraven.then((msg) => console.log(msg));\n```\nA promise is **pending**, then **fulfilled** (it worked) or **rejected** (it failed).'),
        match('Match the promise state', [['pending', 'Still waiting'], ['fulfilled', 'Finished with a value'], ['rejected', 'Failed with an error']]),
        mc('Which method runs code when a promise is fulfilled?', ['.then()', '.wait()', '.done()', '.after()'], 0, undefined, { codeOptions: true }),
        mc('Which method handles a rejected promise?', ['.catch()', '.error()', '.fail()', '.else()'], 0, undefined, { codeOptions: true }),
      ]),
      lesson('js-10-3', 'async and await', [
        teach('Readable waiting', '```\nasync function getLetter() {\n  const msg = await raven;   // pause here until it arrives\n  console.log(msg);\n}\n```\n`await` only works inside an `async` function (or at the top of a module). It makes async code read like normal code.'),
        teach('When things fail', '```\nasync function load() {\n  try {\n    const data = await fetchSomething();\n    console.log(data);\n  } catch (err) {\n    console.log("Something went wrong:", err.message);\n  }\n}\n```'),
        fill('Wait for the promise', 'async function main() {\n  const reply = ___ sendRaven("Help!");\n  console.log(reply);\n}', ['await'], ['async', 'wait', 'then'], undefined, 'js'),
        bug('Which line has a bug?', 'async function loadMap() {\n  const res = fetch("/map.json");\n  const data = await res.json();\n  return data;\n}', 2, '`fetch` returns a promise, so it needs `await fetch(...)`.'),
        mc('Where can you use `await`?', ['Inside an async function (or a module top level)', 'Anywhere', 'Only in loops', 'Only in HTML'], 0),
        order('Handle an error around an awaited call', ['try {', '  const data = await load();', '  show(data);', '} catch (err) {', '  showError(err);', '}'], undefined, 'js'),
      ]),
      challenge('js-17', 'Challenge: The Messenger Ravens'),
    ]),
    unit('js-u11', 'Modern JavaScript', 'Modules, classes, errors and handy operators.', `
**Key ideas**
- **Modules**: \`export function x() {}\` / \`export default App\`; \`import App, { x } from "./file.js"\`.
- **Classes**: \`class Knight { constructor(name) { this.name = name; } greet() {} }\`; \`new Knight("Ada")\`; \`extends\` for inheritance.
- Errors: \`throw new Error("message")\`; \`try/catch/finally\`.
- Optional chaining: \`user?.address?.city\` (no crash on undefined).
- Nullish coalescing: \`value ?? "default"\` (only for null/undefined, unlike \`||\`).`, [
      lesson('js-11-1', 'Modules', [
        teach('Code in many files', 'Big programs are split into **modules** (files):\n\n```\n// math.js\nexport function add(a, b) { return a + b; }\nexport default function square(n) { return n * n; }\n\n// main.js\nimport square, { add } from "./math.js";\n```\nNamed exports use `{ }` when importing; a default export does not.'),
        mc('How do you import a **named** export called `add`?', ['import { add } from "./math.js"', 'import add from "./math.js"', 'require add from "./math.js"', 'include add'], 0, undefined, { codeOptions: true }),
        mc('How many default exports can a file have?', ['One', 'Unlimited', 'Zero', 'Two'], 0),
        fill('Export the function so other files can use it', '___ function heal(hp) {\n  return hp + 10;\n}', ['export'], ['public', 'import', 'share'], undefined, 'js'),
        tf('In Node.js you will also see the older `require()` and `module.exports` style.', true),
      ]),
      lesson('js-11-2', 'Classes', [
        teach('Blueprints for objects', '```\nclass Knight {\n  constructor(name) {\n    this.name = name;\n    this.hp = 100;\n  }\n  greet() {\n    return `I am ${this.name}`;\n  }\n}\nconst ada = new Knight("Ada");\nada.greet();   // "I am Ada"\n```'),
        out('class Knight {\n  constructor(name) {\n    this.name = name;\n  }\n}\nconst k = new Knight("Bo");\nconsole.log(k.name);', ['Bo', 'Knight', 'name', 'undefined'], 0),
        mc('What keyword creates an object from a class?', ['new', 'create', 'make', 'class'], 0),
        out('class Hero {\n  constructor() { this.level = 1; }\n  levelUp() { this.level++; }\n}\nconst h = new Hero();\nh.levelUp();\nh.levelUp();\nconsole.log(h.level);', ['3', '1', '2', 'undefined'], 0),
        tf('`class Mage extends Hero` makes Mage inherit Hero\'s methods.', true),
      ]),
      lesson('js-11-3', 'Errors', [
        teach('Throwing and catching', '```\nfunction withdraw(gold, amount) {\n  if (amount > gold) {\n    throw new Error("Not enough gold");\n  }\n  return gold - amount;\n}\n\ntry {\n  withdraw(10, 50);\n} catch (err) {\n  console.log(err.message);   // "Not enough gold"\n}\n```'),
        out('try {\n  throw new Error("Dragon attack!");\n} catch (e) {\n  console.log(e.message);\n}', ['Dragon attack!', 'Error', 'e.message', 'Nothing'], 0),
        out('try {\n  console.log("A");\n} catch (e) {\n  console.log("B");\n} finally {\n  console.log("C");\n}', ['A\nC', 'A\nB\nC', 'A', 'C'], 0, '`finally` always runs. `catch` only runs when there is an error.'),
        match('Match the error with its usual cause', [['ReferenceError', 'A name that does not exist'], ['TypeError', 'Using a value the wrong way'], ['SyntaxError', 'Broken code (missing bracket...)']]),
      ]),
      lesson('js-11-4', 'Handy operators', [
        teach('?. and ??', '```\nconst city = user?.address?.city;    // undefined instead of a crash\nconst name = input ?? "stranger";      // default only for null/undefined\n```\n`||` also gives defaults, but for **any** falsy value: `0 || 10` is `10`, while `0 ?? 10` is `0`.'),
        out('const user = {};\nconsole.log(user.address?.city);', ['undefined', 'Error', 'null', '""'], 0),
        out('console.log(0 ?? 10, 0 || 10);', ['0 10', '10 10', '0 0', '10 0'], 0),
        out('const name = null;\nconsole.log(name ?? "stranger");', ['stranger', 'null', 'undefined', 'name'], 0),
        mc('Which prevents "Cannot read properties of undefined"?', ['Optional chaining ?.', 'The ++ operator', 'The spread ...', 'typeof'], 0),
      ]),
      challenge('js-20', 'Project: The Quest Board App'),
    ]),
  ],
};
