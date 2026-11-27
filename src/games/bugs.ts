// The arcade's fixed Bug Hunt spells (JavaScript). Path stops use bugs from your lessons.
import type { BugRound } from './data';

export const BUGS: BugRound[] = [
  { code: 'let gold = 10;\ngold = gold + 5;\nconsole.log("Gold: " + Gold);', line: 3, why: 'Names are case-sensitive: `Gold` is not `gold`.' },
  { code: 'const knights = ["Ada", "Bo", "Cy"];\nfor (let i = 0; i <= knights.length; i++) {\n  console.log(knights[i]);\n}', line: 2, why: 'Off by one! Indexes go from 0 to length - 1, so use `<`, not `<=`.' },
  { code: 'let hp = 0;\nif (hp = 0) {\n  console.log("Game over");\n}', line: 2, why: '`=` assigns a value. To compare, use `===`.' },
  { code: 'const score = 0;\nscore = score + 10;\nconsole.log(score);', line: 1, also: 2, why: 'A `const` can never change, so line 2 fails. Declare it with `let` on line 1.' },
  { code: 'function double(n) {\n  n * 2;\n}\nconsole.log(double(4));', line: 2, why: 'The function forgot to `return` its result, so it gives back `undefined`.' },
  { code: 'let i = 0;\nwhile (i < 3) {\n  console.log(i);\n  i--;\n}', line: 4, why: '`i--` makes i smaller, so `i < 3` stays true forever. An endless loop! Use `i++`.' },
  { code: 'const gems = ["ruby", "emerald", "sapphire"];\nconst last = gems[gems.length];\nconsole.log(last);', line: 2, why: 'The last item is at `gems.length - 1`. `gems[gems.length]` is `undefined`.' },
  { code: 'const input = "7";\nif (input === 7) {\n  console.log("Lucky seven!");\n}', line: 2, why: '`"7"` (text) is not `7` (number). Convert first with `Number(input)`.' },
  { code: 'const names = ["ada", "bo"];\nnames.push("cy");\nconsole.log(names.lenght);', line: 3, why: 'Typo: it is `length`, not `lenght`.' },
  { code: 'const hero = { name: "Ada", level: 3 };\nhero.level++;\nconsole.log(hero.Name);', line: 3, why: 'Property names are case-sensitive: `name`, not `Name`.' },
  { code: 'const prices = [1, 2, 3];\nconst doubled = prices.map((p) => { p * 2 });\nconsole.log(doubled);', line: 2, why: 'With curly braces, an arrow function needs `return`. Write `(p) => p * 2`.' },
  { code: 'const btn = document.querySelector("#start");\nbtn.addEventListener("click", startGame());\nfunction startGame() { console.log("Go!"); }', line: 2, why: '`startGame()` runs the function right away. Pass it without brackets: `startGame`.' },
  { code: 'async function loadMap() {\n  const res = fetch("/map.json");\n  const data = await res.json();\n  return data;\n}', line: 2, why: '`fetch` returns a Promise. You must `await fetch(...)` before reading it.' },
  { code: 'const age = 12;\nif (age > 18) {\n  console.log("Too young to ride the dragon");\n}', line: 2, why: 'The condition is backwards: "too young" means `age < 18`.' },
  { code: 'function greet(name) {\n  return "Hail, " + name + "!";\n}\ngreet("Ada");', line: 4, why: 'The greeting is returned but never printed. Use `console.log(greet("Ada"))`.' },
  { code: 'const door = document.querySelector(".door");\ndoor.style.color = red;\nconsole.log("Painted!");', line: 2, why: 'CSS values are text in JavaScript: `"red"` needs quotes.' },
];
